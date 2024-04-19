const InfoCompras = require('../models/InfoCompras');
const Flight = require('../models/Flight');
const mqtt = require('mqtt');
const uuid = require('uuid-random');
require('dotenv').config();

class InfoComprasController {
    static async createInfoCompras(req, res) {
        try{
            const { id, user_id } = req.params;
            const { quantity } = req.body; 
            console.log('idVuelo:', id);
            console.log('user_id:', user_id);
            const fechaHoraActualUTC = new Date();
            fechaHoraActualUTC.setHours(fechaHoraActualUTC.getHours() - 4);
            const datetimeChileno = fechaHoraActualUTC.toISOString().slice(0, 19).replace('T', ' ');
            const vuelo = await Flight.findByPk(id);

            const departureTimeCL = vuelo.departure_airport_time;
            departureTimeCL.setHours(departureTimeCL.getHours() - 4);

            // Obtener componentes de fecha y hora
            const year = departureTimeCL.getFullYear();
            const month = String(departureTimeCL.getMonth() + 1).padStart(2, '0'); // Sumar 1 al mes porque los meses en JavaScript van de 0 a 11
            const day = String(departureTimeCL.getDate()).padStart(2, '0');
            const hours = String(departureTimeCL.getHours()).padStart(2, '0');
            const minutes = String(departureTimeCL.getMinutes()).padStart(2, '0');

            // Construir la cadena de fecha y hora
            const departureTimeChileno = `${year}-${month}-${day} ${hours}:${minutes}`;

            console.log(departureTimeChileno);


            if (!vuelo) {
                throw new Error('Vuelo no encontrado');
            }

            const requestId = uuid();
            
            const infoCompra = await InfoCompras.create({
                request_id: requestId,
                flight_id: vuelo.id,
                user_id: user_id,
                airline_logo: vuelo.airline_logo,
                group_id: "13",
                departure_airport: vuelo.departure_airport_id,
                arrival_airport: vuelo.arrival_airport_id,
                departure_time: departureTimeChileno,
                datetime: datetimeChileno,
                quantity: quantity,
                seller: 0,
                isValidated: false,
                valid: false,
            });

            console.log('infocompra:', infoCompra);
            const jsonData = await InfoComprasController.findCompraEnviarJSON(infoCompra.id, quantity);
            InfoComprasController.enviarCompraMqtt(jsonData);

        } catch (error) {
            console.error('Error al crear compra desde MQTT:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }

    static async findCompraEnviarJSON(id, quantity) {
        console.log('idCompra:', id)
        const infoCompra = await InfoCompras.findByPk(id);

        console.log('infoCompra Encontrada:', infoCompra);

        const jsonData = { 
            request_id: infoCompra.request_id, 
            group_id: infoCompra.group_id, 
            departure_airport: infoCompra.departure_airport, 
            arrival_airport: infoCompra.arrival_airport, 
            departure_time: infoCompra.departure_time, 
            datetime: infoCompra.datetime,
            deposit_token: "", 
            quantity: quantity, 
            seller: infoCompra.seller
        };
        
        return jsonData;
    }

    static async enviarCompraMqtt(jsonData) {
        const mqttOptions = {
            host: process.env.BROKER_HOST,
            port: process.env.BROKER_PORT,
            username: process.env.BROKER_USER,
            password: process.env.BROKER_PASSWORD
        };

        const mqttClient = mqtt.connect('mqtt://' + mqttOptions.host, mqttOptions)

        mqttClient.on('connect', function () {
            console.log('Conectado al broker MQTT dentro de enviarCompraMqtt');
            mqttClient.publish('flights/requests', JSON.stringify(jsonData));
            console.log('Request enviada al broker MQTT');
            mqttClient.end();
        });
        
        mqttClient.on('error', function (error) {
            console.error('Error al conectar al broker MQTT dentro de enviarCompraMqtt:', error);
        });
    }

    static async manejarValidation(req, res) {
        try {
            const { request_id } = req.params;
            console.log('request_id:', request_id);
            console.log('req.body:', req.body);
            const validationData = req.body;
            console.log('validationData:', validationData)
            const infoCompra = await InfoCompras.findOne({ 
                where: { request_id: request_id }
            });
            const vuelo = await Flight.findOne({
                where: { id: infoCompra.flight_id }
            });

            if (!infoCompra) {
                throw new Error('Compra no encontrada');
            }
            if (validationData.valid === true) {
                infoCompra.valid = validationData.valid;
                vuelo.quantity -= infoCompra.quantity;
                infoCompra.isValidated = true;
                await infoCompra.save();
                await vuelo.save();
                console.log('Compra validada');
                res.status(200).json({ message: 'Validación exitosa, compra aprobada' });
            } else if (validationData.valid === false) {
                infoCompra.isValidated = true;
                await infoCompra.save();
                console.log('Compra invalida');
                res.status(200).json({ message: 'Validación no exitosa, compra rechazada' });
            }

            console.log(`Se actualizó el atributo 'valid' de InfoCompras con request_id ${infoCompra.request_id}`);
            
        }
        catch (error) {
            console.error('Error al obtener compras:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }

    static async historialInfoCompras(req, res) {
        try {
            const { userId } = req.params;
            console.log('userId:', userId);
            const infoCompras = await InfoCompras.findAll({
                where: { user_id: userId }
            });
            console.log('infoCompras:', infoCompras);
            res.status(200).json(infoCompras);
        } catch (error) {
            console.error('Error al buscar historial de InfoCompras:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
}


module.exports = InfoComprasController;