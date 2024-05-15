require('dotenv').config();
const cors = require('cors');
const express = require('express');
const checkJwt = require('./middlewares/auth');

const flightRoutes = require('./routes/flightRoutes');
const infoComprasRoutes = require('./routes/infoComprasRoutes');

const Flight = require('./models/Flight');
const InfoCompras = require('./models/InfoCompras');

const app = express();

const { PORT } = process.env;

// Middleware
app.use(express.json());
app.use(cors());

app.use('/', flightRoutes);
app.use('/', infoComprasRoutes);
app.use(express.urlencoded({ extended: false }));
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
      console.error('Error de autorización:', err);
      res.status(401).send('Token inválido');
  } else {
      next(err);
  }
});

app.use((req, res, next) => {
  console.log('Token decodificado:', req.user);
  next();
});

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
