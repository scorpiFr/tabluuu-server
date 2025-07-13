require("dotenv").config();
const express = require("express");
const router = express.Router();
const { sequelize, Section, Item } = require("../models");
const { Op } = require("sequelize");
const multer = require("multer");
const upload = multer(); // pas de stockage, en mémoire

const auth = require("../middleware/auth.js");
const { deleteFile } = require("../Helpers/ImageHelper.js");
const { emtyEtablissementCache } = require("../modules/APIEtablissementCache");

async function getMaxPosition(sectionId) {
  try {
    const [results, metadata] = await sequelize.query(
      "SELECT MAX(position) AS maxposition FROM item WHERE section_id = :sectionid",
      {
        replacements: { sectionid: sectionId },
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

function isStrictDecimal(str) {
  return /^(-?\d+(\.\d+)?|-?\.\d+)$/.test(str);
}

// LIST
router.get(
  "/listbysectionid/:sectionid(\\d+)",
  auth,
  async (req, res, next) => {
    // get section
    const section = await Section.findByPk(req.params.sectionid);
    if (!section) return res.status(404).json({ erreur: "Non trouvé" });

    // verify session
    if (!req.Session) {
      return res.status(401).json({ erreur: "Bad auth token" });
    }
    if (req.Session.role === "admin");
    else if (
      req.Session.role === "etablissement" &&
      req.Session.etablissement_id == section.etablissement_id
    );
    else {
      return res.status(403).json({ erreur: "Forbidden" });
    }

    // search
    try {
      const items = await Item.findAll({
        where: { section_id: section.id },
        order: [["position", "ASC"]],
      });
      res.status(200).json(items);
    } catch (err) {
      next(err);
    }
  }
);

// Update name
router.patch("/partialupdate/:id(\\d+)", auth, async (req, res, next) => {
  // get item
  const item = await Item.findByPk(req.params.id);
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

  // verify inputs
  const { nom, prix, description } = req.body;
  let inputErrors = [];
  if (!nom) {
    inputErrors.push("nom");
  }
  const prix2 = prix.trim().replace(",", ".");
  if (!prix2 || !isStrictDecimal(prix2)) {
    inputErrors.push("prix");
  }
  if (inputErrors.length > 0) {
    return res
      .status(400)
      .json({ error: "Mandatory fields : " + inputErrors.join() });
  }

  try {
    // update
    item.nom = nom;
    item.prix = prix2;
    item.description = description;
    await item.save();
    // empty cache
    emtyEtablissementCache(item.etablissement_id);
    // return
    res.status(200).json({ msg: "ok" });
  } catch (err) {
    next(err);
  }
});

// Update position up
router.patch("/moveup/:id(\\d+)", auth, async (req, res, next) => {
  // get item
  const item = await Item.findByPk(req.params.id);
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
    const nextItem = await Item.findOne({
      where: {
        section_id: item.section_id,
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
    // empty cache
    emtyEtablissementCache(item.etablissement_id);
    // return
    res.status(200).json([item, nextItem]);
  } catch (err) {
    next(err);
  }
});

// Update position down
router.patch("/movedown/:id(\\d+)", auth, async (req, res, next) => {
  // get item
  const item = await Item.findByPk(req.params.id);
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
    const previousItem = await Item.findOne({
      where: {
        section_id: item.section_id,
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
    // empty cache
    emtyEtablissementCache(item.etablissement_id);
    // return
    res.status(200).json([item, previousItem]);
  } catch (err) {
    next(err);
  }
});

// CREATE
router.post("/", auth, async (req, res, next) => {
  // verify inputs
  let { section_id, nom, prix, description } = req.body;
  let inputErrors = [];
  if (!section_id) {
    inputErrors.push("section_id");
  }
  if (!nom) {
    inputErrors.push("nom");
  }
  prix = prix.trim().replace(",", ".");
  if (!prix || !isStrictDecimal(prix)) {
    inputErrors.push("prix");
  }
  if (inputErrors.length > 0) {
    return res
      .status(400)
      .json({ error: "Mandatory fields : " + inputErrors.join() });
  }

  // get section
  const section = await Section.findByPk(section_id);
  if (!section) return res.status(404).json({ erreur: "Non trouvé" });

  // verify session
  if (!req.Session) {
    return res.status(401).json({ erreur: "Bad auth token" });
  }
  if (req.Session.role === "admin");
  else if (
    req.Session.role === "etablissement" &&
    req.Session.etablissement_id == section.etablissement_id
  );
  else {
    return res.status(403).json({ erreur: "Forbidden" });
  }

  // count max position
  const [maxPosition, error2] = await getMaxPosition(section_id);
  if (error2) {
    return res.status(500).json({ erreur: error2 });
  }

  // create
  const position = maxPosition > 0 ? maxPosition + 10 : 10;
  try {
    const created = await Item.create({
      etablissement_id: section.etablissement_id,
      dynamic_menu_id: section.dynamic_menu_id,
      section_id: section.id,
      nom,
      prix,
      description,
      position,
    });
    // empty cache
    emtyEtablissementCache(section.etablissement_id);
    // return
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// DELETE
router.delete("/:id(\\d+)", auth, async (req, res, next) => {
  // get item
  const item = await Item.findByPk(req.params.id);
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
    // empty cache
    emtyEtablissementCache(item.etablissement_id);
    // delete
    await item.destroy();
    // return
    res.status(200).json({ msg: "ok" });
  } catch (err) {
    next(err);
  }
});

// remove image
router.patch("/removeimage/:id(\\d+)", auth, async (req, res, next) => {
  // get item
  const item = await Item.findByPk(req.params.id);
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
    // delete old images
    let flagChanged = false;
    if (item.image.length > 0) {
      deleteFile(process.env.UPLOAD_FILE_PATH + "/" + item.image);
      item.image = "";
      flagChanged = true;
    }
    if (item.thumbnail.length > 0) {
      deleteFile(process.env.UPLOAD_FILE_PATH + "/" + item.thumbnail);
      item.thumbnail = "";
      item.image_mode = "";
      flagChanged = true;
    }
    // save item & empty cache
    if (flagChanged) {
      item.save();
      emtyEtablissementCache(item.etablissement_id);
    }
    // return
    res.status(200).json(item);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
