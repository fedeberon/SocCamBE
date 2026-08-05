import { Request, Response } from 'express';
import * as waClient from './client';

class WhatsAppController {
  static unavailable(req: Request, res: Response) {
    return res.status(503).json({
      message: 'WhatsApp no disponible - whatsapp-web.js o Chrome no instalado en el servidor',
      available: false,
    });
  }

  static async getQR(req: Request, res: Response) {
    if (!waClient.isAvailable()) return WhatsAppController.unavailable(req, res);
    try {
      const qr = waClient.getQR();
      const status = waClient.getStatus();
      return res.status(200).json({ qr, status });
    } catch (error) {
      return res.status(500).json({ message: 'Error obteniendo QR', error });
    }
  }

  static async getStatus(req: Request, res: Response) {
    if (!waClient.isAvailable()) return WhatsAppController.unavailable(req, res);
    try {
      const status = waClient.getStatus();
      return res.status(200).json({ status });
    } catch (error) {
      return res.status(500).json({ message: 'Error obteniendo estado', error });
    }
  }

  static async connect(req: Request, res: Response) {
    if (!waClient.isAvailable()) return WhatsAppController.unavailable(req, res);
    try {
      waClient.getClient();
      return res.status(200).json({ message: 'Cliente inicializado' });
    } catch (error) {
      return res.status(500).json({ message: 'Error conectando', error });
    }
  }

  static async getChats(req: Request, res: Response) {
    if (!waClient.isAvailable()) return WhatsAppController.unavailable(req, res);
    try {
      const chats = await waClient.getChats();
      return res.status(200).json(chats);
    } catch (error) {
      return res.status(500).json({ message: 'Error obteniendo chats', error });
    }
  }

  static async searchChats(req: Request, res: Response) {
    if (!waClient.isAvailable()) return WhatsAppController.unavailable(req, res);
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({ message: 'Parámetro q requerido' });
      }
      const chats = await waClient.searchChats(String(q));
      return res.status(200).json(chats);
    } catch (error) {
      return res.status(500).json({ message: 'Error buscando chats', error });
    }
  }

  static async getMessages(req: Request, res: Response) {
    if (!waClient.isAvailable()) return WhatsAppController.unavailable(req, res);
    try {
      const { chatId } = req.params;
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      const messages = await waClient.getMessages(chatId, limit);
      return res.status(200).json(messages);
    } catch (error) {
      return res.status(500).json({ message: 'Error obteniendo mensajes', error });
    }
  }

  static async sendMessage(req: Request, res: Response) {
    if (!waClient.isAvailable()) return WhatsAppController.unavailable(req, res);
    try {
      const { phone, message } = req.body;
      if (!phone || !message) {
        return res.status(400).json({ message: 'phone y message son requeridos' });
      }
      const sent = await waClient.sendMessage(phone, message);
      return res.status(200).json({ message: 'Mensaje enviado', id: sent.id });
    } catch (error) {
      return res.status(500).json({ message: 'Error enviando mensaje', error });
    }
  }

  static async disconnect(req: Request, res: Response) {
    if (!waClient.isAvailable()) return WhatsAppController.unavailable(req, res);
    try {
      await waClient.disconnect();
      return res.status(200).json({ message: 'Desconectado' });
    } catch (error) {
      return res.status(500).json({ message: 'Error desconectando', error });
    }
  }
}

export default WhatsAppController;
