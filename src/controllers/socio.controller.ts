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

      return res.status(200).json({
        ...socioWithPagos,
        pagos_sos: pagosSos,
        movimientos_sos: includeSosMovimientos ? cobrosLocales : [],
        movimientos_sos_info: {
          count: cobrosLocales.length,
          source: 'SOS_LOCAL_SYNC',
          synced: true,
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

}




export default SocioController;
