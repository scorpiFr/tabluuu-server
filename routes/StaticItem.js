require("dotenv").config();
const express = require("express");
const router = express.Router();
const { sequelize, Staticmenu, StaticItem } = require("../models");
const { Op } = require("sequelize");
const multer = require("multer");
const upload = multer(); // pas de stockage, en mémoire

const auth = require("../middleware/auth.js");
const { deleteFile } = require("../Helpers/ImageHelper.js");

// LIST
router.get(
  "/listbystaticmenuid/:staticmenuid(\\d+)",
  auth,
  async (req, res, next) => {
    // get section
    const menu = await Staticmenu.findByPk(req.params.staticmenuid);
    if (!menu) return res.status(404).json({ erreur: "Non trouvé" });

    // verify session
    if (!req.Session) {
      return res.status(401).json({ erreur: "Bad auth token" });
    }
    if (req.Session.role === "admin");
    else if (
      req.Session.role === "etablissement" &&
      req.Session.etablissement_id == menu.etablissement_id
    );
    else {
      return res.status(403).json({ erreur: "Forbidden" });
    }

    // search
    try {
      const items = await StaticItem.findAll({
        where: { static_menu_id: menu.id },
        order: [["position", "ASC"]],
      });
      res.status(200).json(items);
    } catch (err) {
      next(err);
    }
  }
);

// Update position up
router.patch("/moveup/:id(\\d+)", auth, async (req, res, next) => {
  // get item
  const item = await StaticItem.findByPk(req.params.id);
  if (!item) return res.status(404).json({ erreur: "Non trouvé" });

  // verify session
  if (!req.Session) {
    return res.status(401).json({ erreur: "Bad auth token" });
  }
  if (req.Session.role === "admin");
  else if (
    req.Session.role === "etablissement" &&
    req.Session.etablissement_id == item.etablissement_id
  );
  else {
    return res.status(403).json({ erreur: "Forbidden" });
  }

  try {
    // search next item
    const nextItem = await StaticItem.findOne({
      where: {
        static_menu_id: item.static_menu_id,
        position: {
          [Op.gt]: item.position, // superior
        },
      },
      order: [["position", "ASC"]], // plus proche valeur inférieure
    });
    // switch
    if (nextItem) {
      const switchVar = item.position;
      item.position = nextItem.position;
      nextItem.position = switchVar;
      await item.save();
      await nextItem.save();
    }
    // return
    res.status(200).json([item, nextItem]);
  } catch (err) {
    next(err);
  }
});

// Update position down
router.patch("/movedown/:id(\\d+)", auth, async (req, res, next) => {
  // get item
  const item = await StaticItem.findByPk(req.params.id);
  if (!item) return res.status(404).json({ erreur: "Non trouvé" });

  // verify session
  if (!req.Session) {
    return res.status(401).json({ erreur: "Bad auth token" });
  }
  if (req.Session.role === "admin");
  else if (
    req.Session.role === "etablissement" &&
    req.Session.etablissement_id == item.etablissement_id
  );
  else {
    return res.status(403).json({ erreur: "Forbidden" });
  }

  try {
    // search previous menu
    const previousItem = await StaticItem.findOne({
      where: {
        static_menu_id: item.static_menu_id,
        position: {
          [Op.lt]: item.position, // inferior
        },
      },
      order: [["position", "DESC"]], // plus proche valeur inférieure
    });
    // switch
    if (previousItem) {
      const switchVar = item.position;
      item.position = previousItem.position;
      previousItem.position = switchVar;
      await item.save();
      await previousItem.save();
    }
    // return
    res.status(200).json([item, previousItem]);
  } catch (err) {
    next(err);
  }
});

// DELETE
router.delete("/:id(\\d+)", auth, async (req, res, next) => {
  // get item
  const item = await StaticItem.findByPk(req.params.id);
  if (!item) return res.status(404).json({ erreur: "Non trouvé" });

  // verify session
  if (!req.Session) {
    return res.status(401).json({ erreur: "Bad auth token" });
  }
  if (req.Session.role === "admin");
  else if (
    req.Session.role === "etablissement" &&
    req.Session.etablissement_id == item.etablissement_id
  );
  else {
    return res.status(403).json({ erreur: "Forbidden" });
  }

  try {
    // delete image
    if (item.image.length > 0) {
      deleteFile(process.env.UPLOAD_FILE_PATH + "/" + item.image);
      item.image = "";
    }
    // delete thumbnail
    if (item.thumbnail.length > 0) {
      deleteFile(process.env.UPLOAD_FILE_PATH + "/" + item.thumbnail);
      item.thumbnail = "";
    }

    // delete
    await item.destroy();
    // return
    res.status(200).json({ msg: "ok" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
