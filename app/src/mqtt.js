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


// Enviar información al tópico flights/requests
const requestData = { /* Datos de la solicitud */ };
mqttClient.publish(TOPICRequest, JSON.stringify(requestData), function (err) {
  if (err) {
    console.error('Error al publicar en el tópico flights/requests:', err);
  } else {
    console.log('Información enviada al tópico flights/requests');
  }
});


mqttClient.on('message', async function (topic, message) {
  console.log('Mensaje recibido en el tópico', topic, ':', message.toString());
  if (topic === TOPICFlights) {
    try {
      // Convertir la cadena de texto JSON en un objeto JSON
      console.log('message mqtt recibido:', message);
      const flightData = JSON.parse(message);
      console.log('Datos del vuelo mqtt recibidos despues de parse:', flightData);
      // Enviar los datos del vuelo a tu API mediante Axios
      await axios.post('http://app:3000/flights', flightData);
      console.log('Datos del vuelo enviados a la API');
    } catch (error) {
      console.error('Error al procesar el mensaje:', error);
    }
  } else if (topic === TOPICValidation) {
    try {
      console.log('Datos de validación enviados a la API');
    } catch (error) {
      console.error('Error al procesar el mensaje:', error);
    }
  }
});

module.exports = mqttClient;
