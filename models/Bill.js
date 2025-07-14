// models/Etablissement.js
const { DataTypes } = require("sequelize");
const sequelize = require("./index");

module.exports = (sequelize, DataTypes) => {
  const Bill = sequelize.define(
    "Bill",
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
      status: {
        type: DataTypes.STRING,
        defaultValue: "pending",
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      filepath: {
        type: DataTypes.STRING,
        defaultValue: "",
      },
      date_payment: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      max_date_payment: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      month: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      year: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      month_amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      qr_board_quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      qr_board_unit_price: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      menu_edit_amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      paypal_order_id: {
        type: DataTypes.STRING,
        defaultValue: "",
      },
      paypal_approve_link: {
        type: DataTypes.STRING,
        defaultValue: "",
      },
      paypal_payment_id: {
        type: DataTypes.STRING,
        defaultValue: "",
      },
      paypal_payer_id: {
        type: DataTypes.STRING,
        defaultValue: "",
      },
      paypal_payer_email: {
        type: DataTypes.STRING,
        defaultValue: "",
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
      tableName: "bill", // <- optionnel, tu peux préciser explicitement
      timestamps: true,
    }
  );

  return Bill;
};
