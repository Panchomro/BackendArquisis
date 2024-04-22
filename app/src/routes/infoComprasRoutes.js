const express = require('express');
const InfoComprasController = require('../controllers/InfoComprasController');

const router = express.Router();

router.post('/buy/:id/:user_id', InfoComprasController.createInfoCompras);

router.post('/flights/validations/:request_id', InfoComprasController.manejarValidation);

router.get('/historial/:userId', InfoComprasController.historialInfoCompras);

module.exports = router;
