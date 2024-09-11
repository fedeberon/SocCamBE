import { Request, Response } from 'express';
import User from '../models/user.model';
import logger from '../configs/logger';
import { IUserService } from '../interfaces/IUserService';
import { UserService } from '../service/UserService';

class UserController {
  private static userService: IUserService = new UserService();

  static async create(req: Request, res: Response) {
    try {
      const data = req.body;
      if (!data.username || !data.email || !data.password) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const user = await UserController.userService.create(data);

      res.status(201).json({ message: 'Usuario creado exitosamente', user });
    } catch (error) {
      logger.error('Error al crear el usuario:', error);
      res.status(500).json({ message: 'Error al crear el usuario', error });
    }
  }
  static async getById(req: Request, res: Response) {
    try {
      const user = await UserController.userService.getById(
        parseInt(req.params.id)
      );
      if (!user) {
        res.status(404).json({ message: 'Usuario no encontrado' });
        return;
      }
      res.status(200).json(user);
    } catch (error) {
      logger.error('Error al obtener el usuario:', error);
      res.status(500).json({ message: 'Error al obtener el usuario', error });
    }
  }
  static async get(req: Request, res: Response) {
    try {
      const users = await UserController.userService.getAll();
      res.status(200).json(users);
    } catch (error) {
      logger.error('Error al obtener los usuarios:', error);
      res.status(500).json({ message: 'Error al obtener los usuarios', error });
    }
  }
  static async update(req: Request, res: Response) {
    try {
      const body = req.body;
      const updated = await UserController.userService.update(
        parseInt(req.params.id),
        body
      );

      if (updated) {
        const updatedUser = await UserController.userService.getById(
          parseInt(req.params.id)
        );
        res.status(200).json({
          message: 'Usuario actualizado exitosamente',
          user: updatedUser,
        });
      } else {
        res.status(404).json({ message: 'Usuario no encontrado' });
      }
    } catch (error) {
      logger.error('Error al actualizar el usuario:', error);
      res
        .status(500)
        .json({ message: 'Error al actualizar el usuario', error });
    }
  }
  static async delete(req: Request, res: Response) {
    try {
      const deleted = await UserController.userService.delete(
        parseInt(req.params.id)
      );

      if (deleted) {
        res.status(204).json({ message: 'Usuario eliminado exitosamente' });
      } else {
        res.status(404).json({ message: 'Usuario no encontrado' });
      }
    } catch (error) {
      logger.error('Error al eliminar el usuario:', error);
      res.status(500).json({ message: 'Error al eliminar el usuario', error });
    }
  }
}

export default UserController;
