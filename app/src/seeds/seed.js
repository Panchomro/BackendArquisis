const { Sequelize } = require('sequelize');
const InfoCompras = require('../models/InfoCompras');
require('dotenv').config();

// Crear una instancia de Sequelize
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'mysql', // Cambia esto al dialecto de tu base de datos
});

const seedDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexión a la base de datos exitosa.');

    // Insertar datos de prueba en la tabla InfoCompras
    const seedData = [
      {
        request_id: '1',
        flight_id: '1',
        user_id: 'user1',
        airline_logo: 'https://example.com/logo1.png',
        group_id: '13',
        departure_airport: 'Airport 1',
        arrival_airport: 'Airport 2',
        departure_time: new Date(),
        datetime: new Date(),
        totalPrice: 100,
        quantity: 2,
        seller: 0,
        isValidated: false,
        valid: false,
        user_ip: '127.0.0.1',
        reserved: true,
        available: false,
      },
      {
        request_id: '2',
        flight_id: '2',
        user_id: 'user2',
        airline_logo: 'https://example.com/logo2.png',
        group_id: '13',
        departure_airport: 'Airport 3',
        arrival_airport: 'Airport 4',
        departure_time: new Date(),
        datetime: new Date(),
        totalPrice: 150,
        quantity: 1,
        seller: 0,
        isValidated: false,
        valid: false,
        user_ip: '127.0.0.1',
        reserved: true,
        available: true,
      },
    ];

    await InfoCompras.bulkCreate(seedData);
    console.log('Datos de prueba insertados correctamente.');

  } catch (error) {
    console.error('Error al insertar datos de prueba:', error);
  } finally {
    await sequelize.close();
  }
};

seedDatabase();
