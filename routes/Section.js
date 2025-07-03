const express = require("express");
const router = express.Router();
const { sequelize, Dynamicmenu, Section } = require("../models");
const { Op } = require("sequelize");

const multer = require("multer");
const upload = multer(); // pas de stockage, en mémoire
const auth = require("../middleware/auth.js");

async function getMaxPosition(dynMenuId) {
  try {
    const [results, metadata] = await sequelize.query(
      "SELECT MAX(position) AS maxposition FROM section WHERE dynamic_menu_id = :dynMenuId",
      {
        replacements: { dynMenuId: dynMenuId },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    // results sera un tableau d'objets, ex : [{ cpt: 5 }]
    return [results.maxposition, null];
  } catch (error) {
    console.error("Erreur dans getMaxPosition:", error);
    return [0, error];
  }
}

// LIST
router.get(
  "/getsectionsfromdynmenu/:dynmenuId(\\d+)",
  auth,
  async (req, res, next) => {
    // get menu
    const menu = await Dynamicmenu.findByPk(req.params.dynmenuId);
    if (!menu) return res.status(404).json({ erreur: "Menu not found" });

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
      const sections = await Section.findAll({
        where: { dynamic_menu_id: req.params.dynmenuId },
        order: [["position", "ASC"]],
      });
      res.status(200).json(sections);
    } catch (err) {
      next(err);
    }
  }
);

// GET one
router.get("/:id(\\d+)", auth, async (req, res, next) => {
  // get section
  const section = await Section.findByPk(req.params.id);
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

  // return
  res.status(200).json(section);
});

// Update name
router.patch("/:id(\\d+)", auth, async (req, res, next) => {
  // get section
  const section = await Section.findByPk(req.params.id);
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

  // verify inputs
  const { nom } = req.body;
  if (!nom) {
    return res.status(400).json({ error: "Mandatory field : nom" });
  }

  try {
    // update
    section.nom = nom;
    await section.save();
    // return
    res.status(200).json({ msg: "ok" });
  } catch (err) {
    next(err);
  }
});

// Update position up
router.patch("/moveup/:id(\\d+)", auth, async (req, res, next) => {
  // get menu
  const section = await Section.findByPk(req.params.id);
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

  try {
    // search next menu
    const nextSection = await Section.findOne({
      where: {
        dynamic_menu_id: section.dynamic_menu_id,
        position: {
          [Op.gt]: section.position, // superior
        },
      },
      order: [["position", "ASC"]], // plus proche valeur inférieure
    });
    // switch
    if (nextSection) {
      const switchVar = section.position;
      section.position = nextSection.position;
      nextSection.position = switchVar;
      await section.save();
      await nextSection.save();
    }
    // return
    res.status(200).json({ msg: "ok" });
  } catch (err) {
    next(err);
  }
});

// Update position down
router.patch("/movedown/:id(\\d+)", auth, async (req, res, next) => {
  // get menu
  const section = await Section.findByPk(req.params.id);
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

  try {
    // search previous menu
    const previousSection = await Section.findOne({
      where: {
        dynamic_menu_id: section.dynamic_menu_id,
        position: {
          [Op.lt]: section.position, // inferior
        },
      },
      order: [["position", "DESC"]], // plus proche valeur inférieure
    });
    // switch
    if (previousSection) {
      const switchVar = section.position;
      section.position = previousSection.position;
      previousSection.position = switchVar;
      await section.save();
      await previousSection.save();
    }
    // return
    res.status(200).json({ msg: "ok" });
  } catch (err) {
    next(err);
  }
});

// CREATE
router.post("/", auth, async (req, res, next) => {
  // verify inputs
  const { dynamic_menu_id, nom } = req.body;
  let inputErrors = [];
  if (!dynamic_menu_id) {
    inputErrors.push("dynamic_menu_id");
  }
  if (!nom) {
    inputErrors.push("nom");
  }
  if (inputErrors.length > 0) {
    return res
      .status(400)
      .json({ error: "Mandatory fields : " + inputErrors.join() });
  }

  // get dynamic_menu
  const menu = await Dynamicmenu.findByPk(dynamic_menu_id);
  if (!menu) return res.status(404).json({ erreur: "Menu not found" });

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

  // count max position
  const [maxPosition, error2] = await getMaxPosition(menu.etablissement_id);
  if (error2) {
    return res.status(500).json({ erreur: error2 });
  }

  // create
  const position = maxPosition > 0 ? maxPosition + 10 : 10;
  try {
    const created = await Section.create({
      etablissement_id: menu.etablissement_id,
      dynamic_menu_id,
      nom,
      position,
    });

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// DELETE
router.delete("/:id(\\d+)", auth, async (req, res, next) => {
  // get section
  const section = await Section.findByPk(req.params.id);
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

  try {
    // delete
    await section.destroy();
    // return
    res.status(200).json({ msg: "ok" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
