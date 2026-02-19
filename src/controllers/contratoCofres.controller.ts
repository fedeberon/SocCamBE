import { Request, Response } from 'express';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import logger from '../configs/logger';
import ContratoCofresService from '../service/contratoCofres.service';
import { IContratoCofresService } from '../interfaces/IcontratoCofres.service';
import { CreateContratoCofreDto } from '../dtos/CreateContratoCofreDto';
import { FirmarContratoCofreDto } from '../dtos/FirmarContratoCofreDto';
import { buildContratoPdf } from '../utils/contratoPdf';
import { ServiceError } from '../service/contratoCofres.service';

class ContratoCofresController {
  private static contratoCofresService: IContratoCofresService = new ContratoCofresService();

  private static handleError(res: Response, error: any, genericMessage: string) {
    if (error instanceof ServiceError) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    logger.error(genericMessage, error);
    return res.status(500).json({ message: genericMessage, error });
  }

  static async getContratoCofres(req: Request, res: Response) {
    try {
      const contratoCofres = await ContratoCofresController.contratoCofresService.getAllContratoCofres();
      res.status(200).json(contratoCofres);
    } catch (error) {
      logger.error('Error al obtener los contratos de cofres:', error);
      res.status(500).json({ message: 'Error al obtener los contratos de cofres', error });
    }
  }

  static async getContratoCofresById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (Number.isNaN(Number(id))) {
        return res.status(400).json({ message: 'id inválido' });
      }

      const contratoCofres = await ContratoCofresController.contratoCofresService.getContratoCofresById(Number(id));
      if (contratoCofres) {
        return res.status(200).json(contratoCofres);
      } else {
        return res.status(404).json({ message: 'Contrato de cofre no encontrado' });
      }
    } catch (error) {
      logger.error('Error al obtener el contrato de cofre:', error);
      res.status(500).json({ message: 'Error al obtener el contrato de cofre', error });
    }
  }

  static async getContratoCofressBySocioId(req: Request, res: Response) {
    try {
      const { socioId } = req.params;
      if (Number.isNaN(Number(socioId))) {
        return res.status(400).json({ message: 'socioId inválido' });
      }

      const contratoCofres = await ContratoCofresController.contratoCofresService.getContratoCofressBySocioId(Number(socioId));
      return res.status(200).json(contratoCofres);
    } catch (error) {
      logger.error('Error al obtener los contratos de cofre por socio:', error);
      res.status(500).json({ message: 'Error al obtener los contratos de cofre por socio', error });
    }
  }

  static async createContratoCofre(req: Request, res: Response) {
    try {
      const payload = {
        ...req.body,
        socioId: Number(req.body?.socioId),
        cajaId: Number(req.body?.cajaId),
        cajaNumero:
          req.body?.cajaNumero !== undefined && req.body?.cajaNumero !== null
            ? String(req.body.cajaNumero)
            : undefined,
      };

      const dto = plainToInstance(CreateContratoCofreDto, payload);
      const errors = await validate(dto);
      if (errors.length > 0) {
        return res.status(400).json({ message: 'Datos inválidos', errors });
      }

      const contrato = await ContratoCofresController.contratoCofresService.createContratoCofre(dto);
      return res.status(201).json(contrato);
    } catch (error) {
      return ContratoCofresController.handleError(res, error, 'Error al crear contrato de cofre');
    }
  }

  static async getContratoPdf(req: Request, res: Response) {
    try {
      const contratoId = Number(req.params.id);
      if (Number.isNaN(contratoId)) {
        return res.status(400).json({ message: 'id inválido' });
      }

      const contrato = await ContratoCofresController.contratoCofresService.getContratoCofresById(contratoId);
      if (!contrato) {
        return res.status(404).json({ message: 'Contrato no encontrado' });
      }

      const pdf = buildContratoPdf({
        id: contrato.id,
        socioId: contrato.socioId,
        socioNombre: contrato.socioNombre,
        socioDni: contrato.socioDni,
        domicilioFiscal: contrato.domicilioFiscal,
        cajaNumero: contrato.cajaNumero,
        estado: contrato.estado,
        fechaInicio: contrato.fechaInicio,
        fechaFirma: contrato.fechaFirma,
        firmante: contrato.firmante,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="contrato-caja-${contrato.cajaNumero}-socio-${contrato.socioId}.pdf"`,
      );
      return res.status(200).send(pdf);
    } catch (error) {
      return ContratoCofresController.handleError(res, error, 'Error al generar PDF del contrato');
    }
  }

  static async firmarContratoCofre(req: Request, res: Response) {
    try {
      const contratoId = Number(req.params.id);
      if (Number.isNaN(contratoId)) {
        return res.status(400).json({ message: 'id inválido' });
      }

      const dto = plainToInstance(FirmarContratoCofreDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        return res.status(400).json({ message: 'Datos inválidos', errors });
      }

      const contrato = await ContratoCofresController.contratoCofresService.firmarContrato(contratoId, dto);
      return res.status(200).json(contrato);
    } catch (error) {
      return ContratoCofresController.handleError(res, error, 'Error al firmar contrato de cofre');
    }
  }
}

export default ContratoCofresController;
