const { Op } = require('sequelize');
const axios = require('axios');
const short = require('short-uuid');
const { WebpayPlus } = require('transbank-sdk');
const { Options, IntegrationApiKeys, Environment, IntegrationCommerceCodes } = require('transbank-sdk');
const InfoCompras = require('../models/InfoCompras');
const Flight = require('../models/Flight');
require('dotenv').config();

class AdminController {
  static async getReservedFlightById(req, res) { // Recibe params flightid sacado de compra
    const { id } = req.params;
    try {
      const { infoComprasAdmin, count } = await InfoCompras.findAndCountAll({
        where: {
          reserved: true,
          available: true,
          flight_id: id,
        }, // Filtrar por el ID del usuario
      });
      let foundFlight = false;

      if (count === 0) {
        res.status(200).json({ error: 'Vuelo no cuenta con reserva disponible' });
      } else {
        const discountRate = 0.15;
        const infoCompraPromises = infoComprasAdmin.forEach(async (infoCompra) => {
          if (infoCompra.quantity > 0) {
            if (infoCompra.flight_id === id) {
              foundFlight = true;
              const initialFlight = await Flight.findByPk(infoCompra.flight_id);
              const reservedFlight = {
                id: initialFlight.id,
                departure_airport_name: initialFlight.departure_airport_name,
                departure_airport_id: initialFlight.departure_airport_id,
                departure_airport_time: initialFlight.departure_airport_time,
                arrival_airport_name: initialFlight.arrival_airport_name,
                arrival_airport_id: initialFlight.arrival_airport_id,
                arrival_airport_time: initialFlight.arrival_airport_time,
                duration: initialFlight.duration,
                airplane: initialFlight.airplane,
                airline: initialFlight.airline,
                airline_logo: initialFlight.airline_logo,
                carbon_emissions: initialFlight.carbon_emissions,
                price: initialFlight.price * (1 - discountRate),
                currency: initialFlight.currency,
                airlineLogo: initialFlight.airlineLogo,
                quantity: infoCompra.quantity,
              };
              res.status(200).json(reservedFlight);
            }
          }
        });

        try {
          await Promise.all(infoCompraPromises);
          console.log('Vuelos reservados checkeados exitosamente');
        } catch (error) {
          console.error('Error al esperar las promesas:', error);
          // Manejar el error según sea necesario
        }
      }

      if (!foundFlight) {
        res.status(200).json({ message: 'Vuelo no tiene pasajes reservados disponibles' });
      }
    } catch (error) {
      console.error('Error al entregar vuelo reservado', error);
      // Enviar una respuesta de error
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async getAvailability(req, res) {
    const { id } = req.params;
    try {
      const infoCompra = await InfoCompras.findOne({
        where: { request_id: id },
      });
      if (!infoCompra) {
        res.status(404).json({ error: 'Vuelo no encontrado' });
      } else {
        res.status(200).json({available: infoCompra.available});
      }
    } catch (error) {
      console.error('Error al obtener la disponibilidad del vuelo:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async changeAvailability(req, res) {
    const { id } = req.params;
    try {
      const infoCompra = await InfoCompras.findOne({
        where: {
          reserved: true,
          flight_id: id,
        },
      });
  
      if (!infoCompra) {
        return res.status(404).json({ error: 'Vuelo no encontrado' });
      }
  
      infoCompra.available = !infoCompra.available;
      await infoCompra.save();
      res.status(200).json({ message: 'Disponibilidad del vuelo cambiada exitosamente' });
    } catch (error) {
      console.error('Error al cambiar la disponibilidad del vuelo:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async buyReserved(req, res) {
    try {
      // Obtener los parámetros de la consulta (query parameters)
      const { quantity, ip, flightId } = req.body;
      const userId = req.auth.sub;

      // Obtener la fecha y hora actual en UTC
      const fechaHoraActualUTC = new Date();
      fechaHoraActualUTC.setHours(fechaHoraActualUTC.getHours() - 4);
      const datetimeChileno = fechaHoraActualUTC.toISOString().slice(0, 19).replace('T', ' ');

      // Buscar el vuelo por su ID
      const reservedBuyOrder = await InfoCompras.findOne({
        where: {
          reserved: true,
          flight_id: flightId,
        },
      });

      if (!reservedBuyOrder) {
        throw new Error('Vuelo no encontrado');
      }

      if (quantity > reservedBuyOrder.quantity) {
        throw new Error('Cantidad de pasajes a comprar excede la cantidad reservada');
      }

      // Ajustar la hora de salida del vuelo
      const departureTimeCL = new Date(reservedBuyOrder.departure_time);
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
      const priceTotal = reservedBuyOrder.totalPrice * 0.85;

      const infoCompra = await InfoCompras.create({
        request_id: requestId,
        flight_id: reservedBuyOrder.id,
        user_id: userId,
        airline_logo: reservedBuyOrder.airline_logo,
        group_id: '13',
        departure_airport: reservedBuyOrder.departure_airport,
        arrival_airport: reservedBuyOrder.arrival_airport,
        departure_time: departureTimeChileno,
        datetime: datetimeChileno,
        totalPrice: priceTotal,
        quantity,
        seller: 0,
        isValidated: true,
        valid: true,
        user_ip: ip,
        reserved: false,
      });

      console.log('Compra creada:', infoCompra);
      // Crear transaccion con webpay para el token
      const transactionResponse = await axios.post('http://app:3000/create-transaction', {
        id_compra: infoCompra.id,
      });

      console.log('transactionResponse:', transactionResponse.data);

      if (transactionResponse.status !== 200) {
        throw new Error('Error al crear transacción con Webpay');
      }

      // Enviar una respuesta exitosa
      res.status(200).json(transactionResponse.data);
    } catch (error) {
      console.error('Error al crear compra', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async confirmTransaction(req, res) {
    try {
      // 1. Obtén el token de la transacción del cuerpo de la solicitud
      const { token_ws } = req.body;
      console.log('token de confirmacion:', token_ws);
      if (!token_ws) {
        res.status(200).json({ message: 'Usuario anula compra' });
      }

      // 2. Confirma la transacción de WebPay
      const tx = new WebpayPlus.Transaction(new Options(IntegrationCommerceCodes.WEBPAY_PLUS, IntegrationApiKeys.WEBPAY, Environment.Integration));
      const confirmedTx = await tx.commit(token_ws);

      // 3. Actualiza el estado de la compra en tu base de datos
      const infoCompra = await InfoCompras.findOne({
        where: { request_id: confirmedTx.buy_order },
      });
      infoCompra.isValidated = true;
      if (confirmedTx.response_code === 0) {
        infoCompra.valid = true;
        infoCompra.save();
        //Gatillante workers
        try {
          await axios.post(`http://producer:${process.env.PRODUCER_PORT}/job`, {
            user_ip: infoCompra.user_ip,
            user_id: infoCompra.user_id,
            flight_id: infoCompra.flight_id,
          });
          console.log('Información enviada al productor');
        } catch (error) {
          console.error('Error al enviar la información al productor:', error);
        }
        res.status(200).json({ message: 'Transacción exitosa' });
      } else {
        infoCompra.save();
        res.status(200).json({ message: 'Transacción fallida' });
      }
    } catch (error) {
      console.error('Error confirming transaction:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async manejarValidation(req, res) {
    try {
      const { request_id } = req.params;
      const validationData = req.body;
      const infoCompra = await InfoCompras.findOne({
        where: { request_id },
      });

      const infoCompraAdmin = await InfoCompras.findOne({
        where: {
          flight_id: infoCompra.flight_id,
          reserved: true,
          available: true,
         },
      });

      if (!infoCompraAdmin || !infoCompra) {
        throw new Error('Compra no encontrada');
      }
      if (validationData.valid === true) {
        infoCompra.valid = validationData.valid;
        infoCompraAdmin.quantity -= infoCompra.quantity;
        infoCompra.isValidated = true;
        await infoCompra.save();
        await infoCompraAdmin.save();
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
  // Nueva función para obtener todos los vuelos reservados
  static async getAllReservedFlights(req, res) {
    try {
      const reservedFlights = await InfoCompras.findAll({
        where: { reserved: true }
      });

      if (reservedFlights.length === 0) {
        return res.status(404).json({ error: 'No hay vuelos reservados' });
      }

      res.status(200).json(reservedFlights);
    } catch (error) {
      console.error('Error fetching reserved flights:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  

}

module.exports = AdminController;
