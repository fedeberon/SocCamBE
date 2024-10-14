import { Request, Response } from 'express';
import SocioService from '../service/socio.service';

export const getSocios = async (req: Request, res: Response) => {
  try {
    const socios = await SocioService.getAllSocios();
    res.json(socios);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener socios', error });
  }
};

export const getSocioById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const socio = await SocioService.getSocioById(Number(id));
    if (socio) {
      res.json(socio);
    } else {
      res.status(404).json({ message: 'Socio no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el socio', error });
  }
};

export const getSociosByEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const socios = await SocioService.getSociosByEmail(email);
    if (socios.length > 0) {
      res.json(socios);
    } else {
      res.status(404).json({ message: 'No se encontraron socios para este correo' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los socios por correo', error });
  }
};

export const getSociosByMatricula = async (req: Request, res: Response) => {
  try {
    const { matricula } = req.params;
    const socios = await SocioService.getSociosByMatricula(Number(matricula));
    if (socios.length > 0) {
      res.json(socios);
    } else {
      res.status(404).json({ message: 'No se encontraron socios para esta matrícula' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los socios por matrícula', error });
  }
};

export const getSocioWithPagos = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const socioWithPagos = await SocioService.getSocioWithPagos(Number(id));
    if (socioWithPagos) {
      res.json(socioWithPagos);
    } else {
      res.status(404).json({ message: 'Socio no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el socio con sus pagos', error });
  }
};