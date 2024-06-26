const { WebpayPlus } = require('transbank-sdk');
const { Options, IntegrationApiKeys, Environment, IntegrationCommerceCodes } = require('transbank-sdk');
const Transaction = require('transbank-sdk/dist/es5/transbank/webpay/webpay_plus/transaction');
const InfoCompras = require('../models/InfoCompras');
const Flight = require('../models/Flight');
const InfoComprasController = require('./InfoComprasController');
const { info } = require('cli');
const { default: axios } = require('axios');
require('dotenv').config();

class WebpayController {
  static async createTransaction(req, res) {
    try {
      const { id_compra } = req.body;
      console.log('id_compra:', id_compra);

      const infoCompra = await InfoCompras.findOne({
        where: { id: id_compra},
      });

      if (!infoCompra) {
        throw new Error('Compra no encontrada');
      }

      const groupId = infoCompra.group_id;
      const flightId = infoCompra.flight_id;
      console.log('groupId:', groupId);

      const buyOrder = infoCompra.request_id;
      console.log('buyOrder:', buyOrder);

      const vuelo = await Flight.findByPk(flightId);
      if (!vuelo) {
        throw new Error('Vuelo no encontrado');
      }

      const amount = infoCompra.totalPrice;
      console.log('amount:', amount);

      const tx = new WebpayPlus.Transaction(
        new Options(IntegrationCommerceCodes.WEBPAY_PLUS, IntegrationApiKeys.WEBPAY, Environment.Integration)
      );
      const trx = await tx.create(buyOrder, groupId, amount, `http://localhost:5173/transaction`);

      infoCompra.deposit_token = trx.token;
      console.log('deposit_token:', trx.token);
      await infoCompra.save();

      res.status(200).json({ url: trx.url, token: trx.token });
    } catch (error) {
      console.log('Error al crear transacción:', error);
      console.error('Error creating transaction:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async confirmTransaction(req, res) {
    try {
      const { token_ws } = req.body;
      console.log('token de confirmacion:', token_ws);
      if (!token_ws) {
        res.status(200).json({ message: 'Usuario anula compra' });
      }

      const tx = new WebpayPlus.Transaction(
        new Options(IntegrationCommerceCodes.WEBPAY_PLUS, IntegrationApiKeys.WEBPAY, Environment.Integration)
      );
      const confirmedTx = await tx.commit(token_ws);

      const infoCompra = await InfoCompras.findOne({
        where: { request_id: confirmedTx.buy_order },
      });

      if (!infoCompra) {
        throw new Error('Compra no encontrada');
      }

      infoCompra.isValidated = true;
      if (confirmedTx.response_code === 0) {
        infoCompra.valid = true;
        await infoCompra.save();

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
        await infoCompra.save();
        res.status(200).json({ message: 'Transacción fallida' });
      }

      console.log('este es infoCompra.id:', infoCompra.id);

      const validationData = await InfoComprasController.createValidationData(infoCompra.id);
      console.log('Validation data:', validationData);
      InfoComprasController.enviarCompraMqtt(validationData, 'validation');
    } catch (error) {
      console.error('Error confirming transaction:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}

module.exports = WebpayController;

