import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
  dialect: 'mssql',
  host: process.env.HOST,
  username: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  port: parseInt(process.env.DB_PORT || '1433'),
  dialectOptions: {
    options: {
      encrypt: true,
      trustServerCertificate: true,
      instanceName: process.env.INSTANCE_NAME
    },
  },
  logging: console.log,
});

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida correctamente.');
  } catch (error) {
    console.error('No se pudo conectar a la base de datos:', error);
  }
}

testConnection();

export default sequelize;