import { Request, Response } from 'express';
import Socio from '../models/socio.models';

export const getSocios = async (req: Request, res: Response) => {
  try {
    const socios = await Socio.findAll();
    res.json(socios);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener socios', error });
  }
};

export const getSocioById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const socio = await Socio.findByPk(id);
    if (socio) {
      res.json(socio);
    } else {
      res.status(404).json({ message: 'Socio no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el socio', error });
  }
};
