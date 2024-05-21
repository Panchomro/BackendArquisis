const express = require('express');

const router = express.Router();
const RecommendationsController = require('../controllers/recommendationsController');
// const checkJwt = require('../middlewares/auth');

router.post('/recommendations', RecommendationsController.postRecommendations);
router.get('/recommendations/:user_id', RecommendationsController.getRecommendations);
module.exports = router;
