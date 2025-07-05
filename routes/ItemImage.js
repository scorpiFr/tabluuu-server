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
  getImageResizeRatio,
  resizeImage,
  is_allowedImageExtention,
  deleteFile,
} = require("../Helpers/ImageHelper.js");

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
    const item = await Item.findByPk(req.params.id);
    if (!item) {
      fs.unlink(tempPath, (err) => {});
      return res.status(404).json({ erreur: "Non trouvé" });
    }

    // verify session
    if (!req.Session) {
      fs.unlink(tempPath, (err) => {});
      return res.status(401).json({ erreur: "Bad auth token" });
    }
    if (req.Session.role === "admin");
    else if (
      req.Session.role === "etablissement" &&
      req.Session.etablissement_id == item.etablissement_id
    );
    else {
      fs.unlink(tempPath, (err) => {});
      return res.status(403).json({ erreur: "Forbidden" });
    }

    try {
      // inits
      const relativeTargetDir = item.etablissement_id + "/images";
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

      // delete old images
      if (item.image.length > 0) {
        deleteFile(process.env.UPLOAD_FILE_PATH + "/" + item.image);
        item.image = "";
      }
      if (item.thumbnail.length > 0) {
        deleteFile(process.env.UPLOAD_FILE_PATH + "/" + item.thumbnail);
        item.thumbnail = "";
      }

      // set real image
      const relativeTargetPath = path.join(relativeTargetDir, originalName);
      const absoluteTargetPath = path.join(absoluteTargetDir, originalName);
      resizeImage(tempPath, absoluteTargetPath, 600, 1000);
      item.image = relativeTargetPath;

      // set thumbnail
      const extension = path.extname(originalName); // .jpg
      const filenameWithoutExt = path.basename(originalName, extension);
      const thumbName = filenameWithoutExt + "-thumb" + extension;
      const relativeTargetPathThumb = path.join(relativeTargetDir, thumbName);
      const absoluteTargetPathThumb = path.join(absoluteTargetDir, thumbName);
      resizeImage(tempPath, absoluteTargetPathThumb, 50, 50);
      item.thumbnail = relativeTargetPathThumb;

      // update item
      await item.save();

      // delete image source
      // deleteFile(tempPath);

      // return
      res.status(200).json({ item });
    } catch (err) {
      next(err);
    } finally {
      fs.unlink(tempPath, (err) => {});
    }
  }
);

module.exports = router;
