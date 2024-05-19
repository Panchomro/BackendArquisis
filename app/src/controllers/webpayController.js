const Transbank = require('transbank-sdk');
const InfoCompras = require('../models/InfoCompras');
require('dotenv').config();

const axios = require('axios');

const Webpay = Transbank.WebpayPlus;
const {Options, IntegrationApiKeys, Environment, IntegrationCommerceCodes} = Transbank;

const webpay = new Webpay.Transaction(new Options(IntegrationCommerceCodes.WEBPAY_PLUS, IntegrationApiKeys.WEBPAY, Environment.Integration));

class WebPayController {
  static async initiatePayment(req, res) {
    try {
      const { flightId, quantity } = req.body;
      const userId = req.auth.sub;

      //obtener el precio final de la compra
      const flight = await Flight.findByPk(flightId);
      if (!flight) {
        return res.status(404).json({ error: 'Flight not found' });
      }

      const totalAmount = flight.price * quantity;

      //crear la transaccion en webpay
      const createResponse = await webpay.create(
        `${process.env.WEBPAY_RETURN_URL}/confirm`,
        `${process.env.WEBPAY_RETURN_URL}/cancel`,
        totalAmount,
        userId
      );
      // Guardar la transacción en la base de datos
      await InfoCompras.create({
        request_id: createResponse.token,
        user_id: userId,
        flight_id: flightId,
        totalPrice: totalAmount,
        quantity: quantity,
        isValidated: false,
        valid: false,
        user_ip: req.ip
      });

      // Devolver la URL de redirección
      res.json({ url: createResponse.url, token: createResponse.token });
    } catch (error) {
      console.error('Error al iniciar el pago con Webpay:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async confirmPayment(req, res) {
    try {
      const { token_ws } = req.body;

      // Confirmar la transacción en Webpay
      const commitResponse = await webpay.commit(token_ws);

      // Actualizar la transacción en la base de datos
      const infoCompra = await InfoCompras.findOne({ where: { request_id: token_ws } });
      if (!infoCompra) {
        return res.status(404).json({ error: 'Compra no encontrada' });
      }

      if (commitResponse.status === 'AUTHORIZED') {
        infoCompra.valid = true;
        infoCompra.isValidated = true;
      } else {
        infoCompra.valid = false;
        infoCompra.isValidated = true;
      }

      await infoCompra.save();

      // Redirigir al usuario a la página de éxito o fallo
      if (infoCompra.valid) {
        res.redirect(`${process.env.FRONTEND_URL}/success`);
      } else {
        res.redirect(`${process.env.FRONTEND_URL}/failure`);
      }
    } catch (error) {
      console.error('Error al confirmar el pago con Webpay:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}

module.exports = WebPayController;
