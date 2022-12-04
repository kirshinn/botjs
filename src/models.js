const sequilize = require('./db');
const {DataTypes} = require('sequelize');

const User = sequilize.define('user', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, unique: true},
    username: {type: DataTypes.STRING, unique: true},
    lastName: {type: DataTypes.STRING},
    firstName: {type: DataTypes.STRING},
    chatId: {type: DataTypes.BIGINT, unique: true},
    languageCode: {type: DataTypes.STRING},
    right: {type: DataTypes.INTEGER, defaultValue: 0},
    wrong: {type: DataTypes.INTEGER, defaultValue: 0},
});

module.exports = User;