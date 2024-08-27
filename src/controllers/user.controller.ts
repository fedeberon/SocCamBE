import { Request, Response } from 'express';
import User from '../models/user.model';
import logger from '../configs/logger';

class UserController{
    // Crear Usuario
    static async create(req: Request, res: Response){
        try {
            const { username, email, password } = req.body;
            if (!username || !email || !password) {
                return res.status(400).json({ error: 'Missing required fields' });
              }
        
            const user = await User.create({ username, email, password });
        
            res.status(201).json({ message: 'Usuario creado exitosamente', user });
          } catch (error) {
            logger.error('Error al crear el usuario:', error);
            res.status(500).json({ message: 'Error al crear el usuario', error });
          }
    }
    // Obtiene el usuario por el ID
    static async getById(req: Request, res: Response) {
        try {
            const user = await User.findByPk(req.params.id);
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
    // Obtiene la lista de usuarios
    static async get(req: Request, res: Response) {
        try {
            const users = await User.findAll();
            res.status(200).json(users);
          } catch (error) {
            logger.error('Error al obtener los usuarios:', error);
            res.status(500).json({ message: 'Error al obtener los usuarios', error });
          }
    }
    //Actualiza el usuario
    static async update(req: Request, res: Response) {
        try {
            const { username, email, password } = req.body;
            const [updated] = await User.update({ username, email, password }, {
              where: { id: req.params.id }
            });
        
            if (updated) {
              const updatedUser = await User.findByPk(req.params.id);
              res.status(200).json({ message: 'Usuario actualizado exitosamente', user: updatedUser });
            } else {
              res.status(404).json({ message: 'Usuario no encontrado' });
            }
          } catch (error) {
            logger.error('Error al actualizar el usuario:', error);
            res.status(500).json({ message: 'Error al actualizar el usuario', error });
          }
      }
      //Elimina el usuario
      static async delete(req: Request, res: Response) {
        try {
            const deleted = await User.destroy({
              where: { id: req.params.id }
            });
        
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