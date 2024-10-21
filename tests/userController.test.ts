import { Request, Response } from 'express';
import UserController from '../src/controllers/user.controller';
import { UserService } from '../src/service/UserService';
import jwt from 'jsonwebtoken';

// Mock de dotenv
jest.mock('dotenv', () => ({
  config: jest.fn()
}));

// Mock del logger
jest.mock('../src/configs/logger', () => ({
  error: jest.fn(),
  info: jest.fn()
}));

// Mock de jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-token')
}));

// Mock de la base de datos
jest.mock('../src/configs/database', () => {
  return {
    authenticate: jest.fn().mockResolvedValue(true),
    define: jest.fn(),
    sync: jest.fn().mockResolvedValue(true),
    __esModule: true,
    default: {
      authenticate: jest.fn().mockResolvedValue(true),
      define: jest.fn(),
      sync: jest.fn().mockResolvedValue(true),
    }
  };
});

// Mock del modelo User
jest.mock('../src/models/user.model', () => {
  return {
    __esModule: true,
    default: {
      findOne: jest.fn(),
      findAll: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn(),
    }
  };
});

// Mock del servicio
jest.mock('../src/service/UserService');

describe('UserController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseObject: any;

  beforeEach(() => {
    responseObject = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    mockRequest = {};
    mockResponse = responseObject;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('debería crear un usuario exitosamente', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@test.com',
        password: 'password123'
      };

      mockRequest = {
        body: mockUser
      };

      (UserService.prototype.create as jest.Mock).mockResolvedValue(mockUser);

      await UserController.create(mockRequest as Request, mockResponse as Response);

      expect(responseObject.status).toHaveBeenCalledWith(201);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: 'Usuario creado exitosamente',
        user: mockUser
      });
    });

    it('debería retornar error 400 si faltan campos requeridos', async () => {
      mockRequest = {
        body: {
          username: 'testuser'
        }
      };

      await UserController.create(mockRequest as Request, mockResponse as Response);

      expect(responseObject.status).toHaveBeenCalledWith(400);
      expect(responseObject.json).toHaveBeenCalledWith({
        error: 'Missing required fields'
      });
    });
  });

  describe('getById', () => {
    it('debería obtener un usuario por ID exitosamente', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@test.com'
      };

      mockRequest = {
        params: { id: '1' }
      };

      (UserService.prototype.getById as jest.Mock).mockResolvedValue(mockUser);

      await UserController.getById(mockRequest as Request, mockResponse as Response);

      expect(responseObject.status).toHaveBeenCalledWith(200);
      expect(responseObject.json).toHaveBeenCalledWith(mockUser);
    });

    it('debería retornar 404 si el usuario no existe', async () => {
      mockRequest = {
        params: { id: '999' }
      };

      (UserService.prototype.getById as jest.Mock).mockResolvedValue(null);

      await UserController.getById(mockRequest as Request, mockResponse as Response);

      expect(responseObject.status).toHaveBeenCalledWith(404);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: 'Usuario no encontrado'
      });
    });
  });

  describe('get', () => {
    it('debería obtener todos los usuarios exitosamente', async () => {
      const mockUsers = [
        { id: 1, username: 'user1', email: 'user1@test.com' },
        { id: 2, username: 'user2', email: 'user2@test.com' }
      ];

      (UserService.prototype.getAll as jest.Mock).mockResolvedValue(mockUsers);

      await UserController.get(mockRequest as Request, mockResponse as Response);

      expect(responseObject.status).toHaveBeenCalledWith(200);
      expect(responseObject.json).toHaveBeenCalledWith(mockUsers);
    });
  });

  describe('update', () => {
    it('debería actualizar un usuario exitosamente', async () => {
      const mockUser = {
        id: 1,
        username: 'updateduser',
        email: 'updated@test.com'
      };

      mockRequest = {
        params: { id: '1' },
        body: mockUser
      };

      (UserService.prototype.update as jest.Mock).mockResolvedValue(true);
      (UserService.prototype.getById as jest.Mock).mockResolvedValue(mockUser);

      await UserController.update(mockRequest as Request, mockResponse as Response);

      expect(responseObject.status).toHaveBeenCalledWith(200);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: 'Usuario actualizado exitosamente',
        user: mockUser
      });
    });

    it('debería retornar 404 si el usuario a actualizar no existe', async () => {
      mockRequest = {
        params: { id: '999' },
        body: { username: 'nonexistent' }
      };

      (UserService.prototype.update as jest.Mock).mockResolvedValue(null);

      await UserController.update(mockRequest as Request, mockResponse as Response);

      expect(responseObject.status).toHaveBeenCalledWith(404);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: 'Usuario no encontrado'
      });
    });
  });

  describe('delete', () => {
    it('debería eliminar un usuario exitosamente', async () => {
      mockRequest = {
        params: { id: '1' }
      };

      (UserService.prototype.delete as jest.Mock).mockResolvedValue(true);

      await UserController.delete(mockRequest as Request, mockResponse as Response);

      expect(responseObject.status).toHaveBeenCalledWith(204);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: 'Usuario eliminado exitosamente'
      });
    });

    it('debería retornar 404 si el usuario a eliminar no existe', async () => {
      mockRequest = {
        params: { id: '999' }
      };

      (UserService.prototype.delete as jest.Mock).mockResolvedValue(false);

      await UserController.delete(mockRequest as Request, mockResponse as Response);

      expect(responseObject.status).toHaveBeenCalledWith(404);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: 'Usuario no encontrado'
      });
    });
  });

  describe('login', () => {
    it('debería realizar login exitosamente', async () => {
      const mockUser = {
        id: 1,
        email: 'test@test.com',
        password: 'password123'
      };

      mockRequest = {
        body: {
          email: 'test@test.com',
          password: 'password123'
        }
      };

      (UserService.prototype.getByEmail as jest.Mock).mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');

      await UserController.login(mockRequest as Request, mockResponse as Response);

      expect(responseObject.status).toHaveBeenCalledWith(200);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: 'Login successful',
        token: 'mock-token'
      });
    });

    it('debería retornar 404 si el usuario no existe', async () => {
      mockRequest = {
        body: {
          email: 'nonexistent@test.com',
          password: 'password123'
        }
      };

      (UserService.prototype.getByEmail as jest.Mock).mockResolvedValue(null);

      await UserController.login(mockRequest as Request, mockResponse as Response);

      expect(responseObject.status).toHaveBeenCalledWith(404);
      expect(responseObject.json).toHaveBeenCalledWith({
        error: 'Usuario no encontrado'
      });
    });

    it('debería retornar 401 si la contraseña es inválida', async () => {
      const mockUser = {
        id: 1,
        email: 'test@test.com',
        password: 'correctpassword'
      };

      mockRequest = {
        body: {
          email: 'test@test.com',
          password: 'wrongpassword'
        }
      };

      (UserService.prototype.getByEmail as jest.Mock).mockResolvedValue(mockUser);

      await UserController.login(mockRequest as Request, mockResponse as Response);

      expect(responseObject.status).toHaveBeenCalledWith(401);
      expect(responseObject.json).toHaveBeenCalledWith({
        error: 'Invalid password'
      });
    });
  });

  describe('register', () => {
    it('debería registrar un nuevo usuario exitosamente', async () => {
      const mockUser = {
        id: 1,
        username: 'newuser',
        email: 'new@test.com',
        password: 'password123'
      };

      mockRequest = {
        body: mockUser
      };

      (UserService.prototype.create as jest.Mock).mockResolvedValue(mockUser);
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');

      await UserController.register(mockRequest as Request, mockResponse as Response);

      expect(responseObject.status).toHaveBeenCalledWith(201);
      expect(responseObject.json).toHaveBeenCalledWith({
        message: 'User registered successfully.',
        user: mockUser,
        token: 'mock-token'
      });
    });

    it('debería retornar error 400 si faltan campos requeridos en el registro', async () => {
      mockRequest = {
        body: {
          username: 'incomplete'
        }
      };

      await UserController.register(mockRequest as Request, mockResponse as Response);

      expect(responseObject.status).toHaveBeenCalledWith(400);
      expect(responseObject.json).toHaveBeenCalledWith({
        error: 'Missing required fields'
      });
    });

    it('debería retornar error 400 si el usuario ya está registrado', async () => {
      const mockUser = {
        username: 'existinguser',
        email: 'existing@test.com',
        password: 'password123'
      };
  
      mockRequest = {
        body: mockUser
      };

      const User = require('../src/models/user.model').default;
      User.findOne.mockResolvedValue(mockUser);
      
      await UserController.register(mockRequest as Request, mockResponse as Response);

      expect(responseObject.status).toHaveBeenCalledWith(400);
      expect(responseObject.json).toHaveBeenCalledWith({
        error: 'User is already registered'
      });
    });
  });
});