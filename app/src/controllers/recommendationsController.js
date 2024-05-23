const express = require('express');
const bodyParser = require('body-parser');
const Recommendations = require('../models/Recommendations'); // Asegúrate de tener un modelo de recomendaciones
const axios = require('axios');
require('dotenv').config();

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
      res.status(500).json({ error: 'Internal server error 1' });
    }
  }
  static async getRecommendations(req, res) {
    try {
      // Obtén las recomendaciones de la base de datos
      const recommendations = await Recommendations.findAll({
        order: [['createdAt', 'DESC']], // Ordenar por fecha de creación, de más reciente a más antiguo
        limit: 27, // Limitar los resultados a los 27 más recientes
      });

      if (!recommendations) {
        return res.status(404).json({ error: 'No recommendations found' });
      }

      res.status(200).json(recommendations);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      res.status(500).json({ error: 'Internal server error 2' });
    }
  }

  static async getRecommendationsById(req, res) {
    try {
      const userId = req.auth.sub;

      // Obtén las recomendaciones de la base de datos
      
      const recommendations = await Recommendations.findAll({
        where: { user_id:userId },
        order: [['createdAt', 'DESC']], // Ordenar por fecha de creación, de más reciente a más antiguo
        limit: 1, // Limitar los resultados a los 3 más recientes
      });

      if (!recommendations) {
        return res.status(404).json({ error: 'No recommendations found' });
      }

      res.status(200).json(recommendations);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      res.status(500).json({ error: 'Internal server error 3' });
    }
  }
  static async getHeartbeatStatus(req, res) {
    try {
      const response = await axios.get(`http://producer:${process.env.PRODUCER_PORT}/heartbeat`);
      res.status(200).json({ status: response.data.status });
    } catch (error) {
      console.error('Error fetching heartbeat status:', error);
      res.status(500).json({ error: 'Error fetching heartbeat status' });
    }
  }
}



module.exports = RecommendationController;
