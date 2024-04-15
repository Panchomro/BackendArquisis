const express = require('express');
const InfoComprasController = require('../controllers/InfoComprasController');

const router = express.Router();

router.post('/flights/:id/buy', InfoComprasController.enviarCompraMqtt);

router.get('/flights/:id/validations', InfoComprasController.manejarValidation);

router.get('/flights/buy', InfoComprasController.mostrarInfoCompras)


module.exports = router;
