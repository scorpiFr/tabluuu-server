require("dotenv").config();
const express = require("express");
const app = express();
const { sequelize } = require("./models/index");
const testRoutes = require("./routes/test");
const getfileRoutes = require("./routes/getfile");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/test", testRoutes);
app.use("/", getfileRoutes);

// gestion des erreurs
const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

app.listen(process.env.PORT, async () => {
  try {
    await sequelize.authenticate();
    console.log("Connexion à la base réussie ✔️");
  } catch (err) {
    console.error("Échec de connexion à la base ❌", err);
  }
  console.log("Serveur démarré sur http://localhost:" + process.env.PORT);
});
