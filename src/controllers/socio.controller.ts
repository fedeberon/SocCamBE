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

export const getSociosByEmail = async (req: Request, res: Response) => {
    try {
      const { email } = req.params;
      const socios = await Socio.findAll({
        where: { socio_mail: email }
      });
  
      if (socios.length > 0) {
        res.json(socios);
      } else {
        res.status(404).json({ message: 'No se encontraron socios para este correo' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener los socios por correo', error });
    }
  };