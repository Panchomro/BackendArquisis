const { Op } = require('sequelize');
const Flight = require('../models/Flight');

class FlightController {
  static async createFlight(req, res) {
    try {
      // Obtener los datos del cuerpo de la solicitud MQTT
      const mqttData = req.body;

      // Extraer la información de los vuelos y otros datos
      const {
        flights, carbonEmission, price, currency, airlineLogo,
      } = mqttData[0];

      // Convertir la cadena JSON de vuelos en un objeto JavaScript
      const parsedFlights = JSON.parse(flights);

      // Crear un documento de vuelo en la base de datos para cada vuelo
      const flightPromises = parsedFlights.map(async (flight) => {
        await Flight.create({
          departure_airport_name: flight.departure_airport.name,
          departure_airport_id: flight.departure_airport.id,
          departure_airport_time: new Date(flight.departure_airport.time),
          arrival_airport_name: flight.arrival_airport.name,
          arrival_airport_id: flight.arrival_airport.id,
          arrival_airport_time: new Date(flight.arrival_airport.time),
          duration: flight.duration,
          airplane: flight.airplane,
          airline: flight.airline,
          airline_logo: flight.airline_logo,
          carbon_emissions: JSON.parse(carbonEmission).this_flight || null,
          price,
          currency,
          airlineLogo,
          quantity: 90,
        });
      });

      // Esperar a que todas las promesas de creación de vuelos se resuelvan
      try {
        await Promise.all(flightPromises);
        console.log('Vuelos creados exitosamente');
      } catch (error) {
        console.error('Error al esperar las promesas:', error);
        // Manejar el error según sea necesario
      }

      // Enviar una respuesta de éxito
      res.status(201).json({ message: 'Vuelos creados exitosamente' });
    } catch (error) {
      console.error('Error al crear vuelo desde MQTT:', error);
      // Enviar una respuesta de error
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async getFlightById(req, res) {
    const { id } = req.params;
    try {
      const flight = await Flight.findByPk(id);
      if (!flight) {
        return res.status(404).json({ error: 'Vuelo no encontrado' });
      }
      res.json(flight);
    } catch (error) {
      console.error('Error al obtener el vuelo de la base de datos:', error);
      res.status(500).json({ error: 'Error al obtener el vuelo de la base de datos' });
    }
  }

  static async getFlights(req, res) {
    try {
      let {
        departure_airport_id, arrival_airport_id, departure_airport_time, page, count,
      } = req.query;

      page = parseInt(page, 10) || 1;
      count = parseInt(count, 10) || 25;
      const offset = (page - 1) * count;
      const whereCondition = {};

      if (departure_airport_id) {
        whereCondition.departure_airport_id = departure_airport_id;
      }
      if (arrival_airport_id) {
        whereCondition.arrival_airport_id = arrival_airport_id;
      }
      if (departure_airport_time) {
        const departureDate = new Date(departure_airport_time);
        whereCondition.departure_airport_time = {
          [Op.gte]: departureDate,
        };
      }

      const flights = await Flight.findAndCountAll({
        where: whereCondition,
        limit: count,
        offset,
      });

      console.log('Vuelos encontrados:', flights.rows);
      res.status(200).json({
        flights: flights.rows,
        totalCount: flights.count,
        totalPages: Math.ceil(flights.count / count),
        currentPage: page,
      });
    } catch (error) {
      console.error('Error al buscar vuelos:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
  // Método para obtener los proximos 20 vuelos que se envían a los workers para su procesamiento
  static async getFlightsForWorkers(req, res) {
    try {
      // Log de los parámetros recibidos
      console.log('Parámetros recibidos:', req.query);
  
      let { createdAt, departure_airport_id } = req.query;
  
      if (!departure_airport_id || !createdAt) {
        return res.status(400).json({ error: 'Faltan parámetros' });
      }
  
      const creationDate = new Date(createdAt);
      const oneWeekLater = new Date(creationDate);
      oneWeekLater.setDate(creationDate.getDate() + 7);
  
      // Log de los rangos de fechas
      console.log('Rango de fechas:', creationDate, oneWeekLater);
  
      const flights = await Flight.findAll({
        where: {
          departure_airport_id: departure_airport_id, //COMENTAR ESTA LINEA PARA TESTEAR!! SINO, NO SE VAN A ENCONTRAR VUELOS 
          createdAt: {
            [Op.between]: [creationDate, oneWeekLater],
          },
        },
        order: [['createdAt', 'ASC']], // Ordenar por departure_airport_time ascendente
        limit: 20,
      });
  
      // Log de los vuelos encontrados
      console.log('Vuelos encontrados:', flights);
  
      res.status(200).json({
        flights,
        totalCount: flights.length,
      });
    } catch (error) {
      // Log del error detallado
      console.error('Error al buscar vuelos:', error);
  
      // Responder con el mensaje de error específico
      res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
  }
}

module.exports = FlightController;
