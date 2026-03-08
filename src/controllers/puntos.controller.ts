import { Request, Response } from 'express';
import crypto from 'crypto';
import logger from '../configs/logger';
import sequelize from '../configs/database';
import ComercioPuntos from '../models/ComercioPuntos.models';
import ComercioPuntosAdmin from '../models/ComercioPuntosAdmin.models';
import SocioPuntos from '../models/SocioPuntos.models';
import Socio from '../models/socio.models';
import azureBlobService from '../service/azureBlob.service';
import { Op } from 'sequelize';

type QrData = {
  comercioId: number;
  nonce: string | null;
  expMs: number | null;
  raw: string;
  kind: 'legacy' | 'signed';
};

class PuntosController {
  private static readonly SIGNED_PREFIX = 'SCMPTS2';

  private static getQrSecret() {
    return String(process.env.PUNTOS_QR_SECRET || process.env.JWT_SECRET || 'dev-only-change-me');
  }

  private static base64UrlEncode(text: string) {
    return Buffer.from(text, 'utf8').toString('base64url');
  }

  private static base64UrlDecode(text: string) {
    return Buffer.from(text, 'base64url').toString('utf8');
  }

  private static sign(payloadB64: string) {
    return crypto.createHmac('sha256', PuntosController.getQrSecret()).update(payloadB64).digest('base64url');
  }

  private static parseIncomingQr(rawInput: any): QrData | null {
    const qrRaw = String(rawInput || '').trim();
    if (!qrRaw) return null;

    // Nuevo formato firmado: SCMPTS2.<payloadB64>.<sig>
    if (qrRaw.startsWith(`${PuntosController.SIGNED_PREFIX}.`)) {
      const parts = qrRaw.split('.');
      if (parts.length !== 3) return null;

      const payloadB64 = parts[1];
      const sig = parts[2];
      const expected = PuntosController.sign(payloadB64);
      if (sig !== expected) return null;

      let payload: any;
      try {
        payload = JSON.parse(PuntosController.base64UrlDecode(payloadB64));
      } catch {
        return null;
      }

      const comercioId = Number(payload?.comercio_id);
      const expMs = Number(payload?.exp_ms);
      const nonce = String(payload?.nonce || '').trim();
      if (!Number.isFinite(comercioId) || comercioId <= 0) return null;
      if (!Number.isFinite(expMs) || expMs <= Date.now()) return null;
      if (!nonce) return null;

      return {
        comercioId,
        nonce,
        expMs,
        raw: qrRaw,
        kind: 'signed',
      };
    }

    // Legacy: SCMPTS|v1|comercioId
    if (qrRaw.startsWith('SCMPTS|')) {
      const parts = qrRaw.split('|');
      const comercioId = Number(parts[2]);
      if (!Number.isFinite(comercioId) || comercioId <= 0) return null;
      return {
        comercioId,
        nonce: null,
        expMs: null,
        raw: qrRaw,
        kind: 'legacy',
      };
    }

    return null;
  }

  private static buildLogoUrl(comercio: any) {
    const logoRaw = comercio?.get ? comercio.get('logo_url') : comercio?.logo_url;
    if (!logoRaw) return null;
    try {
      return azureBlobService.getReadOnlyUrl(String(logoRaw));
    } catch {
      return String(logoRaw);
    }
  }

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

      const comercioIds = comercios.map((c: any) => Number(c.get('comercio_id'))).filter(Boolean);
      const adminsRows = comercioIds.length
        ? await ComercioPuntosAdmin.findAll({ where: { comercio_id: { [Op.in]: comercioIds as any } } as any })
        : [];
      const adminSocioIds = Array.from(new Set(adminsRows.map((r: any) => Number(r.get('socio_id'))).filter(Boolean)));
      const adminSocios = adminSocioIds.length
        ? await Socio.findAll({ where: { socio_id: { [Op.in]: adminSocioIds as any } } as any })
        : [];
      const adminSocioMap = new Map<number, any>();
      adminSocios.forEach((s: any) => adminSocioMap.set(Number(s.get('socio_id')), s));
      const adminsByComercio = new Map<number, any[]>();
      adminsRows.forEach((row: any) => {
        const comercioId = Number(row.get('comercio_id'));
        const socioId = Number(row.get('socio_id'));
        const socio = adminSocioMap.get(socioId);
        const nombreSocio = socio
          ? `${String(socio.get('socio_nombre') || '').trim()} ${String(socio.get('socio_apellido') || '').trim()}`.trim()
          : `Socio ${socioId}`;
        if (!adminsByComercio.has(comercioId)) adminsByComercio.set(comercioId, []);
        adminsByComercio.get(comercioId)!.push({ socio_id: socioId, nombre: nombreSocio });
      });

      const items = comercios.map((c: any) => {
        const comercioId = Number(c.get('comercio_id'));
        const nombre = String(c.get('nombre'));
        const agg = byComercio.get(nombre) || { totalPuntos: 0, scans: 0, socios: [] };
        return {
          comercio_id: comercioId,
          nombre,
          puntos_por_carga: c.get('puntos_por_carga'),
          activo: c.get('activo'),
          logo_url: PuntosController.buildLogoUrl(c),
          totalPuntos: agg.totalPuntos,
          totalScans: agg.scans,
          socios: agg.socios,
          admins: adminsByComercio.get(comercioId) || [],
        };
      });

      return res.status(200).json(items);
    } catch (error) {
      logger.error('Error al obtener resumen de comercios de puntos', error);
      return res.status(500).json({ message: 'Error al obtener resumen de comercios de puntos' });
    }
  }

  static async listarAdminsComercio(req: Request, res: Response) {
    try {
      const comercioId = Number(req.params.comercioId);
      if (!Number.isFinite(comercioId) || comercioId <= 0) return res.status(400).json({ message: 'comercioId inválido' });

      const rows = await ComercioPuntosAdmin.findAll({ where: { comercio_id: comercioId } as any });
      const socioIds = Array.from(new Set(rows.map((r: any) => Number(r.get('socio_id'))).filter(Boolean)));
      const socios = socioIds.length
        ? await Socio.findAll({ where: { socio_id: { [Op.in]: socioIds as any } } as any })
        : [];
      const socioMap = new Map<number, any>();
      socios.forEach((s: any) => socioMap.set(Number(s.get('socio_id')), s));

      return res.status(200).json(
        socioIds.map((id) => {
          const s = socioMap.get(id);
          return {
            socio_id: id,
            nombre: s ? `${String(s.get('socio_nombre') || '').trim()} ${String(s.get('socio_apellido') || '').trim()}`.trim() : `Socio ${id}`,
            mail: s?.get ? s.get('socio_mail') : null,
          };
        })
      );
    } catch (error) {
      logger.error('Error al listar socios admin de comercio', error);
      return res.status(500).json({ message: 'Error al listar socios admin de comercio' });
    }
  }

  static async asociarAdminComercio(req: Request, res: Response) {
    try {
      const comercioId = Number((req.body || {}).comercio_id);
      const socioId = Number((req.body || {}).socio_id);
      if (!Number.isFinite(comercioId) || comercioId <= 0) return res.status(400).json({ message: 'comercio_id inválido' });
      if (!Number.isFinite(socioId) || socioId <= 0) return res.status(400).json({ message: 'socio_id inválido' });

      const comercio = await ComercioPuntos.findByPk(comercioId);
      if (!comercio) return res.status(404).json({ message: 'Comercio no encontrado' });

      const socio = await Socio.findByPk(socioId as any);
      if (!socio) return res.status(404).json({ message: 'Socio no encontrado' });

      const existing = await ComercioPuntosAdmin.findOne({ where: { comercio_id: comercioId, socio_id: socioId } as any });
      if (existing) return res.status(200).json({ ok: true, message: 'Asociación ya existente' });

      await sequelize.query(
        `INSERT INTO dbo.comercio_puntos_admin (comercio_id, socio_id, fecha_alta)
         VALUES (:comercioId, :socioId, GETDATE())`,
        { replacements: { comercioId, socioId } }
      );
      return res.status(201).json({ ok: true });
    } catch (error) {
      logger.error('Error al asociar socio admin a comercio', error);
      return res.status(500).json({ message: 'Error al asociar socio admin a comercio' });
    }
  }

  static async desasociarAdminComercio(req: Request, res: Response) {
    try {
      const comercioId = Number(req.params.comercioId);
      const socioId = Number(req.params.socioId);
      if (!Number.isFinite(comercioId) || comercioId <= 0) return res.status(400).json({ message: 'comercioId inválido' });
      if (!Number.isFinite(socioId) || socioId <= 0) return res.status(400).json({ message: 'socioId inválido' });

      const deleted = await ComercioPuntosAdmin.destroy({ where: { comercio_id: comercioId, socio_id: socioId } as any });
      if (!deleted) return res.status(404).json({ message: 'Asociación no encontrada' });

      return res.status(200).json({ ok: true });
    } catch (error) {
      logger.error('Error al desasociar socio admin de comercio', error);
      return res.status(500).json({ message: 'Error al desasociar socio admin de comercio' });
    }
  }

  static async generarQr(req: Request, res: Response) {
    try {
      const comercioId = Number((req.body || {}).comercio_id);
      const ttlSecRaw = Number((req.body || {}).ttl_sec ?? 60);
      const ttlSec = Math.min(180, Math.max(20, Number.isFinite(ttlSecRaw) ? Math.round(ttlSecRaw) : 60));

      if (!Number.isFinite(comercioId) || comercioId <= 0) {
        return res.status(400).json({ message: 'comercio_id inválido' });
      }

      const comercio = await ComercioPuntos.findByPk(comercioId);
      if (!comercio || !comercio.get('activo')) {
        return res.status(400).json({ message: 'Comercio inactivo o no encontrado' });
      }

      const expMs = Date.now() + ttlSec * 1000;
      const nonce = crypto.randomBytes(10).toString('hex');
      const payload = {
        v: 1,
        comercio_id: Number(comercio.get('comercio_id')),
        nonce,
        iat_ms: Date.now(),
        exp_ms: expMs,
      };

      const payloadB64 = PuntosController.base64UrlEncode(JSON.stringify(payload));
      const sig = PuntosController.sign(payloadB64);
      const tokenQr = `${PuntosController.SIGNED_PREFIX}.${payloadB64}.${sig}`;

      return res.status(200).json({
        ok: true,
        token_qr: tokenQr,
        qr_payload: tokenQr,
        expires_at: new Date(expMs).toISOString(),
        expires_in_sec: ttlSec,
        comercio_id: Number(comercio.get('comercio_id')),
        comercio: String(comercio.get('nombre')),
        logo_url: PuntosController.buildLogoUrl(comercio),
        puntos: Number(comercio.get('puntos_por_carga') || 0),
      });
    } catch (error) {
      logger.error('Error al generar QR dinámico de puntos', error);
      return res.status(500).json({ message: 'Error al generar QR dinámico de puntos' });
    }
  }

  static async previewQr(req: Request, res: Response) {
    try {
      const qrInput = (req.body || {}).token_qr ?? (req.body || {}).qr_payload;
      const qrData = PuntosController.parseIncomingQr(qrInput);
      if (!qrData) return res.status(400).json({ message: 'QR inválido o vencido' });

      const comercio = await ComercioPuntos.findByPk(qrData.comercioId);
      if (!comercio || !comercio.get('activo')) return res.status(400).json({ message: 'Comercio inactivo o no encontrado' });

      const puntos = Number(comercio.get('puntos_por_carga') || 0);
      return res.status(200).json({
        ok: true,
        comercio_id: Number(comercio.get('comercio_id')),
        comercio: String(comercio.get('nombre')),
        logo_url: PuntosController.buildLogoUrl(comercio),
        puntos,
        dynamic_qr: qrData.kind === 'signed',
        expires_at: qrData.expMs ? new Date(qrData.expMs).toISOString() : null,
      });
    } catch (error) {
      logger.error('Error al previsualizar QR de puntos', error);
      return res.status(500).json({ message: 'Error al previsualizar QR de puntos' });
    }
  }

  static async scanQr(req: Request, res: Response) {
    try {
      const socioId = Number((req.body || {}).socio_id);
      const qrInput = (req.body || {}).token_qr ?? (req.body || {}).qr_payload;
      if (!Number.isFinite(socioId) || socioId <= 0) return res.status(400).json({ message: 'socio_id inválido' });

      const qrData = PuntosController.parseIncomingQr(qrInput);
      if (!qrData) return res.status(400).json({ message: 'QR inválido o vencido' });

      const comercio = await ComercioPuntos.findByPk(qrData.comercioId);
      if (!comercio || !comercio.get('activo')) return res.status(400).json({ message: 'Comercio inactivo o no encontrado' });

      if (qrData.kind === 'signed') {
        const used = await SocioPuntos.findOne({ where: { qr_payload: qrData.raw } as any });
        if (used) return res.status(409).json({ message: 'QR ya utilizado' });
      }

      const cooldownMin = Math.max(0, Number(process.env.PUNTOS_COOLDOWN_MIN || 2));
      if (cooldownMin > 0) {
        const since = new Date(Date.now() - cooldownMin * 60 * 1000);
        const recent = await SocioPuntos.findOne({
          where: {
            socio_id: socioId,
            comercio_id: Number(comercio.get('comercio_id')),
            fecha_carga: { [Op.gte]: since },
          } as any,
        });
        if (recent) {
          return res.status(429).json({ message: `Esperá ${cooldownMin} min antes de volver a cargar en este comercio` });
        }
      }

      const maxDiarioSocio = Math.max(0, Number(process.env.PUNTOS_DAILY_MAX_SOCIO || 2000));
      if (maxDiarioSocio > 0) {
        const startDay = new Date();
        startDay.setHours(0, 0, 0, 0);
        const movimientosHoy = await SocioPuntos.findAll({
          where: {
            socio_id: socioId,
            fecha_carga: { [Op.gte]: startDay },
          } as any,
        });
        const totalHoy = movimientosHoy.reduce((acc: number, it: any) => acc + Number(it.get('puntos') || 0), 0);
        const puntosActuales = Number(comercio.get('puntos_por_carga') || 0);
        if (totalHoy + puntosActuales > maxDiarioSocio) {
          return res.status(429).json({ message: 'Límite diario de puntos alcanzado' });
        }
      }

      const puntos = Number(comercio.get('puntos_por_carga') || 0);
      const created = await SocioPuntos.create({
        socio_id: socioId,
        comercio_id: Number(comercio.get('comercio_id')),
        comercio: String(comercio.get('nombre')),
        puntos,
        fecha_carga: new Date(),
        qr_payload: qrData.raw,
      } as any);

      return res.status(201).json({
        ok: true,
        comercio_id: Number(comercio.get('comercio_id')),
        comercio: comercio.get('nombre'),
        logo_url: PuntosController.buildLogoUrl(comercio),
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
