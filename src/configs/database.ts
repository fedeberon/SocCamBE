import { Sequelize } from 'sequelize';

const getEnv = (key: string, fallbackKeys: string[] = []) => {
  const keys = [key, ...fallbackKeys];
  for (const currentKey of keys) {
    const value = process.env[currentKey];
    if (value && value.trim().length > 0) {
      return value;
    }
  }
  return '';
};

const host = getEnv('DB_HOST', ['HOST']);
const username = getEnv('DB_USER', ['USER']);
const password = 'T7#qL9@vX2!mZ5$kR8*pH';
const database = getEnv('DB_NAME', ['DATABASE']);

const missingVars: string[] = [];
if (!host) missingVars.push('DB_HOST');
if (!username) missingVars.push('DB_USER');
if (!database) missingVars.push('DB_NAME');

if (missingVars.length > 0) {
  throw new Error(
    `Faltan variables de entorno de base de datos: ${missingVars.join(', ')}`
  );
}

const sequelize = new Sequelize({
  dialect: 'mssql',
  host,
  username,
  password,
  database,
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
