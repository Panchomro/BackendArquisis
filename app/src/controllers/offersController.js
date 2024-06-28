const { Op } = require('sequelize');
const short = require('short-uuid');
const Flight = require('../models/Flight');
const Offers = require('../models/Offers');
const InfoCompras = require('../models/InfoCompras');
const InfoComprasController = require('./InfoComprasController');
const { tryCatch } = require('bullmq');
const { info } = require('cli');

class OfferController {
  static async recieveOffer(req, res) {
    try {
      // Obtener los datos del cuerpo de la solicitud MQTT
      const mqttData = req.body;

      // Extraer la información de los vuelos y otros datos
      const {
        auction_id, proposal_id, departure_airport, arrival_airport,
        departure_time, airline, quantity, group_id, type,
      } = mqttData;

      //Obtener el vuelo correspondiente
      const flightOffered = await Flight.findOne({
        where: {
          departure_airport_name: departure_airport,
          arrival_airport_name: arrival_airport,
          departure_airport_time: departure_time,
          airline,
        },
      });

      if (!flightOffered) {
        throw new Error('Vuelo no encontrado');
      }

      const flightId = flightOffered.id;

      // Crear un documento de vuelo en la base de datos para cada vuelo
      const newOffer = await Offers.create({
        auction_id,
        proposal_id,
        departure_airport,
        arrival_airport,
        departure_time,
        airline,
        quantity,
        group_id,
        type,
        flight_id: flightId,
        isFinished: false,
      });

      console.log('Oferta creada:', newOffer);
      // Enviar una respuesta de éxito
      res.status(201).json({ message: 'Oferta creada exitosamente' });
    } catch (error) {
      console.error('Error al crear oferta desde MQTT:', error);
      // Enviar una respuesta de error
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async getOfferById(req, res) {
    const { id } = req.params;
    try {
      const offer = await Offers.findByPk(id);
      if (!offer) {
        res.status(404).json({ error: 'Oferta no encontrada' });
      }
      res.json(offer);
    } catch (error) {
      console.error('Error al obtener la oferta de la base de datos:', error);
      res.status(500).json({ error: 'Error al obtener la oferta de la base de datos' });
    }
  }

  static async getOffers(req, res) {
    try {
      const { type } = req.params;
      if (type === 'incoming-offers') {
        const offers = await Offers.findAll({ where: {
          type: 'offer',
          group_id: { [Op.ne]: '13'}
        },
        });
      } else if (type === 'outgoing-offers') {
        const offers = await Offers.findAll({ where: {
          type: 'offer',
          group_id: '13',
          isFinished: false,
        },
        });
      } else if (type === 'incoming-proposals') {
        const offers = await Offers.findAll({ where: {
          type: 'proposal',
          group_id: { [Op.ne]: '13'}
        },
        });
      } else if (type === 'outgoing-proposals') {
        const offers = await Offers.findAll({ where: {
          type: 'proposal',
          group_id: '13',
        },
        });
      } else if (type === 'response-to-my-bids') {
        const offers = await Offers.findAll({ where: {
          group_id: '13',
          [Op.or]: [{type: 'acceptance'}, {type: 'rejection'}],
        },
        });
      }
      if (!offers) {
        return res.status(404).json({ error: 'Ofertas no encontradas' });
      }
      res.status(200).json(offers);
    } catch (error) {
      console.error('Error al obtener las ofertas de la base de datos:', error);
      res.status(500).json({ error: 'Error al obtener las ofertas de la base de datos' });
    }
  }

  static async makeBid(req, res) {
    const { auction_id, intercambio_id, quantity } = req.body;
    try {
      const infoCompra = await InfoCompras.findByPk(intercambio_id);
      if (!infoCompra) {
        return res.status(404).json({ error: 'Compra no encontrada' });
      }

      if (infoCompra.quantity < quantity) {
        return res.status(400).json({ error: 'Cantidad de asientos insuficiente' });
      }

      const offer = await Offers.findOne({
        where: {
          auction_id,
          type: 'offer',
        },
      });
      if (!offer) {
        return res.status(404).json({ error: 'Oferta no encontrada' });
      }

      // Restar la cantidad de asientos de la oferta para que no puedan ser adquiridos
      infoCompra.quantity -= quantity;
      await infoCompra.save();

      // Crear un ID de propuesta unico
      const translator = short();
      const proposal_id = translator.new();

      // Crear una nueva oferta con los datos proporcionados
      const newOffer = await Offers.create({
        auction_id,
        proposal_id,
        departure_airport: offer.departure_airport,
        arrival_airport: offer.arrival_airport,
        departure_time: offer.departure_time,
        airline: offer.airline,
        quantity,
        group_id: '13',
        type: 'proposal',
        flight_id: offer.flight_id,
        isFinished: false,
      });

      const offerData = {
        auction_id,
        proposal_id,
        departure_airport: offer.departure_airport,
        arrival_airport: offer.arrival_airport,
        departure_time: offer.departure_time,
        airline: offer.airline,
        quantity,
        group_id: '13',
        type: 'proposal',
      };
      InfoComprasController.enviarCompraMqtt(offerData, 'auction');

      res.status(201).json(newOffer);
      console.log('Oferta enviada a la subasta:', newOffer);
    } catch (error) {
      console.error('Error al crear oferta:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async placeOffer(req, res) {
    const { infoCompra_id, quantity } = req.body;
    try {
      const infoCompra = await InfoCompras.findByPk(infoCompra_id);
      if (!infoCompra) {
        return res.status(404).json({ error: 'Compra no encontrada' });
      }
      if (infoCompra.quantity < quantity) {
        return res.status(400).json({ error: 'Cantidad de asientos insuficiente' });
      }

      const translator = short();
      const auction_id = translator.new();

      const offer = await Offers.create({
        auction_id,
        proposal_id: '',
        departure_airport: infoCompra.departure_airport,
        arrival_airport: infoCompra.arrival_airport,
        departure_time: infoCompra.departure_time,
        airline: infoCompra.airline,
        quantity,
        group_id: '13',
        type: 'offer',
        flight_id: infoCompra.flight_id,
        isFinished: false,
      });

      const offerData = {
        auction_id,
        proposal_id: '',
        departure_airport: infoCompra.departure_airport,
        arrival_airport: infoCompra.arrival_airport,
        departure_time: infoCompra.departure_time,
        airline: infoCompra.airline,
        quantity,
        group_id: '13',
        type: 'offer',
      };

      InfoComprasController.enviarCompraMqtt(offerData, 'auction');

      res.status(200).json({ message: 'Oferta publicada' });
    } catch (error) {
      console.error('Error al finalizar la oferta:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async offerMatchesOneByUs(auction_id, type) {
    let madeByUs = false; // Existe una oferta hecha por nosotros que haga match?
    if (type === 'proposal') {
      try {
        const offersMatch = await Offers.findAll({
          where: {
            auction_id,
          },
        });
        if (!offer) {
          return madeByUs;
        }
        const offerPromises = offersMatch.map(async (offer) => {
          if (offer.type === 'offer') {
            if (offer.group_id === '13') {
              madeByUs = true;
            }
          }
        });
        try {
          await Promise.all(offerPromises);
          console.log('Ofertas revisadas exitosamente');
        } catch (error) {
          console.error('Error al esperar las promesas:', error);
        }
        return madeByUs;
      } catch (error) {
        console.error('Error al obtener la oferta:', error);
        throw new Error('Error al obtener la oferta');
      }
    } else if (type === 'acceptance' || type === 'rejection') {
      try {
        const offersMatch = await Offers.findAll({
          where: {
            auction_id,
          },
        });
        if (!offer) {
          return madeByUs;
        }
        const offerPromises = offersMatch.map(async (offer) => {
          if (offer.type === 'proposal') {
            if (offer.group_id === '13') {
              madeByUs = true;
            }
          }
        });
        try {
          await Promise.all(offerPromises);
          console.log('Ofertas revisadas exitosamente');
        } catch (error) {
          console.error('Error al esperar las promesas:', error);
        }
        return madeByUs;
      } catch (error) {
        console.error('Error al obtener la oferta:', error);
        throw new Error('Error al obtener la oferta');
      }
    }
  }

  static async recieveBid(req, res) {
    const {
      auction_id, proposal_id, departure_airport, arrival_airport,
      departure_time, airline, quantity, group_id, type,
    } = req.body;
    try {
      const shouldSaveBid = await OfferController.offerMatchesOneByUs(auction_id, type);
      if (shouldSaveBid) {
        const flightOffered = await Flight.findOne({
          where: {
            departure_airport_name: departure_airport,
            arrival_airport_name: arrival_airport,
            departure_airport_time: departure_time,
            airline,
          },
        });
        if (!flightOffered) {
          return res.status(404).json({ error: 'Vuelo no encontrado' });
        }

        const newBid = await Offers.create({
          auction_id,
          proposal_id,
          departure_airport,
          arrival_airport,
          departure_time,
          airline,
          quantity,
          group_id,
          type,
          flight_id: flightOffered.id,
          isFinished: false,
        });
        res.status(201).json({ message: 'Oferta creada exitosamente' });

        if (type === 'acceptance' || type === 'rejection') {
          OfferController.handleOurBidResponse(type, newBid.id);
        }
      }
    } catch (error) {
      console.error('Error al crear oferta desde MQTT:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async handleOurBidResponse(response, bid_id) {
    if (response === 'rejection') {
      const rejectedBidResponse = await Offers.findByPk(bid_id);
      const rejectedBid = await Offers.findOne({
        where: {
          proposal_id: rejectedBidResponse.proposal_id,
          type: 'proposal',
        },
      });
      const infoCompra = await InfoCompras.findOne({
        where: {
          flight_id: rejectedBid.flight_id,
          reserved: true,
        },
      });

      infoCompra.quantity += rejectedBid.quantity;
      await infoCompra.save();
      rejectedBidResponse.isFinished = true;
      await rejectedBidResponse.save();
      rejectedBid.isFinished = true;
      await rejectedBid.save();

    } else if (response === 'acceptance') {
      const acceptedBidResponse = await Offers.findByPk(bid_id);
      const acceptedBid = await Offers.findOne({
        where: {
          proposal_id: acceptedBidResponse.proposal_id,
          type: 'proposal',
        },
      });
      const acceptedOffer = await Offers.findOne({
        where: {
          auction_id: acceptedBidResponse.auction_id,
          type: 'offer',
        },
      });
      acceptedBidResponse.isFinished = true;
      await acceptedBidResponse.save();
      acceptedBid.isFinished = true;
      await acceptedBid.save();
      acceptedOffer.isFinished = true;
      await acceptedOffer.save();

      const orderOffered = await InfoCompras.findOne({
        where: {
          flight_id: acceptedOffer.flight_id,
          reserved: true,
        },
      });

      const flightObtained = await Flight.findByPk(acceptedOffer.flight_id);

      const translator = short();
      const requestId = translator.new();

      const infoCompra = await InfoCompras.create({
        request_id: requestId,
        user_id: orderOffered.user_id,
        airline_logo: flightObtained.airline_logo,
        flight_id: flightObtained.id,
        group_id: '13',
        departure_airport: flightObtained.departure_airport_name,
        arrival_airport: flightObtained.arrival_airport_name,
        departure_time: flightObtained.departure_airport_time,
        datetime: flightObtained.datetime,
        quantity: acceptedOffer.quantity,
        seller: 13,
        isValidated: true,
        valid: true,
        total_price: acceptedOffer.quantity * (flightObtained.price * 0.85),
        user_ip: orderOffered.user_ip,
        reserved: true,
        available: false,
      });
    }
  }

  static async answerProposal(req, res) {
    const { offer_id } = req.params;
    const { answer } = req.body;
    try {
      const recievedBid = await Offers.findByPk(offer_id);
      if (!recievedBid) {
        return res.status(404).json({ error: 'Propuesta no encontrada' });
      }
      const infoCompra = await InfoCompras.findOne({
        where: {
          flight_id: recievedBid.flight_id,
          reserved: true,
        },
      });
      if (!infoCompra) {
        return res.status(404).json({ error: 'Compra no encontrada' });
      }
      const offerPlaced = await Offers.findOne({
        where: {
          proposal_id: recievedBid.proposal_id,
          type: 'offer',
          group_id: '13',
        },
      });
      if (!offerPlaced) {
        return res.status(404).json({ error: 'Oferta no encontrada' });
      }
      if (answer === 'accept') {
        const responseData = {
          auction_id: recievedBid.auction_id,
          proposal_id: recievedBid.proposal_id,
          departure_airport: recievedBid.departure_airport,
          arrival_airport: recievedBid.arrival_airport,
          departure_time: recievedBid.departure_time,
          airline: recievedBid.airline,
          quantity: recievedBid.quantity,
          group_id: recievedBid.group_id,
          type: 'acceptance',
        };
        if (infoCompra.quantity < offerPlaced.quantity) {
          res.status(200).json({ error: 'El vuelo ofrecido ya fue vendido' });
          responseData.type = 'rejection';
        } else if (infoCompra.quantity === offerPlaced.quantity) {
          infoCompra.reserved = false;
          infoCompra.quantity -= offerPlaced.quantity;
          await infoCompra.save();
        } else {
          infoCompra.quantity -= offerPlaced.quantity;
          await infoCompra.save();
        }
        recievedBid.isFinished = true;
        await recievedBid.save();
        offerPlaced.isFinished = true;
        await offerPlaced.save();
        res.status(200).json({ message: 'Propuesta aceptada' });

        InfoComprasController.enviarCompraMqtt(responseData, 'auction');
      } else if (answer === 'denied') {
        recievedBid.isFinished = true;
        await recievedBid.save();
        res.status(200).json({ message: 'Propuesta rechazada' });

        const responseData = {
          auction_id: recievedBid.auction_id,
          proposal_id: recievedBid.proposal_id,
          departure_airport: recievedBid.departure_airport,
          arrival_airport: recievedBid.arrival_airport,
          departure_time: recievedBid.departure_time,
          airline: recievedBid.airline,
          quantity: recievedBid.quantity,
          group_id: recievedBid.group_id,
          type: 'rejection',
        };
        InfoComprasController.enviarCompraMqtt(responseData, 'auction');
      }
    } catch (error) {
      console.error('Error al responder a la propuesta:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}

module.exports = OfferController;
