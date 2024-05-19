const express = require('express');
const { initiatePayment, handleReturn, handleFinal } = require('../controllers/paymentController');
const router = express.Router();

router.post('/api/payment/initiate', initiatePayment);
router.post('/api/payment/return', handleReturn);
router.post('/api/payment/final', handleFinal);

module.exports = router;
