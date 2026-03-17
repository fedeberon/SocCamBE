import { Request, Response } from 'express';
import { sendMail } from '../configs/mailer';
import logger from '../configs/logger';
import SolicitudServicio from '../models/SolicitudServicio.models';
import SocioServicio from '../models/SocioServicio.models';

class SolicitudServicioController {
  static async crear(req: Request, res: Response) {
    const { servicio, nombre, email, telefono, comentarios, socioId, servicioId } = req.body || {};

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
        <li><strong>Socio ID:</strong> ${socioId || '-'}</li>
        <li><strong>Servicio ID:</strong> ${servicioId || '-'}</li>
      </ul>
      <p><strong>Comentarios:</strong></p>
      <p>${comentarios || '-'}</p>
    `;

    try {
      const solicitud = await SolicitudServicio.create({
        socio_id: socioId ? Number(socioId) : null,
        servicio_id: servicioId ? Number(servicioId) : null,
        servicio,
        nombre,
        email,
        telefono,
        comentarios,
        estado: 'pendiente',
      } as any);

      await sendMail({
        to: 'federicoberon@outlook.com',
        subject,
        html,
      });
      res.status(201).json({ message: 'Solicitud enviada', solicitud });
    } catch (error) {
      logger.error('Error al enviar solicitud de servicio', error);
      res.status(500).json({ message: 'Error al enviar solicitud de servicio', error });
    }
  }

  static async listar(req: Request, res: Response) {
    try {
      const socioId = req.query?.socioId ? Number(req.query.socioId) : null;
      const estado = (req.query?.estado as string) || 'pendiente';
      const where: any = {};
      if (estado) where.estado = estado;
      if (socioId) where.socio_id = socioId;

      const solicitudes = await SolicitudServicio.findAll({ where, order: [['creado_en', 'DESC']] });
      res.status(200).json(solicitudes);
    } catch (error) {
      logger.error('Error al listar solicitudes de servicio', error);
      res.status(500).json({ message: 'Error al listar solicitudes de servicio', error });
    }
  }

  static async aprobar(req: Request, res: Response) {
    const solicitudId = Number(req.params.solicitudId);
    if (Number.isNaN(solicitudId)) {
      return res.status(400).json({ message: 'solicitudId inválido' });
    }

    try {
      const solicitud: any = await SolicitudServicio.findByPk(solicitudId);
      if (!solicitud) return res.status(404).json({ message: 'Solicitud no encontrada' });
      if (solicitud.estado === 'aprobada') return res.status(200).json({ message: 'Solicitud ya aprobada' });

      if (!solicitud.socio_id || !solicitud.servicio_id) {
        return res.status(400).json({ message: 'La solicitud no tiene socio_id/servicio_id para aprobar automáticamente' });
      }

      const existente = await SocioServicio.findOne({ where: { socio_id: solicitud.socio_id, servicio_id: solicitud.servicio_id } });
      if (!existente) {
        await SocioServicio.create({
          socio_id: solicitud.socio_id,
          servicio_id: solicitud.servicio_id,
          notas: solicitud.comentarios || null,
          contacto_nombre: solicitud.nombre || null,
          contacto_email: solicitud.email || null,
          contacto_telefono: solicitud.telefono || null,
        } as any);
      }

      await solicitud.update({ estado: 'aprobada', aprobado_en: new Date() });
      res.status(200).json({ message: 'Solicitud aprobada y servicio asociado' });
    } catch (error) {
      logger.error('Error al aprobar solicitud de servicio', error);
      res.status(500).json({ message: 'Error al aprobar solicitud de servicio', error });
    }
  }
}

export default SolicitudServicioController;
