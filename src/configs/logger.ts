import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: 'info', // Nivel mínimo de mensajes que se van a registrar (info, warn, error, etc.)
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Añade una marca de tiempo
    format.printf(
      ({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`
    ) // Formato del mensaje
  ),
  transports: [
    new transports.Console(), // Para que los mensajes aparezcan en la consola
    new transports.File({ filename: 'logs/error.log', level: 'error' }), // Archivos para errores
    new transports.File({ filename: 'logs/combined.log' }), // Archivo para todos los logs
  ],
});

export default logger;
