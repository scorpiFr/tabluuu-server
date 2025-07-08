const express = require("express");
const router = express.Router();
const { sequelize, Etablissement, User, Session } = require("../models");
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

async function getSessionFromEtablissement(email, passwordHash) {
  maxTimestamp = Date.now() + 3600 * 2 * 1000;
  const etablissement = await Etablissement.findOne({
    where: {
      [Op.or]: [
        { email_facturation: email, password: passwordHash },
        { email_commandes: email, password: passwordHash },
      ],
    },
  });
  if (!etablissement) {
    return null;
  }
  // get new session
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
  created = await Session.create(sessionData);
  // return
  return created;
}

async function getSessionFromUser(email, passwordHash) {
  maxTimestamp = Date.now() + 3600 * 2 * 1000;
  const user = await User.findOne({
    where: { email: email, password: passwordHash },
  });
  if (!user) {
    return null;
  }
  // get new session
  const sessionData = {
    token: createToken(user.id, user.secret_key),
    etablissement_id: 0,
    user_id: user.id,
    nom_etablissement: "",
    nom: "",
    prenom: "",
    role: user.role,
    max_timestamp: maxTimestamp,
  };
  created = await Session.create(sessionData);
  // return
  return created;
}

// login
router.post("/login", upload.none(), async (req, res) => {
  // verify request
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(404).json({ erreur: "Non trouvé" });
  }
  // get password hash
  const passwordHash = encryptPassword(password);

  try {
    // search from etablissement
    let session = await getSessionFromEtablissement(email, passwordHash);
    // search from user
    if (!session) {
      session = await getSessionFromUser(email, passwordHash);
    }
    if (!session) {
      return res.status(404).json({ erreur: "Non trouvé" });
    }
    // delete old sesson
    sequelize.query("DELETE FROM `session` WHERE `max_timestamp` < NOW()");

    // return
    return res.status(200).json({ token: session.token, session: session });
  } catch (err) {
    return res.status(500).json(err);
  }
});

// logout
router.get("/logout", upload.none(), async (req, res) => {
  // verify request
  const token = req.get("authorization");
  if (!token) return res.json({ msg: "ok" });
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
