import { Request, Response } from 'express';
import logger from '../configs/logger';

type Servicio = {
  id: number;
  nombre: string;
  descripcion?: string;
  categoria?: string;
  activo: boolean;
};

const servicios: Servicio[] = [
  { id: 1, nombre: 'Caja de seguridad', descripcion: 'Servicio de caja de seguridad', categoria: 'Seguridad', activo: true },
  { id: 2, nombre: 'IOMA Empresarial', descripcion: 'Cobertura de salud empresarial', categoria: 'Salud', activo: true },
];

class ServiciosController {
  static async listar(req: Request, res: Response) {
    try {
      res.status(200).json(servicios);
    } catch (error) {
      logger.error('Error al obtener servicios', error);
      res.status(500).json({ message: 'Error al obtener servicios', error });
    }
  }

  static async crearAsociacion(req: Request, res: Response) {
    const { socioId, servicioId, notas, contacto } = req.body || {};

    if (!socioId || !servicioId) {
      return res.status(400).json({ message: 'socioId y servicioId son requeridos' });
    }

    const servicio = servicios.find((s) => s.id === Number(servicioId));
    if (!servicio) {
      return res.status(404).json({ message: 'Servicio no encontrado' });
    }

    // En esta versión no se persiste en DB; solo devolvemos la carga recibida
    const asociacion = {
      id: Date.now(),
      socioId: Number(socioId),
      servicioId: Number(servicioId),
      notas,
      contacto,
      createdAt: new Date().toISOString(),
    };

    try {
      res.status(201).json(asociacion);
    } catch (error) {
      logger.error('Error al crear asociación socio-servicio', error);
      res.status(500).json({ message: 'Error al crear asociación socio-servicio', error });
    }
  }
}

export default ServiciosController;
