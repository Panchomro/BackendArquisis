const express = require('express');
const InfoComprasController = require('../controllers/InfoComprasController');

const router = express.Router();

router.get('/flights/:id/buy', InfoComprasController.createInfoCompras);

router.get('/flights/validations/:request_id', InfoComprasController.manejarValidation);

router.get('/flights/historial', InfoComprasController.mostrarInfoCompras)


module.exports = router;
