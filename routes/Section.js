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
/*

// GET one menu
router.get("/:id(\\d+)", auth, async (req, res, next) => {
  // get menu
  const menu = await Dynamicmenu.findByPk(req.params.id);
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

  // return
  res.status(200).json(menu);
});

// CHANGE selectedMenu
router.patch("/setselected/:id(\\d+)", auth, async (req, res, next) => {
  // get menu
  const menu = await Dynamicmenu.findByPk(req.params.id);
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

  try {
    // set all etablissement menu to zero
    await sequelize.query(
      "UPDATE dynamic_menu SET is_active = 0 WHERE etablissement_id = :etabId",
      {
        replacements: { etabId: menu.etablissement_id },
      }
    );
    // update
    menu.is_active = 1;
    await menu.save();
    // return
    res.status(200).json({ msg: "ok" });
  } catch (err) {
    next(err);
  }
});

// Update name
router.patch("/:id(\\d+)", auth, async (req, res, next) => {
  // get menu
  const menu = await Dynamicmenu.findByPk(req.params.id);
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

  // verify inputs
  const { nom } = req.body;
  if (!nom) {
    return res.status(400).json({ error: "Mandatory field : nom" });
  }

  try {
    // update
    menu.nom = nom;
    await menu.save();
    // return
    res.status(200).json({ msg: "ok" });
  } catch (err) {
    next(err);
  }
});

// Update position up
router.patch("/moveup/:id(\\d+)", auth, async (req, res, next) => {
  // get menu
  const menu = await Dynamicmenu.findByPk(req.params.id);
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

  try {
    // search next menu
    const nextMenu = await Dynamicmenu.findOne({
      where: {
        etablissement_id: menu.etablissement_id,
        position: {
          [Op.gt]: menu.position, // superior
        },
      },
      order: [["position", "ASC"]], // plus proche valeur inférieure
    });
    // switch
    if (nextMenu) {
      const switchVar = menu.position;
      menu.position = nextMenu.position;
      nextMenu.position = switchVar;
      await menu.save();
      await nextMenu.save();
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
  const menu = await Dynamicmenu.findByPk(req.params.id);
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

  try {
    // search previous menu
    const previousMenu = await Dynamicmenu.findOne({
      where: {
        etablissement_id: menu.etablissement_id,
        position: {
          [Op.lt]: menu.position, // inferior
        },
      },
      order: [["position", "DESC"]], // plus proche valeur inférieure
    });
    // switch
    if (previousMenu) {
      const switchVar = menu.position;
      menu.position = previousMenu.position;
      previousMenu.position = switchVar;
      await menu.save();
      await previousMenu.save();
    }
    // return
    res.status(200).json({ msg: "ok" });
  } catch (err) {
    next(err);
  }
});
*/

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

/*
// DELETE
router.delete("/:id(\\d+)", auth, async (req, res, next) => {
  // get menu
  const menu = await Dynamicmenu.findByPk(req.params.id);
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

  try {
    // if menu is active, activate another
    if (menu.is_active == 1) {
      const menu2 = await Dynamicmenu.findOne({
        where: {
          etablissement_id: menu.etablissement_id,
          id: {
            [Op.ne]: menu.id, // Exclut id du menu
          },
        },
        order: [["id", "DESC"]],
      });
      if (menu2) {
        menu2.is_active = 1;
        await menu2.save();
      }
    }

    // delete
    await menu.destroy();
    // return
    res.status(200).json({ msg: "ok" });
  } catch (err) {
    next(err);
  }
});
*/
module.exports = router;
