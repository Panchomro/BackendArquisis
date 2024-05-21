const mqtt = require('mqtt');
const uuid = require('uuid-random');
const InfoCompras = require('../models/InfoCompras');
const Flight = require('../models/Flight');
require('dotenv').config();
const axios = require('axios');


class InfoComprasController {
  static async createInfoCompras(req, res) {
    try {
        // Obtener los parámetros de la consulta (query parameters)
        const { quantity, ip, flightId } = req.query;
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

        console.log(departureTimeChileno);

        // Crear un ID de solicitud único
        const requestId = uuid();

        // Calcular el precio total
        const priceTotal = vuelo.price * quantity;

        // Crear el registro de compra
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
        });

        console.log('infocompra:', infoCompra);

        // Enviar los datos de la compra a través de MQTT
        const jsonData = await InfoComprasController.findCompraEnviarJSON(infoCompra.id, quantity);
        InfoComprasController.enviarCompraMqtt(jsonData);

        // Enviar una respuesta exitosa
        res.status(200).json({ message: 'Compra creada exitosamente' });
    } catch (error) {
        console.error('Error al crear compra desde MQTT:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
  }


  static async findCompraEnviarJSON(id, quantity) {
    console.log('idCompra:', id);
    const infoCompra = await InfoCompras.findByPk(id);

    console.log('infoCompra Encontrada:', infoCompra);

    const jsonData = {
      request_id: infoCompra.request_id,
      group_id: infoCompra.group_id,
      departure_airport: infoCompra.departure_airport,
      arrival_airport: infoCompra.arrival_airport,
      departure_time: infoCompra.departure_time,
      datetime: infoCompra.datetime,
      deposit_token: '',
      quantity,
      seller: infoCompra.seller,
    };

    return jsonData;
  }

  static async enviarCompraMqtt(jsonData) {
    const mqttOptions = {
      host: process.env.BROKER_HOST,
      port: process.env.BROKER_PORT,
      username: process.env.BROKER_USER,
      password: process.env.BROKER_PASSWORD,
    };

    const mqttClient = mqtt.connect(`mqtt://${mqttOptions.host}`, mqttOptions);

    mqttClient.on('connect', () => {
      console.log('Conectado al broker MQTT dentro de enviarCompraMqtt');
      mqttClient.publish('flights/requests', JSON.stringify(jsonData));
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
      console.log('validationData:', validationData);
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
        //Una vez confirmada la compra se envía la información a la cola de RabbitMQ con el ip y la información de la compra
        try {
          await axios.post(`${process.env.PRODUCER_URL}/job`, {
            user_ip: infoCompra.user_ip,
            user_id: infoCompra.user_id,
            flight_id: vuelo.id,
          });
          console.log('Información enviada al productor');
        } catch (error) {
          console.error('Error al enviar la información al productor:', error);
        }
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

  // Método para obtener los proximos 20 vuelos que se envían a los workers para su procesamiento
  static async getFlightsForWorkers(req, res) {
    try {
      let {arrival_airport_id, arrival_airport_time} = req.query;
      
      if (!arrival_airport_id || !arrival_airport_time) {
        return res.status(400).json({ error: 'Faltan parámetros' });
      }
      
      const departureDate = new Date(arrival_airport_time);
      const oneWeekLater = new Date(departureDate);
      oneWeekLater.setDate(departureDate.getDate() + 7);

      const flights = await Flight.findAll({
        where: {
          departure_airport_id: arrival_airport_id,
          departure_airport_time: {
            [Op.between]: [departureDate, oneWeekLater],
          },
        },
        order: [['departure_airport_time', 'ASC']], // Order by departure_airport_time ascending
        limit: 20,
      });
      console.log('Vuelos encontrados:', flights);
      res.status(200).json({
        flights,
        totalCount: flights.length,
      });
    } catch (error) {
      console.error('Error al buscar vuelos:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}



module.exports = InfoComprasController;
