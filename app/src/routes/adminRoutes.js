const express = require('express');
const router = express.Router();
const ComprasAdminController = require('../controllers/ComprasAdminController');
const { checkJwt, checkPermission } = require('../middlewares/auth');

// Ruta para que el administrador reserve pasajes
router.post('/reserve-tickets', checkJwt, checkPermission('update:reserved'), ComprasAdminController.reserveTickets);

// Ruta para obtener los pasajes reservados por el administrador
router.get('/reserved-tickets', checkJwt, checkPermission('update:reserved'), ComprasAdminController.getReservedTickets);

// Ruta para ofrecer pasajes reservados para subasta
router.post('/offer-for-auction', checkJwt, checkPermission('update:reserved'), ComprasAdminController.offerForAuction);

module.exports = router;

