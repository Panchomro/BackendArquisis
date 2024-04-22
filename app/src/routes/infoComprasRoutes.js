const express = require('express');
const InfoComprasController = require('../controllers/InfoComprasController');

const router = express.Router();

router.post('/buy', InfoComprasController.createInfoCompras);

router.post('/flights/validations/:request_id', InfoComprasController.manejarValidation);

router.get('/historial', InfoComprasController.historialInfoCompras);

module.exports = router;
