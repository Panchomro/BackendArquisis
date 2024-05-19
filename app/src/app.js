require('dotenv').config();
const cors = require('cors');
const express = require('express');
const checkJwt = require('./middlewares/auth');

const flightRoutes = require('./routes/flightRoutes');
const infoComprasRoutes = require('./routes/infoComprasRoutes');
const webpayRoutes = require('./routes/webpayRoutes');

const Flight = require('./models/Flight');
const InfoCompras = require('./models/InfoCompras');

const app = express();

const { PORT } = process.env;

// Middleware
app.use(express.json());
app.use(cors());

app.use('/', flightRoutes);
app.use('/', infoComprasRoutes);
app.use('/', webpayRoutes);z
// app.use('/', paymentRoutes);
app.use(express.urlencoded({ extended: false }));

async function syncDatabase() {
  try {
    await Flight.sync({ force: false });
    await InfoCompras.sync({ force: false });
    console.log('Modelo sincronizado con la base de datos');
  } catch (error) {
    console.error('Error al sincronizar el modelo con la base de datos:', error);
  }
}

syncDatabase();

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor Express corriendo en http://localhost:${PORT}`);
});
