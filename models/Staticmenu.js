// models/Etablissement.js
const { DataTypes } = require("sequelize");
const sequelize = require("./index");

module.exports = (sequelize, DataTypes) => {
  const Staticmenu = sequelize.define(
    "Staticmenu",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      etablissement_id: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      nom: {
        type: DataTypes.STRING,
        defaultValue: "",
      },
      is_active: {
        type: DataTypes.CHAR(1),
        defaultValue: "0",
      },
      position: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
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
      tableName: "static_menu",
      timestamps: true,
    }
  );

  return Staticmenu;
};
