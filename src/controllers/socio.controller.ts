import { Request, Response } from 'express';
import logger from '../configs/logger';
import SocioService from '../service/socio.service';
import { ISocioService } from '../interfaces/Isocio.service';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateSocioDto } from '../dtos/CreateSocioDto';
import formatDateFields from '../utils/formatDateFields';
import { DateTime } from 'luxon';
import convertirDatosSocio from '../utils/conversorSocio';
import CajaSeguridadService from '../service/cajaSeguridad.service';
import { ICajaSeguridadService } from '../interfaces/IcajaSeguridad.service';
import azureBlobService from '../service/azureBlob.service';
import PagosSociosAdapter from '../adapters/PagosSociosAdapter';
import sosSyncQueueService from '../service/sosSyncQueue.service';
import SosMovimiento from '../models/sosMovimiento.models';
import SocioPuntos from '../models/SocioPuntos.models';

class SocioController {
  private static socioService: ISocioService = new SocioService(); 
  private static cajaSeguridadService: ICajaSeguridadService = new CajaSeguridadService();

  static async getSocios(req: Request, res: Response) {
    try {
      const socios = await SocioController.socioService.getAllSocios();
      res.status(200).json(socios);
    } catch (error) {
      logger.error('Error al obtener los socios:', error);
      res.status(500).json({ message: 'Error al obtener los socios', error });
    }
  }

  static async getCajasSeguridadBySocio(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const cajas = await SocioController.cajaSeguridadService.getCajasBySocio(Number(id));
      res.status(200).json(cajas);
    } catch (error) {
      logger.error('Error al obtener las cajas de seguridad del socio:', error);
      res.status(500).json({ message: 'Error al obtener las cajas de seguridad del socio', error });
    }
  }

  static async getSocioById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const socio = await SocioController.socioService.getSocioById(Number(id));
      if (socio) {
        const socioData = typeof (socio as any).get === 'function'
          ? (socio as any).get({ plain: true })
          : socio;

        const storedLogoUrl = (socioData as any)?.socio_firma || null;
        let logoUrl: string | null = null;
        if (storedLogoUrl) {
          try {
            logoUrl = azureBlobService.getReadOnlyUrl(storedLogoUrl);
          } catch (e) {
            const raw = String(storedLogoUrl || '').trim();
            logoUrl = /^https?:\/\//i.test(raw) ? raw : null;
          }
        }

        const shouldSync = String((req.query as any)?.sync ?? 'true').toLowerCase() !== 'false';
        if (shouldSync) {
          const cuit = String((socioData as any)?.socio_cuit || '').replace(/\D/g, '');
          const socioId = Number((socioData as any)?.socio_id || id);
          if (socioId && cuit.length === 11) {
            const fechaDesde = process.env.SOS_SYNC_DEFAULT_FROM || '2024-01-01';
            const fechaHasta = new Date().toISOString().slice(0, 10);
            sosSyncQueueService.enqueue({
              socioId,
              cuit,
              fechaDesde,
              fechaHasta,
              trigger: 'auto',
            }).catch((e) => {
              logger.warn(`[socio.getSocioById] no se pudo encolar sync socioId=${socioId}: ${e?.message || e}`);
            });
          }
        }

        res.status(200).json({
          ...socioData,
          socio_firma: logoUrl,
          logoUrl,
        });
      } else {
        res.status(404).json({ message: 'Socio no encontrado' });
      }
    } catch (error) {
      logger.error('Error al obtener el socio:', error);
      res.status(500).json({ message: 'Error al obtener el socio', error });
    }
  }

  static async getSociosByEmail(req: Request, res: Response) {
    try {
      const { email } = req.params;
      const socios = await SocioController.socioService.getSociosByEmail(email);
      if (socios.length > 0) {
        res.status(200).json(socios);
      } else {
        res.status(404).json({ message: 'No se encontraron socios para este correo' });
      }
    } catch (error) {
      logger.error('Error al obtener los socios por correo:', error);
      res.status(500).json({ message: 'Error al obtener los socios por correo', error });
    }
  }

  static async getSociosByMatricula(req: Request, res: Response) {
    try {
      const { matricula } = req.params;
      const socios = await SocioController.socioService.getSociosByMatricula(Number(matricula));
      if (socios.length > 0) {
        res.status(200).json(socios);
      } else {
        res.status(404).json({ message: 'No se encontraron socios para esta matrícula' });
      }
    } catch (error) {
      logger.error('Error al obtener los socios por matrícula:', error);
      res.status(500).json({ message: 'Error al obtener los socios por matrícula', error });
    }
  }

  static async getSocioWithPagos(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const socioWithPagos = await SocioController.socioService.getSocioWithPagos(Number(id));

      if (!socioWithPagos) {
        return res.status(404).json({ message: 'Socio no encontrado' });
      }

      const query = (req.query || {}) as Record<string, any>;
      const includeSos = String(query.includeSos || 'false').toLowerCase() === 'true';
      const includeSosMovimientos = String(query.includeSosMovimientos || 'true').toLowerCase() === 'true';

      if (!includeSos) {
        return res.status(200).json(socioWithPagos);
      }

      const socioCuit = String((socioWithPagos as any)?.socio_cuit || '').replace(/\D/g, '');
      if (!socioCuit) {
        return res.status(200).json({
          ...socioWithPagos,
          pagos_sos: [],
          movimientos_sos: [],
          pagos_sos_info: { message: 'El socio no tiene CUIT/CUIL configurado' },
        });
      }

      const periodo = String(query.periodo || 'mes');

      const movimientosLocales = await SosMovimiento.findAll({
        where: {
          socio_id: Number(id),
          cuit_cuil: socioCuit,
          deleted: false,
        },
        order: [['fecha', 'DESC'], ['sos_mov_id', 'DESC']],
      });

      const cobrosLocales = movimientosLocales.map((m: any) => {
        const raw = (() => {
          try {
            return m?.raw_json ? JSON.parse(m.raw_json) : null;
          } catch {
            return null;
          }
        })();

        return {
          id: m.sos_cobro_id || m.sos_mov_id,
          fecha: m.fecha,
          factura: m.factura,
          tipo_movimiento: m.tipo_movimiento,
          comprobante_numero: m.comprobante_numero,
          factura_referencia: m.factura_referencia,
          montototal: Number(m.monto || 0),
          referencia: m.referencia,
          cliente: {
            id: m.sos_cliente_id,
            cuit: m.cuit_cuil,
            clipro: m.cliente_nombre,
            email: m.cliente_email,
          },
          ...(raw || {}),
        };
      });

      const pagosSos = PagosSociosAdapter.fromSosCobros(cobrosLocales as any[], Number(id), periodo);
      const lastSyncAt = movimientosLocales.length
        ? (movimientosLocales[0] as any)?.updated_at || (movimientosLocales[0] as any)?.fecha || null
        : null;

      return res.status(200).json({
        ...socioWithPagos,
        pagos_sos: pagosSos,
        movimientos_sos: includeSosMovimientos ? cobrosLocales : [],
        movimientos_sos_info: {
          count: cobrosLocales.length,
          source: 'SOS_LOCAL_SYNC',
          synced: true,
          last_sync_at: lastSyncAt,
        },
      });
    } catch (error) {
      logger.error('Error al obtener el socio con sus pagos:', error);
      return res.status(500).json({ message: 'Error al obtener el socio con sus pagos', error });
    }
  }

  static async getSocioMovimientosCofre(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const socioConMovimientos = await SocioController.socioService.getSocioMovimientosCofre(Number(id));
      
      if (socioConMovimientos) {
        res.status(200).json(socioConMovimientos);
      } else {
        res.status(404).json({ message: 'Socio no encontrado' });
      }
    } catch (error) {
      logger.error('Error al obtener los movimientos de cuenta corriente cofre del socio:', error);
      res.status(500).json({ 
        message: 'Error al obtener los movimientos de cuenta corriente cofre del socio', 
        error 
      });
    }
  }

  static async enqueueSosSync(req: Request, res: Response) {
    try {
      const socioId = Number(req.params.id);
      if (Number.isNaN(socioId)) {
        return res.status(400).json({ message: 'ID de socio inválido' });
      }

      const socio = await SocioController.socioService.getSocioById(socioId);
      if (!socio) {
        return res.status(404).json({ message: 'Socio no encontrado' });
      }

      const socioData = typeof (socio as any).get === 'function'
        ? (socio as any).get({ plain: true })
        : socio;

      const cuit = String((socioData as any)?.socio_cuit || '').replace(/\D/g, '');
      if (!cuit) {
        return res.status(400).json({ message: 'El socio no tiene CUIT/CUIL configurado' });
      }

      const { fechaDesde, fechaHasta } = (req.body || {}) as { fechaDesde?: string; fechaHasta?: string };

      await sosSyncQueueService.enqueue({
        socioId,
        cuit,
        fechaDesde,
        fechaHasta,
        trigger: 'manual',
      });

      return res.status(202).json({
        message: 'Sync SOS encolada correctamente',
        socioId,
        cuit,
        queue: process.env.AZURE_QUEUE_NAME || 'incoming-messages',
      });
    } catch (error) {
      logger.error('Error al encolar sync SOS:', error);
      return res.status(500).json({ message: 'Error al encolar sync SOS', error });
    }
  }

  static async createSocio(req: Request, res: Response) {
    try {
      const socioDto = plainToInstance(CreateSocioDto, req.body);
      const errors = await validate(socioDto);

      if (errors.length > 0) {
        return res.status(400).json({ message: 'Datos inválidos', errors });
      }

      const newSocio = await SocioController.socioService.createSocio(socioDto);
      res.status(201).json(newSocio); 
    } catch (error) {
      logger.error('Error al crear el socio:', error);
      res.status(500).json({ message: 'Error interno al crear el socio' });
    }
  }

  static async updateSocio(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const socioData = req.body;
      
      delete socioData.socio_fechaNacimiento;
      delete socioData.socio_modificado;
      delete socioData.socio_fechaAprobacion;
      delete socioData.socio_tarjetaFechaEntrega;
      
      const [rowsUpdated, updatedSocios] = await SocioController.socioService.updateSocio(Number(id), socioData);
      if (rowsUpdated > 0) {
        res.status(200).json(updatedSocios[0]);
      } else {
        res.status(404).json({ message: 'Socio no encontrado' });
      }
    } catch (error) {
      logger.error('Error al actualizar el socio:', error);
      res.status(500).json({ message: 'Error al actualizar el socio', error });
    }
  }

  static async deleteSocio(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const rowsDeleted = await SocioController.socioService.deleteSocio(Number(id));
      if (rowsDeleted > 0) {
        res.status(200).json({ message: 'Socio eliminado correctamente' });
      } else {
        res.status(404).json({ message: 'Socio no encontrado' });
      }
    } catch (error) {
      logger.error('Error al eliminar el socio:', error);
      res.status(500).json({ message: 'Error al eliminar el socio', error });
    }
  }
  

  static async searchSociosByName(req: Request, res: Response) {
    const { search } = req.query;

    if (!search || typeof search !== 'string') {
        return res.status(400).json({ message: 'El parámetro "search" es requerido y debe ser una cadena.' });
    }

    try {
        const socios = await SocioController.socioService.searchSociosByName(search);
        return res.status(200).json(socios);
    } catch (error) {
        console.error('Error al buscar socios:', error);
        return res.status(500).json({ message: 'Error al obtener los socios', error });
    }
  }

  static async getPuntosBySocio(req: Request, res: Response) {
    try {
      const socioId = Number(req.params.id);
      if (Number.isNaN(socioId)) return res.status(400).json({ message: 'ID de socio inválido' });

      const itemsRaw = await SocioPuntos.findAll({
        where: { socio_id: socioId },
        order: [['fecha_carga', 'DESC'], ['socio_puntos_id', 'DESC']],
      });

      const items = itemsRaw.map((it: any) => {
        const json = it.toJSON ? it.toJSON() : it;
        const payload = String(json.qr_payload || '');
        const parts = payload.split('|');
        const comercioId = Number(parts[2]);
        const comercioIdFinal = Number.isFinite(Number(json.comercio_id)) ? Number(json.comercio_id) : (Number.isFinite(comercioId) ? comercioId : null);
        return {
          ...json,
          comercio_id: comercioIdFinal,
          comercio_id_derivado: Number.isFinite(comercioId) ? comercioId : null,
        };
      });

      const totalPuntos = items.reduce((acc: number, it: any) => acc + Number(it.puntos || 0), 0);

      return res.status(200).json({
        socioId,
        totalPuntos,
        items,
      });
    } catch (error) {
      logger.error('Error al obtener puntos del socio:', error);
      return res.status(500).json({ message: 'Error al obtener puntos del socio', error });
    }
  }

  static async addPuntosBySocio(req: Request, res: Response) {
    try {
      const socioId = Number(req.params.id);
      if (Number.isNaN(socioId)) return res.status(400).json({ message: 'ID de socio inválido' });

      const comercio = String((req.body || {}).comercio || '').trim();
      const puntos = Number((req.body || {}).puntos);
      const fechaCarga = (req.body || {}).fecha_carga;
      const qrPayload = (req.body || {}).qr_payload;
      const comercioIdBody = Number((req.body || {}).comercio_id);

      if (!comercio) return res.status(400).json({ message: 'comercio es requerido' });
      if (!Number.isFinite(puntos) || puntos <= 0) {
        return res.status(400).json({ message: 'puntos debe ser un número mayor a 0' });
      }

      const created = await SocioPuntos.create({
        socio_id: socioId,
        comercio_id: Number.isFinite(comercioIdBody) ? comercioIdBody : null,
        comercio,
        puntos: Math.round(puntos),
        fecha_carga: fechaCarga ? new Date(fechaCarga) : new Date(),
        qr_payload: qrPayload ? String(qrPayload) : null,
      } as any);

      return res.status(201).json(created);
    } catch (error) {
      logger.error('Error al cargar puntos al socio:', error);
      return res.status(500).json({ message: 'Error al cargar puntos al socio', error });
    }
  }

}




export default SocioController;
