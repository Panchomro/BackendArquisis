const express = require('express');
const WebpayController = require('../controllers/webpayController');
const checkJwt = require('../middlewares/auth');

const router = express.Router();

router.post('/webpay/initiate', checkJwt, WebpayController.initiatePayment);
router.post('/webpay/confirm', WebpayController.confirmPayment);

module.exports = router;
