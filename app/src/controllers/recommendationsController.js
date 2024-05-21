const express = require('express');
const bodyParser = require('body-parser');
const Recommendations = require('../models/Recommendations'); // Asegúrate de tener un modelo de recomendaciones

const app = express();
app.use(bodyParser.json());

class RecommendationController {
  static async postRecommendations(req, res) {
    try {
      const { user_ip, user_id, recommendations } = req.body;

      // Guarda las recomendaciones en la base de datos
      await Recommendations.create({ user_ip, user_id, recommendations });

      res.status(201).json({ message: 'Recommendations saved successfully' });
    } catch (error) {
      console.error('Error saving recommendations:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getRecommendations(req, res) {
    try {
      const { user_id } = req.params;

      // Obtén las recomendaciones de la base de datos
      // Obtén las recomendaciones de la base de datos
      const recommendations = await Recommendations.findAll({
        where: { user_id },
        order: [['createdAt', 'DESC']], // Ordenar por fecha de creación, de más reciente a más antiguo
        limit: 3, // Limitar los resultados a los 3 más recientes
      });

      if (!recommendations) {
        return res.status(404).json({ error: 'No recommendations found' });
      }

      res.status(200).json(recommendations);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
module.exports = RecommendationController;
