import { Router } from 'express';
import WhatsAppController from './whatsapp.controller';

const router = Router();

router.get('/qr', WhatsAppController.getQR);
router.get('/status', WhatsAppController.getStatus);
router.post('/connect', WhatsAppController.connect);
router.get('/chats', WhatsAppController.getChats);
router.get('/chats/search', WhatsAppController.searchChats);
router.get('/chats/:chatId/messages', WhatsAppController.getMessages);
router.post('/send', WhatsAppController.sendMessage);
router.post('/disconnect', WhatsAppController.disconnect);

export default router;
