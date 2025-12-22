import { Request, Response } from 'express';
import { sendMail } from '../configs/mailer';
import logger from '../configs/logger';

class SolicitudServicioController {
  static async crear(req: Request, res: Response) {
    const { servicio, nombre, email, telefono, comentarios } = req.body || {};

    if (!servicio || !nombre || !email) {
      return res.status(400).json({ message: 'servicio, nombre y email son requeridos' });
    }

    const subject = `Solicitud de servicio: ${servicio}`;
    const html = `
      <h3>Solicitud de servicio</h3>
      <ul>
        <li><strong>Servicio:</strong> ${servicio}</li>
        <li><strong>Nombre:</strong> ${nombre}</li>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Teléfono:</strong> ${telefono || '-'}</li>
      </ul>
      <p><strong>Comentarios:</strong></p>
      <p>${comentarios || '-'}</p>
    `;

    try {
      await sendMail({
        to: 'federicoberon@outlook.com',
        subject,
        html,
      });
      res.status(201).json({ message: 'Solicitud enviada' });
    } catch (error) {
      logger.error('Error al enviar solicitud de servicio', error);
      res.status(500).json({ message: 'Error al enviar solicitud de servicio', error });
    }
  }
}

export default SolicitudServicioController;
