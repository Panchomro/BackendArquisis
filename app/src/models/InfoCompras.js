const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('postgres://srasmussenc:8850casan@db:5432/e0arquisis');

const InfoCompras = sequelize.define('InfoCompras', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  request_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  airline_logo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  flight_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  group_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  departure_airport: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  arrival_airport: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  departure_time: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  datetime: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  deposit_token: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  seller: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  isValidated: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
  valid: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
  totalPrice: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  airline:{
    type: DataTypes.STRING,
    allowNull: false,
  },
  user_ip: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  reserved: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  available: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  timestamps: false,
  tableName: 'InfoCompras',
});

module.exports = InfoCompras;
