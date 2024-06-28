const express = require('express');
const AdminController = require('../controllers/adminController');
const checkJwt = require('../middlewares/auth');

const router = express.Router();

// Ruta para obtener un vuelo reservado por ID
router.get('/flights/reserved/:id', checkJwt, AdminController.getReservedFlightById);

// Ruta para obtener la disponibilidad de un vuelo
router.get('/flights/availability/:id', checkJwt, AdminController.getAvailability);

// Ruta para cambiar la disponibilidad de un vuelo (utilizando PATCH en lugar de PUT)
router.post('/admin/reserved-flights/availability/:id', checkJwt, AdminController.changeAvailability);

// Ruta para comprar un vuelo reservado
router.post('/buyReserved', checkJwt, AdminController.buyReserved);

// Ruta para confirmar la transacción de una compra reservada
router.post('/reserved/confirm-transaction', checkJwt, AdminController.confirmTransaction);

// Ruta para obtener todos los vuelos reservados
router.get('/admin/reserved-flights', AdminController.getAllReservedFlights);

router.get('/availableReservedFlights', AdminController.getAvailableReservedFlights);



module.exports = router;
