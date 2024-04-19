const express = require('express');
const InfoComprasController = require('../controllers/InfoComprasController');

const router = express.Router();

router.post('/flights/:id/:user_id/buy', InfoComprasController.createInfoCompras);

router.post('/flights/validations/:request_id', InfoComprasController.manejarValidation);

// router.get('/flights/historial', InfoComprasController.mostrarInfoCompras)


module.exports = router;
