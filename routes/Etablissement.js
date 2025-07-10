const express = require("express");
const router = express.Router();
const { sequelize, Etablissement, Session } = require("../models");
const {
  removeSecretInformations,
  encryptPassword,
  isStrictDecimal,
  testEmail,
  emailIsValid,
  createSecretKey,
  getRandomPassword,
  getRandomPasswordEncrypted,
} = require("../Helpers/EtablissementHelper.js");
const { sendWelcomeMail } = require("../Helpers/MailHelper.js");

const multer = require("multer");
const upload = multer(); // pas de stockage, en mémoire
const auth = require("../middleware/auth.js");
const { emtyEtablissementCache } = require("../modules/APIEtablissementCache");

// test email
router.get("/testemail", auth, async (req, res, next) => {
  // verif params
  const email = req.query.email;
  if (!email) {
    return res.status(400).json({ error: "Mandatory fields : email" });
  }
  // verify session
  if (!req.Session) {
    return res.status(401).json({ erreur: "Bad auth token" });
  }
  if (req.Session.role === "admin");
  else if (req.Session.role === "commercial");
  else if (req.Session.role === "etablissement");
  else {
    return res.status(403).json({ erreur: "Forbidden" });
  }

  // actions
  const emailExists = await testEmail(email);

  // return
  if (emailExists) {
    res.json({ status: 0, msg: "Email non-disponible" });
  } else {
    res.json({ status: 1, msg: "Email disponible" });
  }
});

// CREATE
router.post("/", auth, async (req, res, next) => {
  // verify inputs
  let {
    email_facturation,
    email_commandes,
    nom_etablissement,
    type,
    nom,
    prenom,
    adresse,
    tel,
    type_contrat,
    prix,
    is_allocated,
  } = req.body;
  let inputErrors = [];
  if (!email_facturation || !emailIsValid(email_facturation)) {
    inputErrors.push("email_facturation");
  }
  if (email_commandes.length > 0 && !emailIsValid(email_commandes)) {
    inputErrors.push("email_commandes");
  }
  if (!nom_etablissement) {
    inputErrors.push("nom_etablissement");
  }
  if (!type || (type != "bar" && type != "kebab" && type != "restaurant")) {
    inputErrors.push("type");
  }
  if (
    !type_contrat ||
    (type_contrat != "image" &&
      type_contrat != "menu" &&
      type_contrat != "commande")
  ) {
    inputErrors.push("type_contrat");
  }
  const prix2 = prix.trim().replace(",", ".");
  if (!prix2 || !isStrictDecimal(prix2)) {
    inputErrors.push("prix");
  }
  if (is_allocated != 0 && is_allocated != 1) {
    is_allocated = "0";
  }
  if (inputErrors.length > 0) {
    return res
      .status(400)
      .json({ error: "Mandatory fields : " + inputErrors.join() });
  }

  // verify if email exists
  const emailExists = await testEmail(email_facturation);
  if (emailExists) {
    res.status(403).json({
      msg: "Email already exists on the system - " + email_facturation,
    });
  }
  if (email_commandes.length > 0) {
    const emailExists2 = await testEmail(email_commandes);
    if (emailExists2) {
      res.status(403).json({
        msg: "Email already exists on the system - " + email_commandes,
      });
    }
  }

  // verify session
  if (!req.Session) {
    return res.status(401).json({ erreur: "Bad auth token" });
  }
  if (req.Session.role === "admin");
  else if (req.Session.role === "commercial");
  else {
    return res.status(403).json({ erreur: "Forbidden" });
  }

  // create
  try {
    const password = getRandomPasswordEncrypted();
    const secret_key = createSecretKey();
    let created = await Etablissement.create({
      email_facturation,
      email_commandes,
      nom_etablissement,
      type,
      nom,
      prenom,
      adresse,
      tel,
      type_contrat,
      prix: prix2,
      is_allocated,
      password,
      secret_key,
    });

    // return
    created = removeSecretInformations(created);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// GET all
router.get("/", auth, async (req, res, next) => {
  // verify session
  if (!req.Session) {
    return res.status(401).json({ erreur: "Bad auth token" });
  }
  if (req.Session.role === "admin");
  else if (req.Session.role === "commercial");
  else {
    return res.status(403).json({ erreur: "Forbidden" });
  }

  // get etablissements
  try {
    let etablissements = await Etablissement.findAll({
      order: [["id", "DESC"]],
    });
    // reduce item data
    etablissements = etablissements.map((etablissement) => {
      return removeSecretInformations(etablissement);
    });
    //return
    return res.json(etablissements);
  } catch (err) {
    next(err);
  }
});

// GET by ID
router.get("/:id(\\d+)", auth, async (req, res, next) => {
  // verify session
  if (!req.Session) {
    return res.status(401).json({ erreur: "Bad auth token" });
  }
  if (req.Session.role === "admin");
  else if (req.Session.role === "commercial");
  else if (
    req.Session.role === "etablissement" &&
    req.Session.etablissement_id == req.params.id
  );
  else {
    return res.status(403).json({ erreur: "Forbidden" });
  }

  // get etablissement
  try {
    const item = await Etablissement.findByPk(req.params.id);
    if (!item) return res.status(404).json({ erreur: "Non trouvé" });

    // reduce item data
    item.dataValues = removeSecretInformations(item.dataValues);

    // return
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// update by ID
router.patch(
  "/updateforcommercials/:id(\\d+)",
  auth,
  async (req, res, next) => {
    // verify session
    if (!req.Session) {
      return res.status(401).json({ erreur: "Bad auth token" });
    }
    if (req.Session.role === "admin");
    else if (req.Session.role === "commercial");
    else {
      return res.status(403).json({ erreur: "Forbidden" });
    }

    // get etablissement
    const etablissement = await Etablissement.findByPk(req.params.id);
    if (!etablissement) return res.status(404).json({ erreur: "Non trouvé" });

    // verify inputs
    let {
      email_facturation,
      email_commandes,
      nom_etablissement,
      type,
      nom,
      prenom,
      adresse,
      tel,
      type_contrat,
      prix,
      is_allocated,
    } = req.body;
    let inputErrors = [];
    if (!email_facturation || !emailIsValid(email_facturation)) {
      inputErrors.push("email_facturation");
    }
    if (email_commandes.length > 0 && !emailIsValid(email_commandes)) {
      inputErrors.push("email_commandes");
    }
    if (!nom_etablissement) {
      inputErrors.push("nom_etablissement");
    }
    if (!type || (type != "bar" && type != "kebab" && type != "restaurant")) {
      inputErrors.push("type");
    }
    if (
      !type_contrat ||
      (type_contrat != "image" &&
        type_contrat != "menu" &&
        type_contrat != "commande")
    ) {
      inputErrors.push("type_contrat");
    }
    const prix2 = prix.trim().replace(",", ".");
    if (!prix2 || !isStrictDecimal(prix2)) {
      inputErrors.push("prix");
    }
    if (is_allocated != 0 && is_allocated != 1) {
      is_allocated = "0";
    }
    if (inputErrors.length > 0) {
      return res
        .status(400)
        .json({ error: "Mandatory fields : " + inputErrors.join() });
    }

    // verify if email exists
    // TODO

    try {
      // update
      etablissement.email_facturation = email_facturation;
      etablissement.email_commandes = email_commandes;
      etablissement.nom_etablissement = nom_etablissement;
      etablissement.type = type;
      etablissement.nom = nom;
      etablissement.prenom = prenom;
      etablissement.adresse = adresse;
      etablissement.tel = tel;
      etablissement.type_contrat = type_contrat;
      etablissement.prix2 = prix2;
      etablissement.is_allocated = is_allocated;
      await etablissement.save();
      // empty cache
      emtyEtablissementCache(etablissement.id);
      // return
      res.status(200).json(etablissement);
    } catch (err) {
      next(err);
    }
  }
);

// update by ID
router.patch(
  "/updateforetablissement/:id(\\d+)",
  auth,
  async (req, res, next) => {
    // verify session
    if (!req.Session) {
      return res.status(401).json({ erreur: "Bad auth token" });
    }
    if (req.Session.role === "admin");
    else if (
      req.Session.role === "etablissement" &&
      req.Session.etablissement_id == req.params.id
    );
    else {
      return res.status(403).json({ erreur: "Forbidden" });
    }

    // verify inputs
    const {
      nom,
      prenom,
      nom_etablissement,
      adresse,
      tel,
      email_facturation,
      email_commandes,
    } = req.body;
    if (!email_commandes) {
      return res
        .status(400)
        .json({ error: "Mandatory field : email_commandes" });
    }

    try {
      // get etablissement
      const etablissement = await Etablissement.findByPk(req.params.id);
      if (!etablissement) {
        return res.status(404).json({ error: "Etablissement non trouvé" });
      }
      // update etablissement
      const updates = {
        nom,
        prenom,
        nom_etablissement,
        adresse,
        tel,
        email_facturation,
        email_commandes,
      };
      await Etablissement.update(updates, {
        where: { id: req.params.id },
      });
      // empty cache
      emtyEtablissementCache(etablissement.id);
      // return
      etablissement.dataValues = removeSecretInformations(
        etablissement.dataValues
      );
      return res.status(200).json({ etablissement });
    } catch (error) {
      console.error("Erreur PATCH user:", error);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }
);

// update password by ID
router.patch("/updatePassword/:id(\\d+)", auth, async (req, res, next) => {
  // verify session
  if (!req.Session) {
    return res.status(401).json({ erreur: "Bad auth token" });
  }
  if (req.Session.role === "admin");
  else if (
    req.Session.role === "etablissement" &&
    req.Session.etablissement_id == req.params.id
  );
  else {
    return res.status(403).json({ erreur: "Forbidden" });
  }

  // verify inputs
  const password = req.body.password;
  if (!password) {
    return res.status(400).json({ error: "Mandatory field : password" });
  }

  try {
    // get etablissement
    const etablissement = await Etablissement.findByPk(req.params.id);
    if (!etablissement) {
      return res.status(404).json({ error: "Etablissement non trouvé" });
    }
    // update etablissement
    const updates = {
      password: encryptPassword(password),
    };
    await Etablissement.update(updates, {
      where: { id: req.params.id },
    });

    // return
    return res.status(200).json({ msg: "ok" });
  } catch (error) {
    console.error("Erreur PATCH user:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

// welcome
router.get("/welcome/:id(\\d+)", auth, async (req, res, next) => {
  // verify session
  if (!req.Session) {
    return res.status(401).json({ erreur: "Bad auth token" });
  }
  if (req.Session.role === "admin");
  else if (req.Session.role === "commercial");
  else {
    return res.status(403).json({ erreur: "Forbidden" });
  }

  try {
    // get etablissement
    const etablissement = await Etablissement.findByPk(req.params.id);
    if (!etablissement) {
      return res.status(404).json({ error: "Etablissement non trouvé" });
    }

    // get new password
    const password = getRandomPassword();

    // update etablissement
    const updates = {
      password: encryptPassword(password),
    };
    await Etablissement.update(updates, {
      where: { id: etablissement.id },
    });

    // send welcome mail
    sendWelcomeMail(etablissement, password);

    // return
    return res.status(200).json({ msg: "ok" });
  } catch (error) {
    console.error("Erreur PATCH user:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

// sudo
router.get("/sudo/:id(\\d+)", auth, async (req, res, next) => {
  // verify session
  if (!req.Session) {
    return res.status(401).json({ erreur: "Bad auth token" });
  }
  if (req.Session.role === "admin");
  else if (req.Session.role === "commercial");
  else {
    return res.status(403).json({ erreur: "Forbidden" });
  }

  try {
    // get etablissement
    const etablissement = await Etablissement.findByPk(req.params.id);
    if (!etablissement) {
      return res.status(404).json({ error: "Etablissement non trouvé" });
    }

    // modif session
    req.Session.etablissement_id = etablissement.id;
    req.Session.user_id = 0;
    req.Session.nom_etablissement = etablissement.nom_etablissement;
    req.Session.nom = etablissement.nom;
    req.Session.prenom = etablissement.prenom;
    req.Session.role = "etablissement";
    await req.Session.save();

    // return
    return res.status(200).json(req.Session);
  } catch (error) {
    console.error("Erreur PATCH user:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;
