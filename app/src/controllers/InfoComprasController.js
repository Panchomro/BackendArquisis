const InfoCompras = require('../models/InfoCompras');
const Flight = require('../models/Flight');
const { Op } = require('sequelize');
const mqttClient = require('../mqtt');
const { use } = require('../routes/infoComprasRoutes');

class InfoComprasController {
    static async createInfoCompras(idVuelo) {
        try{
            const fechaHoraActual = new Date();
            const datetime = fechaHoraActual.toISOString().slice(0, 19).replace('T', ' ');
            const vuelo = await Flight.findByPk(idVuelo);

            if (!vuelo) {
                throw new Error('Vuelo no encontrado');
            }

            const infoCompra = await InfoCompras.create({
                flight_id: vuelo.id,
                user_id: 1,
                group_id: vuelo.group_id,
                departure_airport: vuelo.departure_airport_id,
                arrival_airport: vuelo.arrival_airport_id,
                departure_time: vuelo.departure_airport_time,
                datetime: datetime,
                quantity: 90,
                seller: 0,
                valid: false,
            });

        } catch (error) {
            console.error('Error al crear compra desde MQTT:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }

    static async enviarCompraMqtt(req, res) {
        try {
            const infoCompra = await InfoComprasController.createInfoCompras(req.params.id);
            console.log('Compra creada exitosamente con request_id:', req.params.id);

            res.status(201).json({ message: 'Compra creada exitosamente' });

            const jsonData = { 
                request_id: infoCompra.request_id, 
                group_id: infoCompra.group_id, 
                departure_airport: infoCompra.departure_airport, 
                arrival_airport: infoCompra.arrival_airport, 
                departure_time: infoCompra.departure_time, 
                datetime: infoCompra.datetime,
                deposit_token: "", 
                quantity: infoCompra.quantity, 
                seller: infoCompra.seller 
            };

            mqttClient.publishInfoCompras(jsonData);
        }
        catch (error) {
            console.error('Error al crear compra:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }

    static async manejarValidation(validationData) {
        try {
            const infoCompra = await InfoCompras.findByPk(validationData.request_id);

            if (!infoCompra) {
                throw new Error('Compra no encontrada');
            }

            infoCompra.valid = validationData.valid;
            await infoCompra.save();

            console.log(`Se actualizó el atributo 'valid' de InfoCompras con request_id ${request_id}`);
        }
        catch (error) {
            console.error('Error al obtener compras:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }

    static async mostrarInfoCompras(req, res) {
        try {
            const infoCompras = await InfoCompras.findAll();
            res.status(200).json(infoCompras);
        } catch (error) {
            console.error('Error al buscar objetos InfoCompras:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
}


module.exports = InfoComprasController;