require('dotenv').config();
const cors = require('cors');
const express = require('express');
// const checkJwt = require('./middlewares/auth');

const flightRoutes = require('./routes/flightRoutes');
const infoComprasRoutes = require('./routes/infoComprasRoutes');
const recommendationsRoutes = require('./routes/recommendationsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const offerRoutes = require('./routes/offerRoutes');

const Flight = require('./models/Flight');
const InfoCompras = require('./models/InfoCompras');
const Recommendations = require('./models/Recommendations');
const Offers = require('./models/Offers');

const app = express();

const { PORT } = process.env;

// Middleware
app.use(express.json());
app.use(cors());

app.use('/', flightRoutes);
app.use('/', infoComprasRoutes);
app.use('/', recommendationsRoutes);
app.use('/', adminRoutes);
app.use('/', offerRoutes);
app.use(express.urlencoded({ extended: false }));


async function syncDatabase() {
  try {
    await Flight.sync({ force: false });
    await InfoCompras.sync({ force: false });
    await Recommendations.sync({ force: false });
    await Offers.sync({ force: false });
    console.log('Modelo sincronizado con la base de datos');
  } catch (error) {
    console.error('Error al sincronizar el modelo con la base de datos:', error);
  }
}

syncDatabase();

app.get('/', (req, res) => {
  res.send('Bienvenido a la API de vuelos 2');
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor Express corriendo en http://localhost:${PORT}`);
});
