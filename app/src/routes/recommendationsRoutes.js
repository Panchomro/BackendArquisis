const express = require('express');
const router = express.Router();
const RecommendationsController = require('../controllers/recommendationsController');
const checkJwt = require('../middlewares/auth');

router.post('/recommendations', RecommendationsController.postRecommendations);
// router.get('/recommendations', RecommendationsController.getRecommendations);
router.get('/recommendations', checkJwt, RecommendationsController.getRecommendationsById);
module.exports = router;
