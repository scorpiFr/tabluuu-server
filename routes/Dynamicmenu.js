const express = require("express");
const router = express.Router();
const { sequelize, Dynamicmenu } = require("../models");
const { Op } = require("sequelize");

const multer = require("multer");
const upload = multer(); // pas de stockage, en mémoire
const auth = require("../middleware/auth.js");

async function countMenus(etablissementId) {
  try {
    const [results, metadata] = await sequelize.query(
      "SELECT COUNT(id) AS cpt FROM dynamic_menu WHERE etablissement_id = :etabId",
      {
        replacements: { etabId: etablissementId },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    // results sera un tableau d'objets, ex : [{ cpt: 5 }]
    const res = [results.cpt, null];
    return res;
  } catch (error) {
    console.error("Erreur dans countMenus:", error);
    return [null, error];
  }
}

async function getMaxPosition(etablissementId) {
  try {
    const [results, metadata] = await sequelize.query(
      "SELECT MAX(position) AS maxposition FROM dynamic_menu WHERE etablissement_id = :etabId",
      {
        replacements: { etabId: etablissementId },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    // results sera un tableau d'objets, ex : [{ cpt: 5 }]
    return [results.maxposition, null];
  } catch (error) {
    console.error("Erreur dans countMenus:", error);
    return [0, error];
  }
}

// LIST my menus
router.get(
  "/listetablissementdynmenus/:etabid(\\d+)",
  auth,
  async (req, res, next) => {
    // verify session
    if (!req.Session) {
      return res.status(401).json({ erreur: "Bad auth token" });
    }
    if (req.Session.role === "admin");
    else if (
      req.Session.role === "etablissement" &&
      req.Session.etablissement_id == req.params.etabid
    );
    else {
      return res.status(403).json({ erreur: "Forbidden" });
    }

    // search
    try {
      const menus = await Dynamicmenu.findAll({
        where: { etablissement_id: req.params.etabid },
        order: [["id", "DESC"]],
      });
      res.status(200).json(menus);
    } catch (err) {
      next(err);
    }
  }
);

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

// CREATE
router.post("/", auth, async (req, res, next) => {
  // verify inputs
  const { etablissement_id, nom } = req.body;
  let inputErrors = [];
  if (!etablissement_id) {
    inputErrors.push("etablissement_id");
  }
  if (!nom) {
    inputErrors.push("nom");
  }
  if (inputErrors.length > 0) {
    return res
      .status(400)
      .json({ error: "Mandatory fields : " + inputErrors.join() });
  }

  // verify session
  if (!req.Session) {
    return res.status(401).json({ erreur: "Bad auth token" });
  }
  if (req.Session.role === "admin");
  else if (
    req.Session.role === "etablissement" &&
    req.Session.etablissement_id == etablissement_id
  );
  else {
    return res.status(403).json({ erreur: "Forbidden" });
  }

  // count nbr menus
  const [nbrMenus, error] = await countMenus(etablissement_id);
  if (error) {
    return res.status(500).json({ error });
  }

  // count max position
  const [maxPosition, error2] = await getMaxPosition(etablissement_id);
  if (error2) {
    return res.status(500).json({ erreur: error2 });
  }

  // create
  const is_active = nbrMenus > 0 ? 0 : 1;
  const position = maxPosition > 0 ? maxPosition + 10 : 10;
  try {
    const created = await Dynamicmenu.create({
      etablissement_id,
      nom,
      is_active,
      position,
    });

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

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

module.exports = router;
