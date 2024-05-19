const axios = require('axios');

class WebPayController {
  static async initiateTransaction(req, res) {
    try {
      // Obtener los parámetros de la consulta
      const { amount, sessionId, buyOrder, returnUrl, finalUrl } = req.query;

      // Iniciar una transacción con WebPay
      const response = await axios.post('https://webpay.example.com/initiate', {
        amount,
        sessionId,
        buyOrder,
        returnUrl,
        finalUrl,
      });

      // Enviar una respuesta con el token de transacción y la URL de redireccionamiento
      res.status(200).json({
        token: response.data.token,
        url: response.data.url,
      });
    } catch (error) {
      console.error('Error al iniciar transacción con WebPay:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}

module.exports = WebPayController;
