const { WebpayPlus } = require('transbank-sdk');
const { Options, IntegrationApiKeys, Environment, IntegrationCommerceCodes } = require('transbank-sdk');
const Transaction = require('transbank-sdk/dist/es5/transbank/webpay/webpay_plus/transaction');
const InfoCompras = require('../models/InfoCompras'); // Importa el modelo de información de compras
const Flight = require('../models/Flight'); // Importa el modelo de vuelo
const InfoComprasController = require('./InfoComprasController');
const { info } = require('cli');

class WebpayController {
  static async createTransaction(req, res) {
    try {
      console.log('Authorization Header:', req.headers.authorization);
      const { id_compra } = req.body;

      const infoCompra = await InfoCompras.findOne({
        where: { id_compra },
      });

      if (!infoCompra) {
        throw new Error('Compra no encontrada');
      }

      const quantity = infoCompra.quantity;
      const groupId = infoCompra.group_id;
      const flightId = infoCompra.flight_id;

      const userId = req.auth.sub;
      console.log('idVuelo:', flightId);
      console.log('user_id:', userId);

      const buyOrder = infoCompra.request_id;

      const vuelo = await Flight.findByPk(flightId);
      if (!vuelo) {
        throw new Error('Vuelo no encontrado');
      }

      const amount = vuelo.price * quantity;

      const tx = new WebpayPlus.Transaction(new Options(IntegrationCommerceCodes.WEBPAY_PLUS, IntegrationApiKeys.WEBPAY, Environment.Integration));
      const trx = await tx.create(buyOrder, groupId, amount, `http://localhost:3000/confirm-transaction/${flightId}/${userId}/${quantity}/${ip}`);

      infoCompra.deposit_token = trx.token;
      infoCompra.save();

      res.status(200).json({ url: trx.url, token: trx.token });
    } catch (error) {
      console.error('Error creating transaction:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async confirmTransaction(req, res) {
    try {
      // 1. Obtén el token de la transacción del cuerpo de la solicitud
      const { token } = req.params;
      if (!token) {
        res.status(200).json({ message: 'Usuario anula compra' });
      }

      // 2. Confirma la transacción de WebPay
      const tx = new WebpayPlus.Transaction(new Options(IntegrationCommerceCodes.WEBPAY_PLUS, IntegrationApiKeys.WEBPAY, Environment.Integration));
      const confirmedTx = await tx.commit(token);

      // 3. Actualiza el estado de la compra en tu base de datos
      if (confirmedTx) {
        const infoCompra = await InfoCompras.findOne({
          where: { request_id: confirmedTx.buyOrder },
        });
        infoCompra.isValidated = true;
        if (confirmedTx.responseCode === 0) {
          infoCompra.valid = true;
          infoCompra.save();
          res.status(200).json({ message: 'Transacción exitosa' });
        } else {
          infoCompra.save();
          res.status(200).json({ message: 'Transacción fallida' });
        }
      }
      // 4. Envía una respuesta al canal de MQTT

s

      
    } catch (error) {
      console.error('Error confirming transaction:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}

module.exports = WebpayController;
