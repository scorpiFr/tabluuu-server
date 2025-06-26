// models/Etablissement.js
const { DataTypes } = require("sequelize");
const sequelize = require("./index");

module.exports = (sequelize, DataTypes) => {
  const Etablissement = sequelize.define(
    "Etablissement",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      email_facturation: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      email_commandes: {
        type: DataTypes.STRING,
        defaultValue: "",
      },
      nom_etablissement: {
        type: DataTypes.STRING,
        defaultValue: "",
      },
      type: {
        type: DataTypes.STRING,
        defaultValue: "bar",
      },
      nom: {
        type: DataTypes.STRING,
        defaultValue: "",
      },
      prenom: {
        type: DataTypes.STRING,
        defaultValue: "",
      },
      adresse: {
        type: DataTypes.STRING,
        defaultValue: "",
      },
      tel: {
        type: DataTypes.STRING,
        defaultValue: "",
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      secret_key: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type_contrat: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "commande",
      },
      prix: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
      },
      is_allocated: {
        type: DataTypes.CHAR(1),
        defaultValue: "0",
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
      tableName: "etablissement", // <- optionnel, tu peux préciser explicitement
      timestamps: true,
    }
  );

  return Etablissement;
};
