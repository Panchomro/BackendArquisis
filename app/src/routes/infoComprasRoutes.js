const express = require('express');
const InfoComprasController = require('../controllers/InfoComprasController');
const WebpayController = require('../controllers/webpayController');
const checkJwt = require('../middlewares/auth');

const router = express.Router();

router.post('/buy', checkJwt, InfoComprasController.createInfoCompras);

router.post('/create-transaction', WebpayController.createTransaction);

router.post('/flights/validations/:request_id', InfoComprasController.manejarValidation);

router.post('/confirm-transaction', checkJwt, WebpayController.confirmTransaction);

router.get('/historial', checkJwt, InfoComprasController.historialInfoCompras);

module.exports = router;
