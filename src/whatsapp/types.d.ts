declare module 'whatsapp-web.js' {
  export class Client {
    constructor(options: any);
    on(event: string, callback: (...args: any[]) => void): void;
    initialize(): Promise<void>;
    destroy(): Promise<void>;
    logout(): Promise<void>;
    sendMessage(chatId: string, message: string): Promise<any>;
    getChats(): Promise<any[]>;
  }
  export class LocalAuth {
    constructor(options: { dataPath: string });
  }
  export interface Message {
    body: string;
    from: string;
    timestamp: number;
    getChat(): Promise<any>;
    getContact(): Promise<any>;
  }
}
