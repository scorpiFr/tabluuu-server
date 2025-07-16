const { sequelize, Staticmenu, StaticItem } = require("../models");
const { Op } = require("sequelize");
const express = require("express");
const router = express.Router();
require("dotenv").config();
const multer = require("multer");
const auth = require("../middleware/auth.js");
const path = require("path");
const fs = require("fs");
const upload = multer({ dest: "temp_uploads/" });
const {
  getImageResizeRatio,
  resizeImage,
  is_allowedImageExtention,
  deleteFile,
  addImageOnStaticItem,
} = require("../Helpers/ImageHelper.js");
const { emtyEtablissementCache } = require("../modules/APIEtablissementCache");

async function getMaxPosition(staticMenuId) {
  try {
    const [results, metadata] = await sequelize.query(
      "SELECT MAX(position) AS maxposition FROM static_item WHERE static_menu_id = :staticmenuid",
      {
        replacements: { staticmenuid: staticMenuId },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    // results sera un tableau d'objets, ex : [{ position: 5 }]
    return [results.maxposition, null];
  } catch (error) {
    console.error("Erreur dans getMaxPosition:", error);
    return [0, error];
  }
}

// CREATE
router.post("/", auth, upload.single("image"), async (req, res, next) => {
  // veify image existance
  if (!req.file) {
    inputErrors.push("image");
    return res.status(400).json({ error: "Mandatory fields : image" });
  }
  const tempPath = req.file.path;

  // verify inputs
  let { static_menu_id } = req.body;
  let inputErrors = [];
  if (!static_menu_id) {
    inputErrors.push("static_menu_id");
  }
  if (inputErrors.length > 0) {
    fs.unlink(tempPath, (err) => {});
    return res
      .status(400)
      .json({ error: "Mandatory fields : " + inputErrors.join() });
  }

  // get menu
  const menu = await Staticmenu.findByPk(static_menu_id);
  if (!menu) return res.status(404).json({ erreur: "Non trouvé" });

  // verify session
  if (!req.Session) {
    fs.unlink(tempPath, (err) => {});
    return res.status(401).json({ erreur: "Bad auth token" });
  }
  if (req.Session.role === "admin");
  else if (
    req.Session.role === "etablissement" &&
    req.Session.etablissement_id == menu.etablissement_id
  );
  else {
    fs.unlink(tempPath, (err) => {});
    return res.status(403).json({ erreur: "Forbidden" });
  }

  // count max position
  const [maxPosition, error2] = await getMaxPosition(menu.id);
  if (error2) {
    fs.unlink(tempPath, (err) => {});
    return res.status(500).json({ erreur: error2 });
  }
  const position = maxPosition > 0 ? maxPosition + 10 : 10;

  try {
    // create item
    const created = await StaticItem.create({
      etablissement_id: menu.etablissement_id,
      static_menu_id: menu.id,
      position,
    });
    // empty cache
    emtyEtablissementCache(menu.etablissement_id);

    // add image
    const originalName = req.file.originalname;
    const { httpCode, errorMsg } = await addImageOnStaticItem(
      tempPath,
      created,
      originalName
    );
    if (httpCode !== 200) {
      fs.unlink(tempPath, (err) => {});
      return res.status(httpCode).json({
        error: errorMsg,
      });
    }
    // empty cache
    emtyEtablissementCache(menu.etablissement_id);

    // return
    res.status(201).json(created);
  } catch (err) {
    next(err);
  } finally {
    fs.unlink(tempPath, (err) => {});
  }
});

module.exports = router;
