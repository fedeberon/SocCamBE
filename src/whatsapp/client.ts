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

      // Intentar via DOM
      const domChats = await c.pupPage.evaluate(() => {
        const chatElements = document.querySelectorAll('[data-testid="cell-frame-container"]');
        const results: any[] = [];
        chatElements.forEach((el) => {
          try {
            const titleEl = el.querySelector('[data-testid="cell-frame-title"] span');
            const subtitleEl = el.querySelector('[data-testid="last-msg-status"]');
            const chatId = el.querySelector('div[id]')?.id || '';
            results.push({
              id: chatId,
              name: titleEl?.textContent || '',
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
  try {
    const [rows] = await sequelize.query(`
      SELECT TOP (${limit}) * FROM dbo.whatsapp_messages
      WHERE chat_id = :chatId
      ORDER BY message_timestamp DESC
    `, { replacements: { chatId } });
    return rows;
  } catch (err) {
    console.error('[WhatsApp] Error obteniendo mensajes:', err);
    return [];
  }
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
