const express = require('express');
const InfoComprasController = require('../controllers/InfoComprasController');
const WebPayController = require('../controllers/webpayController');
const checkJwt = require('../middlewares/auth');

const router = express.Router();

router.post('/buy', checkJwt, InfoComprasController.createInfoCompras);
router.post('/api/payment/initiate', checkJwt,WebPayController.initiateTransaction);

router.post('/flights/validations/:request_id', InfoComprasController.manejarValidation);

router.get('/historial', checkJwt, InfoComprasController.historialInfoCompras);

module.exports = router;
