const express = require('express');
const FlightController = require('../controllers/flightController');
const checkJwt = require('../middlewares/auth');

const router = express.Router();

router.post('/flights', FlightController.createFlight);

router.get('/flights', checkJwt, FlightController.getFlights);

router.get('/flights/:id', checkJwt, FlightController.getFlightById);

module.exports = router;
