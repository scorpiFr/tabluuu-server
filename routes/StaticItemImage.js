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
} = require("../Helpers/ImageHelper.js");

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
    // inits
    const relativeTargetDir = menu.etablissement_id + "/images";
    const absoluteTargetDir = path.join(
      process.env.UPLOAD_FILE_PATH + "/" + relativeTargetDir
    );

    // verify extention
    const originalName = req.file.originalname;
    if (originalName.length > 200) {
      fs.unlink(tempPath, (err) => {});
      return res.status(400).json({
        error: "Filename too long (200 char max) : " + originalName,
      });
    }
    if (!is_allowedImageExtention(tempPath, originalName)) {
      fs.unlink(tempPath, (err) => {});
      return res.status(400).json({ error: "Forbidden mimetype" });
    }

    // create dir if not exists
    if (!fs.existsSync(absoluteTargetDir)) {
      fs.mkdirSync(absoluteTargetDir, { recursive: true });
    }

    // set real image
    const relativeTargetPath = path.join(relativeTargetDir, originalName);
    const absoluteTargetPath = path.join(absoluteTargetDir, originalName);
    resizeImage(tempPath, absoluteTargetPath, 600, 1000);
    const image = relativeTargetPath;

    // set thumbnail
    const extension = path.extname(originalName); // .jpg
    const filenameWithoutExt = path.basename(originalName, extension);
    const thumbName = filenameWithoutExt + "-thumb" + extension;
    const relativeTargetPathThumb = path.join(relativeTargetDir, thumbName);
    const absoluteTargetPathThumb = path.join(absoluteTargetDir, thumbName);
    resizeImage(tempPath, absoluteTargetPathThumb, 100, 100);
    const thumbnail = relativeTargetPathThumb;

    // create
    const created = await StaticItem.create({
      etablissement_id: menu.etablissement_id,
      static_menu_id: menu.id,
      position,
      image,
      thumbnail,
    });

    res.status(201).json(created);
  } catch (err) {
    next(err);
  } finally {
    fs.unlink(tempPath, (err) => {});
  }
});

module.exports = router;
