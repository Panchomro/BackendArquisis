const express = require('express');
const FlightController = require('../controllers/flightController');

const router = express.Router();

router.post('/flights', FlightController.createFlight);

router.get('/flights', FlightController.getFlights);

router.get('/flights/:id', FlightController.getFlightById);

router.get('/forWorkers', FlightController.getFlightsForWorkers);

router.get('/flights/check-availability/:flightId', FlightController.checkFlightAvailability);



module.exports = router;
