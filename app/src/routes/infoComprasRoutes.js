const express = require('express');
const InfoComprasController = require('../controllers/InfoComprasController');
const checkJwt = require('../middlewares/auth');

const router = express.Router();

router.post('/buy', checkJwt, InfoComprasController.createInfoCompras);

router.post('/flights/validations/:request_id', InfoComprasController.manejarValidation);

router.get('/historial', checkJwt, InfoComprasController.historialInfoCompras);

module.exports = router;
