# Usar la imagen base de Node.js
FROM node:16-alpine

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /

# Copiar el archivo package.json y package-lock.json
COPY package*.json ./

RUN npm install

COPY mqtt.js ./

COPY . .

# Exponer el puerto en el que se ejecuta el servidor MQTT (si es necesario)
#EXPOSE 9000

CMD ["node", "mqtt.js"]
