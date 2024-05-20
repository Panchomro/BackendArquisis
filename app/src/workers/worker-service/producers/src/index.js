const { Queue } = require('bullmq');
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

// Crear una instancia de la cola
const queue = new Queue('flightQueue', {
  connection: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
  }
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

app.post('/produce', async (req, res) => {
  const { user_ip, flight_id } = req.body;

  try {
    // Obtener la información del vuelo desde tu backend
    const flightResponse = await axios.get(`${process.env.BACKEND_URL}/flights/${flight_id}`);
    const flightData = flightResponse.data;

    // Obtener los 20 vuelos
    const flightsForWorkers = await fetchFlights(flightData.departure_airport_time, flightData.departure_airport_id);

    // Crear un trabajo con los vuelos y agregarlo a la cola
    await queue.add('flightJob', { user_ip, flightData, flightsForWorkers });

    res.status(200).json({ message: 'Job added to the queue' });
  } catch (error) {
    console.error('Error fetching flight data or adding job to the queue:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(process.env.PRODUCER_PORT || 3001, () => {
  console.log(`Producer server running on port ${process.env.PRODUCER_PORT || 3001}`);
});
