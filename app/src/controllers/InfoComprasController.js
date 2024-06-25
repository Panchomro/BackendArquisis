const mqtt = require('mqtt');
const axios = require('axios');
const { Op } = require('sequelize');
const short = require('short-uuid');
const InfoCompras = require('../models/InfoCompras');
const Flight = require('../models/Flight');
const WebpayController = require('./webpayController');
const { info } = require('cli');
require('dotenv').config();

class InfoComprasController {
  static async createInfoCompras(req, res) {
    try {
      // Obtener los parámetros de la consulta (query parameters)
      const { quantity, ip, flightId } = req.body;
      const userId = req.auth.sub;

      console.log('idVuelo:', flightId);
      console.log('user_id:', userId);

      // Obtener la fecha y hora actual en UTC
      const fechaHoraActualUTC = new Date();
      fechaHoraActualUTC.setHours(fechaHoraActualUTC.getHours() - 4);
      const datetimeChileno = fechaHoraActualUTC.toISOString().slice(0, 19).replace('T', ' ');

      // Buscar el vuelo por su ID
      const vuelo = await Flight.findByPk(flightId);
      if (!vuelo) {
        throw new Error('Vuelo no encontrado');
      }

      // Ajustar la hora de salida del vuelo
      const departureTimeCL = new Date(vuelo.departure_airport_time);
      departureTimeCL.setHours(departureTimeCL.getHours() - 4);

      // Construir la cadena de fecha y hora de salida
      const year = departureTimeCL.getFullYear();
      const month = String(departureTimeCL.getMonth() + 1).padStart(2, '0');
      const day = String(departureTimeCL.getDate()).padStart(2, '0');
      const hours = String(departureTimeCL.getHours()).padStart(2, '0');
      const minutes = String(departureTimeCL.getMinutes()).padStart(2, '0');
      const departureTimeChileno = `${year}-${month}-${day} ${hours}:${minutes}`;

      // Crear un ID de solicitud único
      const translator = short();
      const requestId = translator.new();

      // Calcular el precio total
      const priceTotal = vuelo.price * quantity;

      const isAdmin = false;
      let infoCompra;

      // Crear el registro de compra
      if (typeof isAdmin === 'undefined' || !isAdmin) {
        const infoCompra = await InfoCompras.create({
          request_id: requestId,
          flight_id: vuelo.id,
          user_id: userId,
          airline_logo: vuelo.airline_logo,
          group_id: '13',
          departure_airport: vuelo.departure_airport_id,
          arrival_airport: vuelo.arrival_airport_id,
          departure_time: departureTimeChileno,
          datetime: datetimeChileno,
          totalPrice: priceTotal,
          quantity,
          seller: 0,
          isValidated: false,
          valid: false,
          user_ip: ip,
          reserved: false,
        });
      } else {
        const infoCompra = await InfoCompras.create({
          request_id: requestId,
          flight_id: vuelo.id,
          user_id: userId,
          airline_logo: vuelo.airline_logo,
          group_id: '13',
          departure_airport: vuelo.departure_airport_id,
          arrival_airport: vuelo.arrival_airport_id,
          departure_time: departureTimeChileno,
          datetime: datetimeChileno,
          totalPrice: priceTotal,
          quantity,
          seller: 13,
          isValidated: false,
          valid: false,
          user_ip: ip,
          reserved: true,
        });
      }

      console.log('Compra creada:', infoCompra);
      // Crear transaccion con webpay para el token
      const transactionResponse = await axios.post('http://app:3000/create-transaction', {
        id_compra: infoCompra.id,
      });

      console.log('transactionResponse:', transactionResponse.data);

      if (transactionResponse.status !== 200) {
        throw new Error('Error al crear transacción con Webpay');
      }

      // Enviar los datos de la compra a través de MQTT
      const jsonData = await InfoComprasController.findCompraEnviarJSON(infoCompra.id, quantity);
      InfoComprasController.enviarCompraMqtt(jsonData, 'request');
      // Enviar una respuesta exitosa
      res.status(200).json(transactionResponse.data);
    } catch (error) {
      console.error('Error al crear compra desde MQTT:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async createValidationData(id) {
    const infoCompra = await InfoCompras.findByPk(id);
    const validationData = {
      request_id: infoCompra.request_id,
      group_id: infoCompra.group_id,
      seller: infoCompra.seller,
      valid: infoCompra.valid,
    };
    return validationData;
  }

  static async findCompraEnviarJSON(id, quantity) {
    console.log('idCompra:', id);
    const infoCompra = await InfoCompras.findByPk(id);

    const jsonData = {
      request_id: infoCompra.request_id,
      group_id: infoCompra.group_id,
      departure_airport: infoCompra.departure_airport,
      arrival_airport: infoCompra.arrival_airport,
      departure_time: infoCompra.departure_time,
      datetime: infoCompra.datetime,
      deposit_token: infoCompra.deposit_token,
      quantity,
      seller: infoCompra.seller,
    };

    return jsonData;
  }

  static async enviarCompraMqtt(data, type) {
    const mqttOptions = {
      host: process.env.BROKER_HOST,
      port: process.env.BROKER_PORT,
      username: process.env.BROKER_USER,
      password: process.env.BROKER_PASSWORD,
    };

    const mqttClient = mqtt.connect(`mqtt://${mqttOptions.host}`, mqttOptions);

    mqttClient.on('connect', () => {
      console.log('Conectado al broker MQTT dentro de enviarCompraMqtt');
      if (type === 'request') {
        mqttClient.publish('flights/requests', JSON.stringify(data));
      } else if (type === 'validation') {
        mqttClient.publish('flights/validation', JSON.stringify(data));
      }
      console.log('Request enviada al broker MQTT');
      mqttClient.end();
    });

    mqttClient.on('error', (error) => {
      console.error('Error al conectar al broker MQTT dentro de enviarCompraMqtt:', error);
    });
  }

  static async manejarValidation(req, res) {
    try {
      const { request_id } = req.params;
      console.log('request_id:', request_id);
      console.log('req.body:', req.body);
      const validationData = req.body;
      const infoCompra = await InfoCompras.findOne({
        where: { request_id },
      });

      const vuelo = await Flight.findOne({
        where: { id: infoCompra.flight_id },
      });

      if (!infoCompra) {
        throw new Error('Compra no encontrada');
      }
      if (validationData.valid === true) {
        infoCompra.valid = validationData.valid;
        vuelo.quantity -= infoCompra.quantity;
        infoCompra.isValidated = true;
        await infoCompra.save();
        await vuelo.save();
        console.log('Compra validada');
        res.status(200).json({ message: 'Validación exitosa, compra aprobada' });
        // Una vez confirmada la compra se envía la información a la cola de RabbitMQ con el ip
        // y la información de la compra

        // });
      } else if (validationData.valid === false) {
        infoCompra.isValidated = true;
        await infoCompra.save();
        console.log('Compra invalida');
        res.status(200).json({ message: 'Validación no exitosa, compra rechazada' });
      }

      console.log(`Se actualizó el atributo 'valid' de InfoCompras con request_id ${infoCompra.request_id}`);
    } catch (error) {
      console.error('Error al obtener compras:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async historialInfoCompras(req, res) {
    try {
      // Acceder al userId desde el JWT decodificado
      const userId = req.auth.sub;
      console.log('userId:', userId);

      const infoCompras = await InfoCompras.findAll({
        where: { user_id: userId },
      });
      console.log('infoCompras:', infoCompras);

      res.status(200).json(infoCompras);
    } catch (error) {
      console.error('Error al buscar historial de InfoCompras:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}

module.exports = InfoComprasController;
