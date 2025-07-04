require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const { sequelize } = require("./models/index");
const testRoutes = require("./routes/test");
const getfileRoutes = require("./routes/getfile");
const sendmailRoutes = require("./routes/sendmail");
const securityRoutes = require("./routes/security");
const EtablissementRoutes = require("./routes/Etablissement");
const DynamicmenuRoutes = require("./routes/Dynamicmenu");
const SectionRoutes = require("./routes/Section");
const ItemRoutes = require("./routes/Item");
const ItemImageRoutes = require("./routes/ItemImage");

app.use(cors()); // Autorise toutes les origines des requetes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/test", testRoutes);
app.use("/", getfileRoutes);
app.use("/", sendmailRoutes);
app.use("/admin/", securityRoutes);
app.use("/admin/etablissement", EtablissementRoutes);
app.use("/admin/dynamicmenu", DynamicmenuRoutes);
app.use("/admin/section", SectionRoutes);
app.use("/admin/item", ItemRoutes);
app.use("/admin/item", ItemImageRoutes);

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
