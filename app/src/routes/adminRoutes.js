const express = require('express');
const AdminController = require('../controllers/adminController');
const checkJwt = require('../middlewares/auth');

const router = express.Router();

router.get('/flights/reserved/:id', AdminController.getReservedFlightById);

router.get('/flights/availability/:id', AdminController.getAvailableFlightById);

router.patch('/flights/availability/:id', AdminController.updateAvailableFlightById);

router.post('/buy/reserved', checkJwt, AdminController.buyReservedFlight);

router.post('/reserved/confirm-transaction', checkJwt, AdminController.confirmTransaction);

module.exports = router;
