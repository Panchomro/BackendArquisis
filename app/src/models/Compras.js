const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('postgres://panchomro:Arya1234@db:5432/e0arquisis');


const InfoCompras = sequelize.define('InfoCompras', {
    request_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
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
        type: DataTypes.DATE,
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
    valid: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
    }
}, {
    timestamps: false,
    tableName: 'InfoCompras'
});

module.exports = InfoCompras;
