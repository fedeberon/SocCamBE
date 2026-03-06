import { Request, Response } from 'express';
import logger from '../configs/logger';
import ComercioPuntos from '../models/ComercioPuntos.models';
import SocioPuntos from '../models/SocioPuntos.models';
import Socio from '../models/socio.models';
import azureBlobService from '../service/azureBlob.service';
import { Op } from 'sequelize';

class PuntosController {
  private static async findComerciosSafe() {
    try {
      return await ComercioPuntos.findAll({ order: [['nombre', 'ASC']] });
    } catch (error: any) {
      // Compat: si la columna logo_url aún no existe en DB, continuamos sin ella.
      const msg = String(error?.message || '');
      if (msg.toLowerCase().includes('logo_url') || msg.toLowerCase().includes('invalid column')) {
        return await ComercioPuntos.findAll({
          attributes: ['comercio_id', 'nombre', 'activo', 'puntos_por_carga'],
          order: [['nombre', 'ASC']],
        });
      }
      throw error;
    }
  }

  static async getComercios(_req: Request, res: Response) {
    try {
      const items = await PuntosController.findComerciosSafe();
      return res.status(200).json(items);
    } catch (error) {
      logger.error('Error al obtener comercios de puntos', error);
      return res.status(500).json({ message: 'Error al obtener comercios de puntos' });
    }
  }

  static async createComercio(req: Request, res: Response) {
    try {
      const nombre = String((req.body || {}).nombre || '').trim();
      const puntos = Number((req.body || {}).puntos_por_carga ?? 100);
      if (!nombre) return res.status(400).json({ message: 'nombre es requerido' });

      const created = await ComercioPuntos.create({
        nombre,
        puntos_por_carga: Number.isFinite(puntos) && puntos > 0 ? Math.round(puntos) : 100,
        activo: (req.body || {}).activo !== false,
      } as any);

      return res.status(201).json(created);
    } catch (error) {
      logger.error('Error al crear comercio de puntos', error);
      return res.status(500).json({ message: 'Error al crear comercio de puntos' });
    }
  }

  static async updateComercio(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) return res.status(400).json({ message: 'ID inválido' });

      const comercio = await ComercioPuntos.findByPk(id);
      if (!comercio) return res.status(404).json({ message: 'Comercio no encontrado' });

      const body: any = req.body || {};
      if (body.nombre !== undefined) comercio.set('nombre', String(body.nombre || '').trim());
      if (body.puntos_por_carga !== undefined) {
        const p = Number(body.puntos_por_carga);
        if (Number.isFinite(p) && p > 0) comercio.set('puntos_por_carga', Math.round(p));
      }
      if (body.activo !== undefined) comercio.set('activo', Boolean(body.activo));

      await comercio.save();
      return res.status(200).json(comercio);
    } catch (error) {
      logger.error('Error al actualizar comercio de puntos', error);
      return res.status(500).json({ message: 'Error al actualizar comercio de puntos' });
    }
  }

  static async getComerciosResumen(_req: Request, res: Response) {
    try {
      const comercios = await PuntosController.findComerciosSafe();
      const movimientos = await SocioPuntos.findAll({ order: [['fecha_carga', 'DESC']] });

      const socioIds = Array.from(new Set(movimientos.map((m: any) => Number(m.get('socio_id'))).filter(Boolean)));
      const socios = socioIds.length
        ? await Socio.findAll({ where: { socio_id: { [Op.in]: socioIds as any } } as any })
        : [];
      const socioMap = new Map<number, any>();
      socios.forEach((s: any) => socioMap.set(Number(s.get('socio_id')), s));

      const byComercio = new Map<string, { totalPuntos: number; scans: number; socios: any[] }>();
      movimientos.forEach((m: any) => {
        const nombreComercio = String(m.get('comercio') || 'Sin comercio');
        const socioId = Number(m.get('socio_id'));
        const puntos = Number(m.get('puntos') || 0);
        const socio = socioMap.get(socioId);

        if (!byComercio.has(nombreComercio)) {
          byComercio.set(nombreComercio, { totalPuntos: 0, scans: 0, socios: [] });
        }
        const row = byComercio.get(nombreComercio)!;
        row.totalPuntos += puntos;
        row.scans += 1;
        row.socios.push({
          socio_id: socioId,
          nombre: socio ? `${String(socio.get('socio_nombre') || '').trim()} ${String(socio.get('socio_apellido') || '').trim()}`.trim() : `Socio ${socioId}`,
          puntos,
          fecha_carga: m.get('fecha_carga'),
        });
      });

      const items = comercios.map((c: any) => {
        const nombre = String(c.get('nombre'));
        const agg = byComercio.get(nombre) || { totalPuntos: 0, scans: 0, socios: [] };
        const logoRaw = c.get('logo_url');
        let logo_url = logoRaw || null;
        if (logoRaw) {
          try { logo_url = azureBlobService.getReadOnlyUrl(String(logoRaw)); } catch {}
        }
        return {
          comercio_id: c.get('comercio_id'),
          nombre,
          puntos_por_carga: c.get('puntos_por_carga'),
          activo: c.get('activo'),
          logo_url,
          totalPuntos: agg.totalPuntos,
          totalScans: agg.scans,
          socios: agg.socios,
        };
      });

      return res.status(200).json(items);
    } catch (error) {
      logger.error('Error al obtener resumen de comercios de puntos', error);
      return res.status(500).json({ message: 'Error al obtener resumen de comercios de puntos' });
    }
  }

  static async scanQr(req: Request, res: Response) {
    try {
      const socioId = Number((req.body || {}).socio_id);
      const qrPayload = String((req.body || {}).qr_payload || '');
      if (!Number.isFinite(socioId) || socioId <= 0) return res.status(400).json({ message: 'socio_id inválido' });
      if (!qrPayload.startsWith('SCMPTS|')) return res.status(400).json({ message: 'QR inválido' });

      // Formato: SCMPTS|v1|comercioId
      const parts = qrPayload.split('|');
      const comercioId = Number(parts[2]);
      if (!Number.isFinite(comercioId)) return res.status(400).json({ message: 'QR inválido (comercio)' });

      const comercio = await ComercioPuntos.findByPk(comercioId);
      if (!comercio || !comercio.get('activo')) return res.status(400).json({ message: 'Comercio inactivo o no encontrado' });

      const puntos = Number(comercio.get('puntos_por_carga') || 0);
      const created = await SocioPuntos.create({
        socio_id: socioId,
        comercio: String(comercio.get('nombre')),
        puntos,
        fecha_carga: new Date(),
        qr_payload: qrPayload,
      } as any);

      return res.status(201).json({
        ok: true,
        comercio_id: Number(comercio.get('comercio_id')),
        comercio: comercio.get('nombre'),
        puntos,
        movimiento: created,
      });
    } catch (error) {
      logger.error('Error al acreditar puntos por QR', error);
      return res.status(500).json({ message: 'Error al acreditar puntos por QR' });
    }
  }
}

export default PuntosController;
