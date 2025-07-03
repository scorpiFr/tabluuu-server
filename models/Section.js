// models/Etablissement.js
const { DataTypes } = require("sequelize");
const sequelize = require("./index");

module.exports = (sequelize, DataTypes) => {
  const Section = sequelize.define(
    "section",
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
      nom: {
        type: DataTypes.STRING,
        defaultValue: "",
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
      tableName: "section",
      timestamps: true,
    }
  );

  return Section;
};
