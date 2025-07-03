// models/Etablissement.js
const { DataTypes } = require("sequelize");
const sequelize = require("./index");

module.exports = (sequelize, DataTypes) => {
  const Item = sequelize.define(
    "item",
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
      dynamic_menu_id: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      section_id: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      nom: {
        type: DataTypes.STRING,
        defaultValue: "",
      },
      description: {
        type: DataTypes.STRING,
        defaultValue: "",
      },
      prix: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
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
      tableName: "item",
      timestamps: true,
    }
  );

  return Item;
};
