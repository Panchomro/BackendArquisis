const express = require('express');
const OffersController = require('../controllers/offersController');

const router = express.Router();

router.post('/recieveOffer', OffersController.recieveOffer);

router.get('/offer/:id', OffersController.getOfferById);

router.get('/offers/:id', OffersController.getOffers);

router.post('/sendOffer', OffersController.makeBid);

router.post('/recieveBid', OffersController.recieveBid);

router.post('/place-offer/:id', OffersController.placeOffer);

module.exports = router;
