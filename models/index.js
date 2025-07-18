// models/index.js
require("dotenv").config();
const Sequelize = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
  }
);

// const Test = require("./Test")(sequelize, Sequelize.DataTypes);
const Etablissement = require("./Etablissement")(
  sequelize,
  Sequelize.DataTypes
);
const Session = require("./Session")(sequelize, Sequelize.DataTypes);
const Dynamicmenu = require("./Dynamicmenu")(sequelize, Sequelize.DataTypes);
const Section = require("./Section")(sequelize, Sequelize.DataTypes);
const Item = require("./Item")(sequelize, Sequelize.DataTypes);
const Staticmenu = require("./Staticmenu")(sequelize, Sequelize.DataTypes);
const StaticItem = require("./StaticItem")(sequelize, Sequelize.DataTypes);
const User = require("./User")(sequelize, Sequelize.DataTypes);
const Bill = require("./Bill")(sequelize, Sequelize.DataTypes);

module.exports = {
  sequelize,
  // Test,
  Etablissement,
  Session,
  Dynamicmenu,
  Section,
  Item,
  Staticmenu,
  StaticItem,
  User,
  Bill,
};
