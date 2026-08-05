# Usa una imagen base oficial de Node.js
FROM node:22

# Instala Chromium para whatsapp-web.js
RUN apt-get update && apt-get install -y \
    chromium \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV DOCKER=true

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia el archivo package.json y package-lock.json
COPY package*.json ./

# Instala dependencias
RUN PUPPETEER_SKIP_DOWNLOAD=true npm ci

# Copia el resto del código del proyecto al contenedor
COPY . .

# Compila el proyecto TypeScript
RUN npm run build

# Expone el puerto en el que tu aplicación va a correr
EXPOSE 5000

# Comando por defecto: API; opcionalmente worker con APP_MODE=worker
CMD ["sh", "-c", "if [ \"${APP_MODE:-api}\" = \"worker\" ]; then node dist/workers/sosQueueWorker.js; else npm start; fi"]
