const express = require('express');
const router = express.Router();
const Recommendation = require('../models/Recommendation');

router.post('/recommendations', async (req, res) => {
    try {
        const { user_ip, recommendations } = req.body;

        // Guardar las recomendaciones en la base de datos
        await Recommendation.create({ user_ip, recommendations });

        res.status(201).json({ message: 'Recommendations saved successfully' });
    } catch (error) {
        console.error('Error saving recommendations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/recommendations/:user_ip', async (req, res) => {
    try {
        const { user_ip } = req.params;

        // Obtener las recomendaciones de la base de datos
        const recommendation = await Recommendation.findOne({ where: { user_ip } });

        if (!recommendation) {
            return res.status(404).json({ error: 'No recommendations found' });
        }

        res.status(200).json(recommendation);
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
