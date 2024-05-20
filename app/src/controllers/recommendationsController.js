const express = require('express');
const bodyParser = require('body-parser');
const Recommendations = require('../models/Recommendations'); // Asegúrate de tener un modelo de recomendaciones

const app = express();
app.use(bodyParser.json());

app.post('/recommendations', async (req, res) => {
    try {
        const { user_ip, recommendations } = req.body;

        // Guarda las recomendaciones en la base de datos
        await Recommendations.create({ user_ip, recommendations });

        res.status(201).json({ message: 'Recommendations saved successfully' });
    } catch (error) {
        console.error('Error saving recommendations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/recommendations/:user_ip', async (req, res) => {
    try {
        const { user_ip } = req.params;

        // Obtén las recomendaciones de la base de datos
        const recommendations = await Recommendations.findOne({ where: { user_ip } });

        if (!recommendations) {
            return res.status(404).json({ error: 'No recommendations found' });
        }

        res.status(200).json(recommendations);
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = app;
