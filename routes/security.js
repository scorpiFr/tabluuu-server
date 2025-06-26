const express = require("express");
const router = express.Router();
const { sequelize, Etablissement, Session } = require("../models");
const multer = require("multer");
const upload = multer(); // pas de stockage, en mémoire
const crypto = require("crypto");
const { Op } = require("sequelize");
const {
  encryptPassword,
  createSecretKey,
} = require("../Helpers/EtablissementHelper");

function createToken(id, secretKey) {
  const str = id + ":" + secretKey + ":" + Date.now();
  const res = crypto.createHash("md5").update(str).digest("hex");
  return res;
}

// login
router.post("/login", upload.none(), async (req, res) => {
  // verify request
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(404).json({ erreur: "Non trouvé" });

  // get password hash
  const passwordHash = encryptPassword(password);
  try {
    // search etablissement
    const etablissement = await Etablissement.findOne({
      where: {
        [Op.or]: [
          { email_facturation: email, password: passwordHash },
          { email_commandes: email, password: passwordHash },
        ],
      },
    });
    if (!etablissement) {
      return res.status(404).json({ erreur: "Non trouvé" });
    }

    // get new session
    maxTimestamp = Date.now() + 3600 * 2 * 1000;
    const sessionData = {
      token: createToken(etablissement.id, etablissement.secret_key),
      etablissement_id: etablissement.id,
      user_id: 0,
      nom_etablissement: etablissement.nom_etablissement,
      nom: etablissement.nom,
      prenom: etablissement.prenom,
      role: "etablissement",
      max_timestamp: maxTimestamp,
    };
    const created = await Session.create(sessionData);

    // delete old sesson
    await sequelize.query(
      "DELETE FROM `session` WHERE `max_timestamp` < NOW()"
    );

    // return
    return res.status(200).json({ token: created.token, session: created });
  } catch (err) {
    return res.status(500).json(err);
  }
});

// logout
router.get("/logout", upload.none(), async (req, res) => {
  // verify request
  const token = req.get("authorization");
  if (!token) return res.status(400).json({ erreur: "authorization required" });
  // delete session
  try {
    await Session.destroy({
      where: {
        token: token,
      },
    });
    // return
    return res.json({ msg: "ok" });
  } catch (err) {
    return res.status(500).json(err);
  }
});

module.exports = router;
