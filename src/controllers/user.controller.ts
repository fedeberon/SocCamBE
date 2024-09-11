require('dotenv').config();
import { Request, Response } from 'express';
import logger from '../configs/logger';
import { IUserService } from '../interfaces/IUserService';
import { UserService } from '../service/UserService';
import User from '../models/user.model';
import jwt from 'jsonwebtoken';

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
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const user = await UserController.userService.getByEmail(email);

      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      const isValidPassword = user.password === password;

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid password' });
      }
      const jwtSecret = process.env.JWT_SECRET || 'miClaveSecreta';
      const token = jwt.sign({ userId: user.id }, jwtSecret, {
        expiresIn: '1h',
      });

      res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
      logger.error('Server error on Login.', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
  static async register(req: Request, res: Response) {
    try {
      const data = req.body;

      if (!data.username || !data.email || !data.password) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const email = data.email;
      const existingUser = await User.findOne({ where: { email } });

      if (existingUser) {
        return res.status(400).json({ error: 'User is already registered' });
      }

      const newUser = await UserController.userService.create(data);
      const jwtSecret = process.env.JWT_SECRET || 'miClaveSecreta';

      const token = jwt.sign({ userId: newUser.id }, jwtSecret, {
        expiresIn: '1h',
      });

      res.status(201).json({
        message: 'User registered successfully.',
        user: newUser,
        token,
      });
    } catch (error) {
      logger.error('Error al crear el usuario:', error);
      res.status(500).json({ message: 'Error al crear el usuario', error });
    }
  }
}

export default UserController;
