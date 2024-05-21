const { Queue } = require('bullmq');
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

// Crear una instancia de la cola
const queue = new Queue('flightQueue', {
  connection: {
    host: process.env.REDIS_HOST || '3002',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
  },
});

// Función para obtener los 20 vuelos
async function fetchFlights(departureAirportTime, departureAirportId) {
  try {
    // Realizamos la solicitud HTTP para obtener los vuelos desde el backend
    const response = await axios.get(`${process.env.BACKEND_URL}/flights/forWorkers`, {
      params: {
        departure_airport_time: departureAirportTime,
        departure_airport_id: departureAirportId,
      },
    });

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
    // Obtener la información del vuelo desde tu backend
    const flightResponse = await axios.get(`${process.env.BACKEND_URL}/flights/${flight_id}`);
    const flightData = flightResponse.data;

    // Obtener los 20 vuelos
    const flightsForWorkers = await fetchFlights(flightData.departure_airport_time, flightData.departure_airport_id);

    // Crear un trabajo con los vuelos y agregarlo a la cola
    const job = await queue.add('flightJob', {
      user_ip, user_id, flightData, flightsForWorkers,
    });

    res.status(200).json({ jobId: job.id });
  } catch (error) {
    console.error('Error fetching flight data or adding job to the queue:', error);
    res.status(500).json({ error: 'Internal server error' });
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

const PORT = process.env.PRODUCER_PORT || 3001;
app.listen(PORT, () => {
  console.log(`Producer server running on port ${PORT}`);
});
