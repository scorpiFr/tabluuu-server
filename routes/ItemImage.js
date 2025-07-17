const { sequelize, Item } = require("../models");
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
  removeImageOnItem,
  addImageOnItem,
} = require("../Helpers/ImageHelper.js");
const { getNowTimestamp } = require("../Helpers/BillHelper.js");
const { emtyEtablissementCache } = require("../modules/APIEtablissementCache");

// Update image
// must send data as form-data
router.patch(
  "/setimage/:id(\\d+)",
  auth,
  upload.single("image"),
  async (req, res, next) => {
    // verify inputs
    if (!req.file) {
      return res.status(400).json({ erreur: "No image received" });
    }
    const tempPath = req.file.path;

    // get item
    const originalItem = await Item.findByPk(req.params.id);
    if (!originalItem) {
      fs.unlink(tempPath, (err) => {});
      return res.status(404).json({ erreur: "Non trouvé" });
    }

    // verify session
    if (!req.Session) {
      fs.unlink(tempPath, (err) => {});
      return res.status(401).json({ erreur: "Bad auth token" });
    }
    if (req.Session.role === "admin");
    else if (req.Session.role === "commercial");
    else if (
      req.Session.role === "etablissement" &&
      req.Session.etablissement_id == originalItem.etablissement_id
    );
    else {
      fs.unlink(tempPath, (err) => {});
      return res.status(403).json({ erreur: "Forbidden" });
    }

    try {
      // delete old images
      const tmpItem = await removeImageOnItem(originalItem);
      // add image
      const originalName = req.file.originalname;
      const { item, httpCode, errorMsg } = await addImageOnItem(
        tempPath,
        tmpItem,
        getNowTimestamp() + "-" + originalName
      );
      // empty cache
      emtyEtablissementCache(item.etablissement_id);
      // return
      res.status(200).json(item);
    } catch (err) {
      next(err);
    } finally {
      fs.unlink(tempPath, (err) => {});
    }
  }
);

module.exports = router;
