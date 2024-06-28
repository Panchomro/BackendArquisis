const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('postgres://lukasguthrie:204290482@db:5432/e0arquisis');

const Offers = sequelize.define('Offers', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  auction_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  proposal_id: {
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
  airline: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  group_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  flight_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  isFinished: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  timestamps: false,
  tableName: 'Offers',
});

module.exports = Offers;