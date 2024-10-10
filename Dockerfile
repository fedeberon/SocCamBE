# Usa una imagen base oficial de Node.js
FROM node:22-alpine

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia el archivo package.json y package-lock.json
COPY package*.json ./

# Instala las dependencias del proyecto
RUN npm install

# Copia el resto del código del proyecto al contenedor
COPY . .

# Compila el proyecto TypeScript
RUN npm run build

# Expone el puerto en el que tu aplicación va a correr
EXPOSE 5000

# Comando por defecto para iniciar la aplicación
CMD ["npm", "start"]
