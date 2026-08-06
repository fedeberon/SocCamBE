import qrcode from 'qrcode';
import sequelize from '../configs/database';

let Client: any;
let LocalAuth: any;

try {
  const wwebjs = require('whatsapp-web.js');
  Client = wwebjs.Client;
  LocalAuth = wwebjs.LocalAuth;
} catch (err) {
  console.warn('[WhatsApp] whatsapp-web.js no disponible -', (err as Error).message);
}

let client: any = null;
let qrCode: string | null = null;
let connectionStatus: string = 'disconnected';
let qrDataUrl: string | null = null;
let waAvailable = !!Client;

export const isAvailable = () => waAvailable;

export const getDebugInfo = () => {
  const info: any = {
    available: waAvailable,
    status: connectionStatus,
    clientExists: !!client,
    hasQR: !!qrCode,
    hasQRDataUrl: !!qrDataUrl,
  };

  if (client) {
    try {
      info.info = client.info;
      info.waVersion = client.info?.wa_version;
      info.pushname = client.info?.pushname;
      info.phone = client.info?.wid?.user;
    } catch (err: any) {
      info.infoError = err.message;
    }
  }

  return info;
};

export const getChatsFromStore = async () => {
  const c = getClient();
  try {
    const storeData = await c.pupPage.evaluate(async () => {
      try {
        const w = window as any;
        const wwebjs = w.WWebJS;
        if (!wwebjs?.getChats) return { error: 'WWebJS.getChats not found' };
        const result = await wwebjs.getChats();
        return { type: typeof result, isArray: Array.isArray(result), count: Array.isArray(result) ? result.length : 'N/A' };
      } catch (e: any) {
        return { idbError: e.message };
      }
    });
    console.log('[WhatsApp] Store debug:', JSON.stringify(storeData));
    return storeData;
  } catch (err: any) {
    console.error('[WhatsApp] Store debug error:', err.message);
    return { error: err.message };
  }
};

export const getChatsFromDOM = async () => {
  const c = getClient();
  try {
    const chats = await c.pupPage.evaluate(() => {
      const chatElements = document.querySelectorAll('[data-testid="cell-frame-container"]');
      const results: any[] = [];
      chatElements.forEach((el) => {
        try {
          const titleEl = el.querySelector('[data-testid="cell-frame-title"] span');
          const subtitleEl = el.querySelector('[data-testid="last-msg-status"]');
          const unreadEl = el.querySelector('[data-testid="icon-unread-count"]');
          const idAttr = el.getAttribute('data-testid');
          const chatId = el.querySelector('div[id]')?.id || '';

          results.push({
            id: chatId,
            name: titleEl?.textContent || '',
            lastMessage: subtitleEl?.textContent || '',
            unreadCount: unreadEl ? 1 : 0,
          });
        } catch (_) {}
      });
      return results;
    });
    console.log(`[WhatsApp] DOM chats: ${chats.length}`);
    return chats;
  } catch (err: any) {
    console.error('[WhatsApp] DOM error:', err.message);
    return [];
  }
};

const initClient = (): any => {
  if (client) return client;
  if (!Client) throw new Error('whatsapp-web.js no disponible');

  const isDocker = !!process.env.DOCKER;
  const puppeteerConfig: any = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  };

  if (isDocker) {
    puppeteerConfig.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium';
  } else {
    puppeteerConfig.executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  }

  console.log('[WhatsApp] Inicializando cliente...');
  client = new Client({
    authStrategy: new LocalAuth({ dataPath: './whatsapp-session' }),
    puppeteer: puppeteerConfig,
  });

  client.on('qr', async (qr: string) => {
    console.log('[WhatsApp] QR raw recibido, generando imagen...');
    qrCode = qr;
    connectionStatus = 'qr_pending';
    try {
      qrDataUrl = await qrcode.toDataURL(qr);
      console.log('[WhatsApp] QR imagen generada OK');
    } catch (err) {
      console.error('[WhatsApp] Error generando QR imagen:', err);
    }
  });

  client.on('ready', () => {
    connectionStatus = 'connected';
    qrCode = null;
    qrDataUrl = null;
    console.log('[WhatsApp] Cliente conectado');
  });

  client.on('authenticated', () => {
    connectionStatus = 'authenticated';
    console.log('[WhatsApp] Autenticado');
  });

  client.on('auth_failure', (msg: any) => {
    connectionStatus = 'auth_failure';
    console.error('[WhatsApp] Fallo de autenticación:', msg);
  });

  client.on('disconnected', (reason: any) => {
    connectionStatus = 'disconnected';
    qrCode = null;
    qrDataUrl = null;
    console.log('[WhatsApp] Desconectado:', reason);
  });

  client.on('message', async (msg: any) => {
    try {
      const chat = await msg.getChat();
      const contact = await msg.getContact();
      const phone = chat.id._serialized;
      const name = contact.pushname || contact.name || phone;
      const body = msg.body;
      const timestamp = new Date(msg.timestamp * 1000);

      await sequelize.query(`
        IF OBJECT_ID('dbo.whatsapp_messages', 'U') IS NULL
        CREATE TABLE dbo.whatsapp_messages (
          id INT IDENTITY(1,1) PRIMARY KEY,
          chat_id NVARCHAR(255) NOT NULL,
          chat_name NVARCHAR(255) NULL,
          phone_number NVARCHAR(50) NULL,
          message NVARCHAR(MAX) NULL,
          from_me BIT NOT NULL DEFAULT 0,
          message_timestamp DATETIME2 NOT NULL,
          created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
        )
      `);

      await sequelize.query(`
        INSERT INTO dbo.whatsapp_messages (chat_id, chat_name, phone_number, message, from_me, message_timestamp)
        VALUES (:chat_id, :chat_name, :phone_number, :message, 0, :timestamp)
      `, {
        replacements: {
          chat_id: phone,
          chat_name: name,
          phone_number: phone,
          message: body,
          timestamp,
        },
      });
    } catch (err) {
      console.error('[WhatsApp] Error guardando mensaje recibido:', err);
    }
  });

  client.initialize();
  return client;
};

export const getClient = () => {
  if (!client) initClient();
  return client;
};

export const getQR = () => qrDataUrl;
export const getStatus = () => connectionStatus;

export const sendMessage = async (phone: string, message: string) => {
  const c = getClient();
  const chatId = phone.includes('@c.us') ? phone : `${phone.replace(/[^0-9]/g, '')}@c.us`;
  const sent = await c.sendMessage(chatId, message);

  try {
    await sequelize.query(`
      INSERT INTO dbo.whatsapp_messages (chat_id, chat_name, phone_number, message, from_me, message_timestamp)
      VALUES (:chat_id, :chat_name, :phone_number, :message, 1, :timestamp)
    `, {
      replacements: {
        chat_id: chatId,
        chat_name: null,
        phone_number: phone,
        message,
        timestamp: new Date(),
      },
    });
  } catch (err) {
    console.error('[WhatsApp] Error guardando mensaje enviado:', err);
  }

  return sent;
};

export const getChats = async () => {
  const c = getClient();
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      console.log(`[WhatsApp] getChats intento ${attempt + 1}, status: ${connectionStatus}`);

      // Intentar via WWebJS Store
      const storeResult = await c.pupPage.evaluate(async () => {
        try {
          const w = window as any;
          const wwebjs = w.WWebJS;
          if (!wwebjs?.getChats) return null;
          const result = await wwebjs.getChats();
          if (Array.isArray(result)) return result;
          if (result instanceof Map) return Array.from(result.values());
          return null;
        } catch (e: any) {
          return { idbError: e.message };
        }
      });

      if (storeResult && !storeResult.idbError && Array.isArray(storeResult) && storeResult.length > 0) {
        console.log(`[WhatsApp] getChats via WWebJS: ${storeResult.length} chats`);
        return storeResult
          .sort((a: any, b: any) => (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0))
          .slice(0, 100)
          .map((chat: any) => ({
            id: chat.id?._serialized || chat.id,
            name: chat.name || chat.id?._serialized || chat.id,
            lastMessage: chat.lastMessage?.body || '',
            timestamp: chat.lastMessage?.timestamp ? new Date(chat.lastMessage.timestamp * 1000) : null,
            unreadCount: chat.unreadCount || 0,
          }));
      }

      if (storeResult?.idbError) {
        console.log(`[WhatsApp] Store falló (${storeResult.idbError}), intentando DOM...`);
      }

      // Intentar via DOM con múltiples estrategias
      const domChats = await (c.pupPage.evaluate as any)(() => {
        const chatElements = document.querySelectorAll('[data-testid="cell-frame-container"]');
        const results: any[] = [];
        chatElements.forEach((el) => {
          try {
            const titleEl = el.querySelector('[data-testid="cell-frame-title"] span');
            const subtitleEl = el.querySelector('[data-testid="last-msg-status"]');
            const name = titleEl?.textContent || '';

            // Estrategia 1: data-testid con link de envío
            let chatId = '';
            const linkEl = el.querySelector('a[href*="send?phone="]');
            if (linkEl) {
              const href = linkEl.getAttribute('href') || '';
              const match = href.match(/phone=([^&]+)/);
              if (match) {
                chatId = match[1] + '@c.us';
              }
            }

            // Estrategia 2: buscar data-id
            if (!chatId) {
              const dataIdEl = el.querySelector('[data-id]');
              if (dataIdEl) {
                chatId = dataIdEl.getAttribute('data-id') || '';
              }
            }

            // Estrategia 3: buscar en atributos data-testid del padre
            if (!chatId) {
              const parent = el.closest('[data-testid]');
              if (parent) {
                const pid = parent.getAttribute('data-testid') || '';
                if (pid.includes('@')) chatId = pid;
              }
            }

            // Estrategia 4: React internals - subir por el árbol de fibers
            if (!chatId) {
              const allKeys = Object.getOwnPropertyNames(el);
              const fiberKey = allKeys.find((k: string) => k.startsWith('__reactFiber$'));
              if (fiberKey) {
                try {
                  let node = (el as any)[fiberKey];
                  for (let i = 0; i < 50 && node; i++) {
                    const props = node.memoizedProps || {};
                    if (props.id && typeof props.id === 'string' && props.id.includes('@')) {
                      chatId = props.id;
                      break;
                    }
                    if (props.chat?.id?._serialized) { chatId = props.chat.id._serialized; break; }
                    if (props.chat?.id && typeof props.chat.id === 'string' && props.chat.id.includes('@')) { chatId = props.chat.id; break; }
                    if (props.contact?.id?._serialized) { chatId = props.contact.id._serialized; break; }
                    if (props._serialized && typeof props._serialized === 'string' && props._serialized.includes('@')) { chatId = props._serialized; break; }
                    node = node.return;
                  }
                } catch (_) {}
              }
            }

            // Estrategia 5: construir desde el nombre (si es numérico)
            if (!chatId && name) {
              const cleaned = name.replace(/\D/g, '');
              if (cleaned.length >= 8) {
                chatId = cleaned + '@c.us';
              }
            }

            results.push({
              id: chatId,
              name,
              lastMessage: subtitleEl?.textContent || '',
              timestamp: null,
              unreadCount: 0,
            });
          } catch (_) {}
        });
        return results;
      });

      if (domChats.length > 0) {
        console.log(`[WhatsApp] getChats via DOM: ${domChats.length} chats`);
        return domChats;
      }

      console.log(`[WhatsApp] getChats: 0 chats, esperando 5s...`);
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 5000));
      }
    } catch (err: any) {
      console.error(`[WhatsApp] Error getChats intento ${attempt + 1}:`, err.message);
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }
  return [];
};

export const getMessages = async (chatId: string, limit = 50) => {
  const c = getClient();

  // Estrategia 1: usar client.getChatById() (Node.js API) + chat.fetchMessages()
  try {
    const chat = await c.getChatById(chatId);
    const msgs = await chat.fetchMessages({ limit });
    if (msgs && msgs.length > 0) {
      console.log(`[WhatsApp] getMessages via client.getChatById: ${msgs.length} msgs`);
      return msgs.map((m: any) => ({
        id: m.id?.id || m.id?._serialized || m.id,
        chat_id: chatId,
        message: m.body || '',
        from_me: m.fromMe || false,
        message_timestamp: m.timestamp ? new Date(m.timestamp * 1000).toISOString() : null,
        chat_name: chat.name || '',
        phone_number: chatId,
      }));
    }
    console.log(`[WhatsApp] getMessages client.getChatById: 0 msgs for ${chatId}`);
  } catch (e: any) {
    console.log(`[WhatsApp] getMessages client.getChatById error: ${e.message}`);
  }

  // Estrategia 2: resolver @lid → @c.us y reintentar
  if (chatId.endsWith('@lid')) {
    try {
      const contact = await c.getContactById(chatId);
      if (contact?.number) {
        const phoneChatId = contact.number.replace(/[^0-9]/g, '') + '@c.us';
        console.log(`[WhatsApp] resolved @lid ${chatId} → ${phoneChatId}`);
        try {
          const chat = await c.getChatById(phoneChatId);
          const msgs = await chat.fetchMessages({ limit });
          if (msgs && msgs.length > 0) {
            console.log(`[WhatsApp] getMessages via resolved @c.us: ${msgs.length} msgs`);
            return msgs.map((m: any) => ({
              id: m.id?.id || m.id?._serialized || m.id,
              chat_id: chatId,
              message: m.body || '',
              from_me: m.fromMe || false,
              message_timestamp: m.timestamp ? new Date(m.timestamp * 1000).toISOString() : null,
              chat_name: chat.name || '',
              phone_number: chatId,
            }));
          }
        } catch (e2: any) {
          console.log(`[WhatsApp] getMessages resolved @c.us error: ${e2.message}`);
        }
      }
    } catch (e: any) {
      console.log(`[WhatsApp] getContactById for @lid error: ${e.message}`);
    }
  }

  // Estrategia 3: buscar en DB con chat_id y también con phone patterns
  try {
    const [rows] = await sequelize.query(`
      SELECT TOP (${limit}) * FROM dbo.whatsapp_messages
      WHERE chat_id = :chatId
      ORDER BY message_timestamp DESC
    `, { replacements: { chatId } });
    if ((rows as any[]).length > 0) {
      console.log(`[WhatsApp] getMessages via DB: ${(rows as any[]).length} msgs`);
      return rows;
    }
  } catch (err) {
    console.error('[WhatsApp] Error DB getMessages:', err);
  }

  // Estrategia 4: buscar en DB por phone_number
  if (chatId.endsWith('@lid')) {
    try {
      const [rows] = await sequelize.query(`
        SELECT TOP (${limit}) * FROM dbo.whatsapp_messages
        WHERE phone_number = :chatId
        ORDER BY message_timestamp DESC
      `, { replacements: { chatId } });
      if ((rows as any[]).length > 0) {
        console.log(`[WhatsApp] getMessages via DB phone: ${(rows as any[]).length} msgs`);
        return rows;
      }
    } catch (_) {}
  }

  console.log(`[WhatsApp] getMessages: 0 msgs for ${chatId}`);
  return [];
};

export const disconnect = async () => {
  if (client) {
    try {
      await client.logout();
    } catch (_) {}
    try {
      await client.destroy();
    } catch (_) {}
    client = null;
    connectionStatus = 'disconnected';
    qrCode = null;
    qrDataUrl = null;
    console.log('[WhatsApp] Desconectado y destruido');
  }
};

export const searchChats = async (query: string) => {
  const chats = await getChats();
  const q = query.toLowerCase();
  return chats
    .filter(
      (c: any) =>
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q),
    )
    .slice(0, 50);
};

export const debugSidebarDOM = async () => {
  const c = getClient();
  return await c.pupPage.evaluate(() => {
    const containers = document.querySelectorAll('[data-testid="cell-frame-container"]');
    const sample: any[] = [];
    for (let i = 0; i < Math.min(3, containers.length); i++) {
      const el = containers[i] as HTMLElement;
      const name = el.querySelector('[data-testid="cell-frame-title"] span')?.getAttribute('title') || '';

      // Encontrar la key del React fiber de varias formas
      const allKeys = Object.getOwnPropertyNames(el);
      const fiberKey = allKeys.find(k => k.startsWith('__reactFiber$'));
      const propsKey = allKeys.find(k => k.startsWith('__reactProps$'));

      let chatIdFound = '';
      let fiberInfo: any = { allKeysCount: allKeys.length, fiberKey: !!fiberKey, propsKey: !!propsKey };
      let fiberDebug: any[] = [];

      if (fiberKey) {
        try {
          let node = (el as any)[fiberKey];
          for (let j = 0; j < 50 && node; j++) {
            const typeName = typeof node.type === 'function' ? (node.type?.name || 'Func') : (node.type || 'null');
            const props = node.memoizedProps || {};

            // Extraer todo lo relevante de props
            const propsSummary: any = {};
            for (const pk of Object.keys(props)) {
              const val = props[pk];
              if (pk === 'id' || pk === 'chatId' || pk === '_serialized') {
                propsSummary[pk] = val;
                if (typeof val === 'string' && val.includes('@')) chatIdFound = val;
              }
              if (pk === 'chat' && val && typeof val === 'object') {
                propsSummary.chat = {
                  id: val.id,
                  _serialized: val._serialized,
                  idSerialized: val.id?._serialized,
                };
                if (val.id?._serialized) chatIdFound = val.id._serialized;
                else if (val._serialized) chatIdFound = val._serialized;
                else if (typeof val.id === 'string' && val.id.includes('@')) chatIdFound = val.id;
              }
              if (pk === 'contact' && val && typeof val === 'object') {
                propsSummary.contact = {
                  id: val.id,
                  _serialized: val._serialized,
                  idSerialized: val.id?._serialized,
                };
                if (val.id?._serialized) chatIdFound = val.id._serialized;
              }
            }

            if (Object.keys(propsSummary).length > 0 || typeName !== 'div') {
              fiberDebug.push({ level: j, type: typeName, props: propsSummary });
            }

            if (chatIdFound) break;
            node = node.return;
          }
        } catch (e: any) {
          fiberInfo.fiberError = e.message;
        }
      }

      sample.push({ name, chatIdFound, fiberInfo, fiberDebug: fiberDebug.slice(0, 10) });
    }
    return { totalContainers: containers.length, sample };
  });
};

export const debugMessagesDOM = async () => {
  const c = getClient();
  return await c.pupPage.evaluate(() => {
    const w = window as any;

    // Ver qué hay en window.Store
    const storeKeys = w.Store ? Object.keys(w.Store) : [];
    const storeChatInfo: any = {};
    if (w.Store?.Chat) {
      try {
        const chats = w.Store.Chat.getModelsArray ? w.Store.Chat.getModelsArray() : [];
        storeChatInfo.count = chats.length;
        storeChatInfo.firstChatId = chats[0]?._serialized || chats[0]?.id || 'N/A';
      } catch (e: any) {
        storeChatInfo.error = e.message;
      }
    }

    // Ver WWebJS
    const wwebjsKeys = w.WWebJS ? Object.keys(w.WWebJS) : [];

    // Intentar obtener mensajes de un chat conocido
    let storeMsgResult: any = null;
    if (w.Store?.Chat) {
      try {
        const models = w.Store.Chat.getModelsArray ? w.Store.Chat.getModelsArray() : [];
        if (models.length > 0) {
          const firstChat = models[0];
          storeMsgResult = {
            chatId: firstChat._serialized || firstChat.id,
            name: firstChat.name,
            hasMessages: !!firstChat.messages,
            msgType: typeof firstChat.messages,
            msgKeys: firstChat.messages ? Object.keys(firstChat.messages).slice(0, 20) : [],
          };
          if (firstChat.messages?.getModelsArray) {
            const msgs = firstChat.messages.getModelsArray();
            storeMsgResult.msgCount = msgs.length;
            if (msgs.length > 0) {
              storeMsgResult.sampleMsg = {
                body: msgs[0].body,
                fromMe: msgs[0].fromMe,
                timestamp: msgs[0].timestamp,
                id: msgs[0].id,
              };
            }
          }
        }
      } catch (e: any) {
        storeMsgResult = { error: e.message };
      }
    }

    // Verificar si hay modelos de msg
    const hasMsgStore = !!w.Store?.Msg;
    const hasMsgCollection = !!w.Store?.MsgCollection;

    return {
      hasStore: !!w.Store,
      storeKeys: storeKeys.slice(0, 30),
      storeChatInfo,
      hasMsgStore,
      hasMsgCollection,
      wwebjsKeys,
      storeMsgResult,
    };
  });
};
