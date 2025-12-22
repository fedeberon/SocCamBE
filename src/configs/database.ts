import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
  dialect: 'mssql',
  host: "intercam-bolivar.database.windows.net",
  username: "intercam-dba",
  password: "kwxh/$yz@}KZ",
  database: "intercam-bolivar",
  port: parseInt(process.env.DB_PORT || '1433'),
  dialectOptions: {
    options: {
      encrypt: true,
      trustServerCertificate: false
    }
  },
  logging: console.log  
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