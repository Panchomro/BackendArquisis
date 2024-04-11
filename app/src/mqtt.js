const mqtt = require('mqtt');
const axios = require('axios');
require('dotenv').config(); 

const HOST = process.env.BROKER_HOST;
const PORT_MQTT = process.env.BROKER_PORT;
const USER = process.env.BROKER_USER;
const PASSWORD = process.env.BROKER_PASSWORD;
const TOPICFlights = 'flights/info';
const TOPICRequest = 'flights/requests';
const TOPICValidation = 'flights/validation';

const mqttClient = mqtt.connect(`mqtt://${HOST}:${PORT_MQTT}`, {
  username: USER,
  password: PASSWORD
});

// Conectar al broker MQTT
mqttClient.on('connect', function () {
  console.log('Conectado al broker MQTT');
  mqttClient.subscribe(TOPICFlights, function (err) {
    if (err) {
      console.error('Error al suscribirse al tópico', err);
    } else {
      console.log('Suscripción exitosa al tópico flights/info');
    }
  });
  mqttClient.subscribe(TOPICValidation, function (err) {
    if (err) {
      console.error('Error al suscribirse al tópico', err);
    } else {
      console.log('Suscripción exitosa al tópico flights/validation');
    }
  });
});

function publishInfoCompras(data) {
  mqttClient.publish(TOPICRequest, JSON.stringify(data), function (err) {
    if (err) {
      console.error('Error al publicar mensaje', err);
    } else {
      console.log('Mensaje publicado en el tópico', TOPICRequest);
    }
  });
}


mqttClient.on('message', async function (topic, message) {
  console.log('Mensaje recibido en el tópico', topic, ':', message.toString());
  if (topic === TOPICFlights) {
    try {
      
      console.log('message mqtt recibido:', message);

      const flightData = JSON.parse(message);

      console.log('Datos del vuelo mqtt recibidos despues de parse:', flightData);
      
      await axios.post('http://app:3000/flights', flightData);

      console.log('Datos del vuelo enviados a la API');
      
    } catch (error) {
      console.error('Error al procesar el mensaje:', error);
    }
  } else if (topic === TOPICValidation) {
    try {
      const validationData = JSON.parse(message);
      console.log('Datos de validación mqtt recibidos:', validationData);

      await axios.post('http://app:3000/flights/:id/validations', validationData);
    } catch (error) {
      console.error('Error al procesar el mensaje:', error);
    }
  }
});

module.exports = mqttClient;
