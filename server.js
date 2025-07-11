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
const FrontRoutes = require("./routes/EtablissementFrontData");
const StaticmenuRoutes = require("./routes/Staticmenu");
const StaticItemRoutes = require("./routes/StaticItem");
const StaticItemImageRoutes = require("./routes/StaticItemImage");
const BillRoutes = require("./routes/Bill");

// cors
const allowedOrigins = ["https://www.tabluuu.fr", "https://admin.tabluuu.fr"];
app.use(
  cors({
    origin: function (origin, callback) {
      // Autoriser les requêtes sans origin (ex: curl, Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/etablissementfrontdata", FrontRoutes);
app.use("/test", testRoutes);
app.use("/", sendmailRoutes);
app.use("/", getfileRoutes);
app.use("/admin/", securityRoutes);
app.use("/admin/etablissement", EtablissementRoutes);
app.use("/admin/dynamicmenu", DynamicmenuRoutes);
app.use("/admin/section", SectionRoutes);
app.use("/admin/item", ItemRoutes);
app.use("/admin/item", ItemImageRoutes);
app.use("/admin/staticmenu", StaticmenuRoutes);
app.use("/admin/staticitem", StaticItemRoutes);
app.use("/admin/staticitem", StaticItemImageRoutes);
app.use("/admin/bill", BillRoutes);

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
