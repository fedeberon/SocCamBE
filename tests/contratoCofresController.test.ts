// import { Request, Response } from 'express';
// import ContratoCofresController from '../src/controllers/contratoCofres.controller';
// import ContratoCofresService from '../src/service/contratoCofres.service';
// import ContratoCofres from '../src/models/contratoCofres.models';
// import logger from '../src/configs/logger';

// // Mock de Sequelize
// jest.mock('sequelize', () => {
//   const mSequelize = {
//     Model: class {
//       public static init() { return this; }
//       public static findAll() { return Promise.resolve([]); }
//       public static findByPk() { return Promise.resolve(null); }
//     },
//     DataTypes: {
//       INTEGER: 'INTEGER',
//       STRING: 'STRING',
//       BOOLEAN: 'BOOLEAN',
//       DATE: 'DATE'
//     }
//   };
//   return mSequelize;
// });

// // Mock de la base de datos
// jest.mock('../src/configs/database', () => ({
//   define: jest.fn(),
//   sync: jest.fn(),
//   transaction: jest.fn(),
// }));

// // Mock del modelo
// jest.mock('../src/models/contratoCofres.models');

// // Mock del servicio
// jest.mock('../src/service/contratoCofres.service');

// // Mock del logger
// jest.mock('../src/configs/logger');

// describe('ContratoCofresController', () => {
//   let mockRequest: Partial<Request>;
//   let mockResponse: Partial<Response>;
//   let responseObject: any;

//   // Crear un mock completo de ContratoCofres
//   const createMockContratoCofres = (override = {}): ContratoCofres => {
//     return {
//       contratoCofres_id: 1,
//       contratoCofres_tipo: 'TIPO',
//       contratoCofres_numero: 1,
//       contratoCofres_esSocioId: 1,
//       contratoCofres_cofreLetra: 'A',
//       contratoCofres_cofreNumero: 1,
//       contratoCofres_cofreTipo: 'TIPO',
//       contratoCofres_nombre: 'Nombre',
//       contratoCofres_modalidad: 'MODALIDAD',
//       contratoCofres_conjunta1: '',
//       contratoCofres_conjunta2: '',
//       contratoCofres_conjunta3: '',
//       contratoCofres_fechaContratacion: new Date(),
//       contratoCofres_fechaVencimiento: new Date(),
//       contratoCofres_estado: 'ACTIVO',
//       contratoCofres_recibirInfo: true,
//       contratoCofres_contactoCalle: 'Calle',
//       contratoCofres_contactoCalleNum: '123',
//       contratoCofres_contactoCallePiso: '1',
//       contratoCofres_contactoCalleDepto: 'A',
//       contratoCofres_contactoCP: '1234',
//       contratoCofres_contactoCiudad: 'Ciudad',
//       contratoCofres_contactoProvincia: 'Provincia',
//       contratoCofres_contactoTel: '123456',
//       contratoCofres_contactoCel: '123456',
//       contratoCofres_contactoMail: 'mail@test.com',
//       contratoCofres_deleted: false,
//       contratoCofres_modificado: new Date(),
//       contratoCofres_cuitFacturacion: '20123456789',
//       contratoCofres_factRazonSocial: 'Razón Social',
//       contratoCofres_factLocalidad: 'Localidad',
//       contratoCofres_factDomicilio: 'Domicilio',
//       contratoCofres_factProvincia: 'Provincia',
//       contratoCofres_factCF: 'CF',
//       ...override
//     } as ContratoCofres;
//   };

//   beforeEach(() => {
//     responseObject = {
//       json: jest.fn().mockReturnThis(),
//       status: jest.fn().mockReturnThis(),
//     };
//     mockRequest = {};
//     mockResponse = responseObject;
//   });

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   describe('getContratoCofres', () => {
//     it('debería obtener todos los contratos de cofres exitosamente', async () => {
//       const mockContratos = [
//         createMockContratoCofres({ contratoCofres_id: 1 }),
//         createMockContratoCofres({ contratoCofres_id: 2 })
//       ];

//       (ContratoCofresService as jest.MockedClass<typeof ContratoCofresService>).prototype.getAllContratoCofres.mockResolvedValueOnce(mockContratos);

//       await ContratoCofresController.getContratoCofres(
//         mockRequest as Request,
//         mockResponse as Response
//       );

//       expect(mockResponse.status).toHaveBeenCalledWith(200);
//       expect(mockResponse.json).toHaveBeenCalledWith(mockContratos);
//     });

//     it('debería manejar errores al obtener los contratos', async () => {
//       const error = new Error('Error de base de datos');
      
//       (ContratoCofresService as jest.MockedClass<typeof ContratoCofresService>).prototype.getAllContratoCofres.mockRejectedValueOnce(error);

//       await ContratoCofresController.getContratoCofres(
//         mockRequest as Request,
//         mockResponse as Response
//       );

//       expect(logger.error).toHaveBeenCalled();
//       expect(mockResponse.status).toHaveBeenCalledWith(500);
//       expect(mockResponse.json).toHaveBeenCalledWith({
//         message: 'Error al obtener los contratos de cofres',
//         error
//       });
//     });
//   });

//   describe('getContratoCofresById', () => {
//     it('debería obtener un contrato por ID exitosamente', async () => {
//       const mockContrato = createMockContratoCofres({ contratoCofres_id: 1 });

//       mockRequest = {
//         params: { id: '1' }
//       };

//       (ContratoCofresService as jest.MockedClass<typeof ContratoCofresService>).prototype.getContratoCofresById.mockResolvedValueOnce(mockContrato);

//       await ContratoCofresController.getContratoCofresById(
//         mockRequest as Request,
//         mockResponse as Response
//       );

//       expect(mockResponse.status).toHaveBeenCalledWith(200);
//       expect(mockResponse.json).toHaveBeenCalledWith(mockContrato);
//     });

//     it('debería retornar 404 cuando no se encuentra el contrato', async () => {
//       mockRequest = {
//         params: { id: '999' }
//       };

//       (ContratoCofresService as jest.MockedClass<typeof ContratoCofresService>).prototype.getContratoCofresById.mockResolvedValueOnce(null);

//       await ContratoCofresController.getContratoCofresById(
//         mockRequest as Request,
//         mockResponse as Response
//       );

//       expect(mockResponse.status).toHaveBeenCalledWith(404);
//       expect(mockResponse.json).toHaveBeenCalledWith({
//         message: 'Contrato de cofre no encontrado'
//       });
//     });

//     it('debería manejar errores al buscar por ID', async () => {
//       const error = new Error('Error de base de datos');
//       mockRequest = {
//         params: { id: '1' }
//       };

//       (ContratoCofresService as jest.MockedClass<typeof ContratoCofresService>).prototype.getContratoCofresById.mockRejectedValueOnce(error);

//       await ContratoCofresController.getContratoCofresById(
//         mockRequest as Request,
//         mockResponse as Response
//       );

//       expect(logger.error).toHaveBeenCalled();
//       expect(mockResponse.status).toHaveBeenCalledWith(500);
//       expect(mockResponse.json).toHaveBeenCalledWith({
//         message: 'Error al obtener el contrato de cofre',
//         error
//       });
//     });
//   });

//   describe('getContratoCofressBySocioId', () => {
//     it('debería obtener contratos por socioId exitosamente', async () => {
//       const mockContratos = [
//         createMockContratoCofres({ contratoCofres_id: 1, contratoCofres_esSocioId: 123 }),
//         createMockContratoCofres({ contratoCofres_id: 2, contratoCofres_esSocioId: 123 })
//       ];

//       mockRequest = {
//         params: { socioId: '123' }
//       };

//       (ContratoCofresService as jest.MockedClass<typeof ContratoCofresService>).prototype.getContratoCofressBySocioId.mockResolvedValueOnce(mockContratos);

//       await ContratoCofresController.getContratoCofressBySocioId(
//         mockRequest as Request,
//         mockResponse as Response
//       );

//       expect(mockResponse.status).toHaveBeenCalledWith(200);
//       expect(mockResponse.json).toHaveBeenCalledWith(mockContratos);
//     });

//     it('debería retornar 404 cuando no se encuentran contratos para el socio', async () => {
//       mockRequest = {
//         params: { socioId: '999' }
//       };

//       (ContratoCofresService as jest.MockedClass<typeof ContratoCofresService>).prototype.getContratoCofressBySocioId.mockResolvedValueOnce([]);

//       await ContratoCofresController.getContratoCofressBySocioId(
//         mockRequest as Request,
//         mockResponse as Response
//       );

//       expect(mockResponse.status).toHaveBeenCalledWith(404);
//       expect(mockResponse.json).toHaveBeenCalledWith({
//         message: 'No se encontraron contratos de cofre para este socio'
//       });
//     });

//     it('debería manejar errores al buscar por socioId', async () => {
//       const error = new Error('Error de base de datos');
//       mockRequest = {
//         params: { socioId: '123' }
//       };

//       (ContratoCofresService as jest.MockedClass<typeof ContratoCofresService>).prototype.getContratoCofressBySocioId.mockRejectedValueOnce(error);

//       await ContratoCofresController.getContratoCofressBySocioId(
//         mockRequest as Request,
//         mockResponse as Response
//       );

//       expect(logger.error).toHaveBeenCalled();
//       expect(mockResponse.status).toHaveBeenCalledWith(500);
//       expect(mockResponse.json).toHaveBeenCalledWith({
//         message: 'Error al obtener los contratos de cofre por socio',
//         error
//       });
//     });
//   });
// });