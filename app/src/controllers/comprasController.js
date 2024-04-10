const InfoCompras = require('../models/Compras');
const { Op } = require('sequelize');

class ComprasController {
    static async createCompra(req, res) {
    try{
        const mqttData = req.body;
    } catch (error) {
        console.error('Error al crear compra desde MQTT:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
    }
}