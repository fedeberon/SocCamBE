import request from 'supertest';
require('dotenv').config();
import express from 'express';
import bodyParser from 'body-parser';
import userRoutes from '../src/router/user.routes';
import User from '../src/models/user.model';
import sequelize from '../src/configs/database';

// Configura la aplicación Express para las pruebas
const app = express();
app.use(bodyParser.json());
app.use('/user', userRoutes);

// Configura la base de datos para pruebas
beforeAll(async () => {
  await sequelize.sync({ force: true }); // Reinicia la base de datos antes de las pruebas
});

afterAll(async () => {
  await sequelize.close(); // Cierra la conexión después de las pruebas
});

describe('UserController', () => {
  test('should create a new user', async () => {
    const response = await request(app).post('/user').send({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });

    expect(response.status).toBe(201);
    expect(response.body.user).toHaveProperty('id');
    expect(response.body.user.username).toBe('testuser');
  });

  test('should get user by ID', async () => {
    // Primero crea un usuario
    const createdUser = await User.create({
      username: 'testuser2',
      email: 'test2@example.com',
      password: 'password1234',
    });

    const response = await request(app).get(`/user/${createdUser.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
    expect(response.body.username).toBe('testuser2');
  });

  test('should update user', async () => {
    // Primero crea un usuario
    const createdUser = await User.create({
      username: 'testuser3',
      email: 'test3@example.com',
      password: 'password123',
    });

    const response = await request(app).put(`/user/${createdUser.id}`).send({
      username: 'updateduser',
      email: 'updated@example.com',
      password: 'newpassword123',
    });

    expect(response.status).toBe(200);
    expect(response.body.user.username).toBe('updateduser');
  });

  test('should delete user', async () => {
    // Primero crea un usuario
    const createdUser = await User.create({
      username: 'testuser4',
      email: 'test4@example.com',
      password: 'password123',
    });

    const response = await request(app).delete(`/user/${createdUser.id}`);

    expect(response.status).toBe(204);

    // Verificar que el usuario ha sido eliminado
    const deletedUser = await User.findByPk(createdUser.id);
    expect(deletedUser).toBeNull();
  });
});
