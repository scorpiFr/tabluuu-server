// models/Etablissement.js
const { DataTypes } = require("sequelize");
const sequelize = require("./index");

module.exports = (sequelize, DataTypes) => {
  const Session = sequelize.define(
    "session",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      etablissement_id: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      user_id: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      nom_etablissement: {
        type: DataTypes.STRING,
        defaultValue: "",
      },
      nom: {
        type: DataTypes.STRING,
        defaultValue: "",
      },
      prenom: {
        type: DataTypes.STRING,
        defaultValue: "",
      },
      role: {
        type: DataTypes.STRING,
        defaultValue: "etablissement",
      },
      max_timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "session",
      timestamps: true,
    }
  );

  return Session;
};
