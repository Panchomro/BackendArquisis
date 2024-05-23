const express = require('express');
const router = express.Router();
const RecommendationsController = require('../controllers/recommendationsController');
const checkJwt = require('../middlewares/auth');
const RecommendationController = require('../controllers/recommendationsController');

router.post('/recommendations', RecommendationsController.postRecommendations);
// router.get('/recommendations', RecommendationsController.getRecommendations);
router.get('/recommendations', checkJwt, RecommendationsController.getRecommendationsById);
router.get('/heartbeat-status', RecommendationController.getHeartbeatStatus);

module.exports = router;
