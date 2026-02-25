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
import sosContadorService from '../service/sosContador.service';
import PagosSociosAdapter from '../adapters/PagosSociosAdapter';
import sosMovimientosService from '../service/sosMovimientos.service';

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
        const logoUrl = storedLogoUrl
          ? azureBlobService.getReadOnlyUrl(storedLogoUrl)
          : null;

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

      if (!includeSos) {
        return res.status(200).json(socioWithPagos);
      }

      const socioCuit = String((socioWithPagos as any)?.socio_cuit || '').replace(/\D/g, '');
      if (!socioCuit) {
        return res.status(200).json({
          ...socioWithPagos,
          pagos_sos: [],
          pagos_sos_info: { message: 'El socio no tiene CUIT/CUIL configurado' },
        });
      }

      const periodo = String(query.periodo || 'mes');
      const cobros = await sosContadorService.getCobrosBySocioCuit({
        socioCuit,
        periodo: query.periodo,
        registros: query.registros,
        maxPaginas: query.maxPaginas,
      });

      const pagosSos = PagosSociosAdapter.fromSosCobros(cobros as any[], Number(id), periodo);

      try {
        await sosMovimientosService.upsertFromPagosSos(Number(id), pagosSos as any[], periodo);
      } catch (persistError) {
        logger.error('No se pudieron persistir movimientos SOS en base local:', persistError);
      }

      return res.status(200).json({
        ...socioWithPagos,
        pagos_sos: pagosSos,
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
