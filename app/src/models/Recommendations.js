const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('postgres://panchomro:Arya1234@db:5432/e0arquisis');

const Recommendation = sequelize.define('Recommendation', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  user_ip: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  recommendations: {
    type: DataTypes.JSON,
    allowNull: false,
  },
}, {
  timestamps: true,
  tableName: 'recommendations',
});

module.exports = Recommendation;
