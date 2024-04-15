const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize(`postgres://${DB_USER}:${DB_PASSWORD}@db:${DB_PORT}/${DB_NAME}`);
//const db = require('../db');

const Flight = sequelize.define('Flight', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  departure_airport_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  departure_airport_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  departure_airport_time: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  arrival_airport_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  arrival_airport_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  arrival_airport_time: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  airplane: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  airline: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  airline_logo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  carbon_emissions: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  price: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  currency: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  }
}, {
  timestamps: true,
  tableName: 'infoflights',
});

module.exports = Flight;
