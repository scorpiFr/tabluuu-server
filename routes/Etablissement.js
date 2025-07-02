const express = require("express");
const router = express.Router();
const { Etablissement } = require("../models");
const {
  removeSecretInformations,
  encryptPassword,
} = require("../Helpers/EtablissementHelper.js");

const multer = require("multer");
const upload = multer(); // pas de stockage, en mémoire
const auth = require("../middleware/auth.js");

// GET by ID
router.get("/:id(\\d+)", auth, async (req, res, next) => {
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

// update by ID
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

module.exports = router;
