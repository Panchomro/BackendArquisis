const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('postgres://lukasguthrie:204290482@db:5432/e0arquisis');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  token: {
    type: DataTypes.STRING,
  },
  ammount: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  group_id: {
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
  user_ip: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  timestamps: false,
  tableName: 'Transaction',
});

module.exports = Transaction;
