const express = require("express");
const router = express.Router();
const { Etablissement } = require("../models");
const multer = require("multer");
const upload = multer(); // pas de stockage, en mémoire
const auth = require("../middleware/auth.js");

// GET by ID
router.get("/:id(\\d+)", auth, async (req, res, next) => {
  // verify session
  if (!req.Session) {
    return res.status(401).json({ erreur: "Bad auth token" });
  }
  console.log(req.Session.role, req.Session.etablissement_id, req.params.id);

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
    item.dataValues.password = "";
    item.dataValues.secret_key = "";

    // return
    res.json(item);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
