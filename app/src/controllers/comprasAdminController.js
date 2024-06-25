const { v4: uuidv4 } = require('uuid');
const InfoCompras = require('../models/InfoCompras');
const Flight = require('../models/Flight');
const mqtt = require('mqtt');
require('dotenv').config();

class ComprasAdminController {
  // Método para que el administrador reserve pasajes
  static async reserveTickets(req, res) {
    try {
      const { flight_id, quantity } = req.body;
      const userId = req.auth.sub;  // Asumiendo que el ID del usuario está disponible en req.auth.sub

      if (!flight_id || !quantity || quantity <= 0) {
        return res.status(400).json({ error: 'Faltan parámetros o cantidad no válida' });
      }

      const flight = await Flight.findByPk(flight_id);
      if (!flight) {
        return res.status(404).json({ error: 'Vuelo no encontrado' });
      }

      if (flight.quantity < quantity) {
        return res.status(400).json({ error: 'No hay suficientes pasajes disponibles' });
      }

      // Obtener la fecha y hora actual en UTC
      const fechaHoraActualUTC = new Date();
      fechaHoraActualUTC.setHours(fechaHoraActualUTC.getHours() - 4);
      const datetimeChileno = fechaHoraActualUTC.toISOString().slice(0, 19).replace('T', ' ');

      // Ajustar la hora de salida del vuelo
      const departureTimeCL = new Date(flight.departure_airport_time);
      departureTimeCL.setHours(departureTimeCL.getHours() - 4);

      // Construir la cadena de fecha y hora de salida
      const year = departureTimeCL.getFullYear();
      const month = String(departureTimeCL.getMonth() + 1).padStart(2, '0');
      const day = String(departureTimeCL.getDate()).padStart(2, '0');
      const hours = String(departureTimeCL.getHours()).padStart(2, '0');
      const minutes = String(departureTimeCL.getMinutes()).padStart(2, '0');
      const departureTimeChileno = `${year}-${month}-${day} ${hours}:${minutes}`;

      // Crear un ID de solicitud único
      const requestId = uuidv4();

      // Calcular el precio total
      const totalPrice = flight.price * quantity;

      const newReservation = await InfoCompras.create({
        request_id: requestId,
        user_id: userId,
        airline_logo: flight.airline_logo,
        flight_id: flight.id,
        group_id: 'admin',  // Asumiendo que el ID del grupo del administrador es 'admin'
        departure_airport: flight.departure_airport_name,
        arrival_airport: flight.arrival_airport_name,
        departure_time: departureTimeChileno,
        datetime: datetimeChileno,
        deposit_token: null,
        quantity,
        seller: userId, // Asumiendo que el ID del administrador es el seller
        isValidated: true,
        valid: true,
        totalPrice,
        user_ip: req.ip,
        reserved: quantity,
      });

      // Actualizar la cantidad de pasajes disponibles en el vuelo
      await flight.update({ quantity: flight.quantity - quantity });

      res.status(201).json({ message: 'Pasajes reservados exitosamente', reservation: newReservation });
    } catch (error) {
      console.error('Error al reservar pasajes:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Método para ver los pasajes reservados por el administrador
  static async getReservedTickets(req, res) {
    try {
      const reservations = await InfoCompras.findAll({
        where: {
          group_id: 'admin',  // Asumiendo que el ID del grupo del administrador es 'admin'
          reserved: { [Op.gt]: 0 },
        },
      });

      res.status(200).json(reservations);
    } catch (error) {
      console.error('Error al obtener pasajes reservados:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Método para disponibilizar pasajes para subasta
  static async offerForAuction(req, res) {
    try {
      const { reservation_id } = req.body;

      const reservation = await InfoCompras.findByPk(reservation_id);
      if (!reservation) {
        return res.status(404).json({ error: 'Reserva no encontrada' });
      }

      // Simular el envío de un mensaje al canal flights/auctions
      const auctionMessage = {
        auction_id: uuidv4(),
        proposal_id: "",
        departure_airport: reservation.departure_airport,
        arrival_airport: reservation.arrival_airport,
        departure_time: reservation.departure_time,
        airline: reservation.airline_logo,
        quantity: reservation.reserved,
        group_id: reservation.group_id,
        type: "offer"
      };

      const mqttOptions = {
        host: process.env.BROKER_HOST,
        port: process.env.BROKER_PORT,
        username: process.env.BROKER_USER,
        password: process.env.BROKER_PASSWORD,
      };

      const mqttClient = mqtt.connect(`mqtt://${mqttOptions.host}`, mqttOptions);

      mqttClient.on('connect', () => {
        console.log('Conectado al broker MQTT dentro de offerForAuction');
        mqttClient.publish('flights/auctions', JSON.stringify(auctionMessage));
        console.log('Oferta de subasta enviada al broker MQTT');
        mqttClient.end();
      });

      mqttClient.on('error', (error) => {
        console.error('Error al conectar al broker MQTT dentro de offerForAuction:', error);
      });

      res.status(200).json({ message: 'Pasajes ofrecidos para subasta', auctionMessage });
    } catch (error) {
      console.error('Error al ofrecer pasajes para subasta:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}

module.exports = ComprasAdminController;
