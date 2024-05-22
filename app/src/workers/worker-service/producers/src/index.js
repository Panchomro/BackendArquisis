const { Queue } = require('bullmq');
const express = require('express');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env') });


const app = express();
app.use(express.json());
// console.log("logs producer");
// console.log('REDIS_HOST:', process.env.REDIS_HOST);
// console.log('REDIS_PORT:', process.env.REDIS_PORT);
// console.log('REDIS_PASSWORD:', process.env.REDIS_PASSWORD);

// Crear una instancia de la cola
const queue = new Queue('flightQueue', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
  },
});

// Función para obtener los 20 vuelos
async function fetchFlights(createdAt, arrivalAirportId) {
  try {
    // Realizamos la solicitud HTTP para obtener los vuelos desde el backend
    console.log('arrivalAirportTime:', createdAt);
    console.log('arrivalAirportId:', arrivalAirportId);
    const response = await axios.get(`http://app:${process.env.PORT}/forWorkers`, {
      params: {
        createdAt: createdAt,
        departure_airport_id: arrivalAirportId,
      },
    });
    console.log('Flights for workers:', response.data);

    // Retornamos los vuelos obtenidos desde el backend
    return response.data.flights;
  } catch (error) {
    console.error('Error al obtener los vuelos:', error);
    throw error;
  }
}

// Endpoint para verificar si el servicio está operativo
app.get('/heartbeat', (req, res) => {
  res.json({ status: true });
});

// Endpoint para crear un nuevo trabajo
app.post('/job', async (req, res) => {
  const { user_ip, user_id, flight_id } = req.body;

  try {
    console.log('Creating job for flight:', flight_id);
    const backendUrl = `http://app:${process.env.PORT}/flights/${flight_id}`;
    console.log('URL de la solicitud GET:', backendUrl);
    const flightResponse = await axios.get(`http://app:${process.env.PORT}/flights/${flight_id}`);
    const flightData = flightResponse.data;
    console.log('Flight data:', flightData);
    console.log('Fetching flights for workers...');
    const flightsForWorkers = await fetchFlights(flightData.createdAt, flightData.arrival_airport_id);

    const job = await queue.add('flightJob', {
      user_ip, user_id, flightData, flightsForWorkers,
    });

    res.status(200).json({ jobId: job.id });
  } catch (error) {
    console.error('Error processing job:', error);

    if (error.response) {
      // Error de respuesta HTTP
      res.status(error.response.status).json({ error: error.response.data });
    } else if (error.code === 'ECONNREFUSED') {
      // Error de conexión rechazada
      res.status(500).json({ error: 'Connection refused to backend or Redis server' });
    } else {
      // Otros errores
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Endpoint para obtener el estado de un trabajo
app.get('/job/:id', async (req, res) => {
  const jobId = req.params.id;

  try {
    const job = await queue.getJob(jobId);
    if (job) {
      const state = await job.getState();
      const { progress } = job;
      const result = job.returnvalue;
      res.json({
        id: job.id, state, progress, result,
      });
    } else {
      res.status(404).json({ error: 'Job not found' });
    }
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PRODUCER_PORT || 5000;
app.listen(PORT, () => {
  console.log(`Producer server running on port ${PORT}`);
});
