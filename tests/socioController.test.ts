// import { Request, Response } from 'express';
// import * as SocioController from '../src/controllers/socio.controller';
// import SocioService from '../src/service/socio.service';

// jest.mock('../src/configs/database', () => {
//   return {
//     authenticate: jest.fn().mockResolvedValue(true),
//     define: jest.fn(),
//     sync: jest.fn().mockResolvedValue(true),
//     __esModule: true,
//     default: {
//       authenticate: jest.fn().mockResolvedValue(true),
//       define: jest.fn(),
//       sync: jest.fn().mockResolvedValue(true),
//     }
//   };
// });

// jest.mock('../src/models/socio.models', () => {
//   return {
//     __esModule: true,
//     default: {
//       init: jest.fn(),
//       findAll: jest.fn(),
//       findOne: jest.fn(),
//       findByPk: jest.fn(),
//       create: jest.fn(),
//       update: jest.fn(),
//       destroy: jest.fn(),
//     }
//   };
// });

// jest.mock('../src/models/pagosSocios.models', () => {
//   return {
//     __esModule: true,
//     default: {
//       init: jest.fn(),
//       findAll: jest.fn(),
//       findOne: jest.fn(),
//       findByPk: jest.fn(),
//       create: jest.fn(),
//       update: jest.fn(),
//       destroy: jest.fn(),
//       belongsTo: jest.fn(),
//       hasMany: jest.fn(),
//     }
//   };
// });

// jest.mock('../src/service/socio.service');

// describe('SocioController', () => {
//   let mockRequest: Partial<Request>;
//   let mockResponse: Partial<Response>;
//   let responseObject: any;

//   beforeEach(() => {
//     responseObject = {
//       json: jest.fn(),
//       status: jest.fn().mockReturnThis(),
//     };
//     mockRequest = {};
//     mockResponse = responseObject;
//   });

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   describe('getSocios', () => {
//     it('debería devolver todos los socios exitosamente', async () => {
//       const mockSocios = [
//         { socio_id: 1, socio_nombre: 'Juan', socio_apellido: 'Pérez' },
//         { socio_id: 2, socio_nombre: 'María', socio_apellido: 'González' }
//       ];

//       (SocioService.getAllSocios as jest.Mock).mockResolvedValue(mockSocios);

//       await SocioController.getSocios(
//         mockRequest as Request,
//         mockResponse as Response
//       );

//       expect(responseObject.json).toHaveBeenCalledWith(mockSocios);
//     });

//     it('debería manejar errores al obtener socios', async () => {
//       const mockError = new Error('Error de base de datos');
//       (SocioService.getAllSocios as jest.Mock).mockRejectedValue(mockError);

//       await SocioController.getSocios(
//         mockRequest as Request,
//         mockResponse as Response
//       );

//       expect(responseObject.status).toHaveBeenCalledWith(500);
//       expect(responseObject.json).toHaveBeenCalledWith({
//         message: 'Error al obtener socios',
//         error: mockError
//       });
//     });
//   });

//   describe('getSocioById', () => {
//     it('debería devolver un socio cuando existe', async () => {
//       const mockSocio = {
//         socio_id: 1,
//         socio_nombre: 'Juan',
//         socio_apellido: 'Pérez'
//       };

//       mockRequest = {
//         params: { id: '1' }
//       };

//       (SocioService.getSocioById as jest.Mock).mockResolvedValue(mockSocio);

//       await SocioController.getSocioById(
//         mockRequest as Request,
//         mockResponse as Response
//       );

//       expect(responseObject.json).toHaveBeenCalledWith(mockSocio);
//     });

//     it('debería devolver 404 cuando el socio no existe', async () => {
//       mockRequest = {
//         params: { id: '999' }
//       };

//       (SocioService.getSocioById as jest.Mock).mockResolvedValue(null);

//       await SocioController.getSocioById(
//         mockRequest as Request,
//         mockResponse as Response
//       );

//       expect(responseObject.status).toHaveBeenCalledWith(404);
//       expect(responseObject.json).toHaveBeenCalledWith({
//         message: 'Socio no encontrado'
//       });
//     });
//   });

//   describe('getSociosByEmail', () => {
//     it('debería devolver socios cuando existen para el email', async () => {
//       const mockSocios = [
//         { socio_id: 1, socio_nombre: 'Juan', socio_mail: 'juan@test.com' }
//       ];

//       mockRequest = {
//         params: { email: 'juan@test.com' }
//       };

//       (SocioService.getSociosByEmail as jest.Mock).mockResolvedValue(mockSocios);

//       await SocioController.getSociosByEmail(
//         mockRequest as Request,
//         mockResponse as Response
//       );

//       expect(responseObject.json).toHaveBeenCalledWith(mockSocios);
//     });

//     it('debería devolver 404 cuando no hay socios para el email', async () => {
//       mockRequest = {
//         params: { email: 'noexiste@test.com' }
//       };

//       (SocioService.getSociosByEmail as jest.Mock).mockResolvedValue([]);

//       await SocioController.getSociosByEmail(
//         mockRequest as Request,
//         mockResponse as Response
//       );

//       expect(responseObject.status).toHaveBeenCalledWith(404);
//       expect(responseObject.json).toHaveBeenCalledWith({
//         message: 'No se encontraron socios para este correo'
//       });
//     });
//   });

//   describe('getSocioWithPagos', () => {
//     it('debería devolver un socio con sus pagos cuando existe', async () => {
//       const mockSocioWithPagos = {
//         socio_id: 1,
//         socio_nombre: 'Juan',
//         pagos: [
//           { id: 1, monto: 1000 },
//           { id: 2, monto: 2000 }
//         ]
//       };

//       mockRequest = {
//         params: { id: '1' }
//       };

//       (SocioService.getSocioWithPagos as jest.Mock).mockResolvedValue(mockSocioWithPagos);

//       await SocioController.getSocioWithPagos(
//         mockRequest as Request,
//         mockResponse as Response
//       );

//       expect(responseObject.json).toHaveBeenCalledWith(mockSocioWithPagos);
//     });

//     it('debería devolver 404 cuando el socio no existe', async () => {
//       mockRequest = {
//         params: { id: '999' }
//       };

//       (SocioService.getSocioWithPagos as jest.Mock).mockResolvedValue(null);

//       await SocioController.getSocioWithPagos(
//         mockRequest as Request,
//         mockResponse as Response
//       );

//       expect(responseObject.status).toHaveBeenCalledWith(404);
//       expect(responseObject.json).toHaveBeenCalledWith({
//         message: 'Socio no encontrado'
//       });
//     });
//   });
// });