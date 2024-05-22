require('dotenv').config();
const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const checkJwt = require('./middlewares/auth');

const flightRoutes = require('./routes/flightRoutes');
const infoComprasRoutes = require('./routes/infoComprasRoutes');
const WebpayController = require('./controllers/webpayController'); // Asegúrate de importar esto


const Flight = require('./models/Flight');
const InfoCompras = require('./models/InfoCompras');

const app = express();

const { PORT } = process.env;

// Middleware
app.use(express.json());
app.use(cors());
//agregue esto
app.use(bodyParser.urlencoded({ extended: true })); 

app.use('/', flightRoutes);
app.use('/', infoComprasRoutes);
//app.use(express.urlencoded({ extended: false }));

//y agrego esto
app.post('/confirm-transaction/:flightId/:userId/:quantity/:ip', WebpayController.confirmTransaction);


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
