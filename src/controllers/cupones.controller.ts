import { Request, Response } from 'express';
import logger from '../configs/logger';
import CuponService from '../service/cupon.services';

export const getAllCupones = async (req: Request, res: Response) => {
  try {
    const cupones = await CuponService.getAllCupones();
    res.json(cupones);
  } catch (error) {
    logger.error('Error al obtener cupones', error);
    res.status(500).json({ message: 'Error al obtener cupones', error });
  }
};

export const getCuponById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cupon = await CuponService.getCuponById(Number(id));
    if (cupon) {
      res.json(cupon);
    } else {
      res.status(404).json({ message: 'Cupón no encontrado' });
    }
  } catch (error) {
    logger.error('Error al obtener cupón', error);
    res.status(500).json({ message: 'Error al obtener cupón', error });
  }
};

export const createCupon = async (req: Request, res: Response) => {
  try {
    const nuevoCupon = await CuponService.createCupon(req.body);
    res.status(201).json(nuevoCupon);
  } catch (error) {
    logger.error('Error al crear cupón', error);
    res.status(500).json({ message: 'Error al crear cupón', error });
  }
};

export const updateCupon = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedCupon = await CuponService.updateCupon(Number(id), req.body);
    if (updatedCupon) {
      res.json(updatedCupon);
    } else {
      res.status(404).json({ message: 'Cupón no encontrado' });
    }
  } catch (error) {
    logger.error('Error al actualizar cupón', error);
    res.status(500).json({ message: 'Error al actualizar cupón', error });
  }
};

export const assignCuponToSocios = async (req: Request, res: Response) => {
  try {
    const { cuponId } = req.params;
    const { socioIds } = req.body; // Array de IDs de socios
    const result = await CuponService.assignCuponToSocios(Number(cuponId), socioIds);
    res.json({ message: 'Cupón asignado a los socios correctamente', result });
  } catch (error) {
    logger.error('Error al asignar cupón a socios', error);
    res.status(500).json({ message: 'Error al asignar cupón a socios', error });
  }
};
