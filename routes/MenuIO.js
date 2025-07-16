require("dotenv").config();
const express = require("express");
const router = express.Router();
const {
  sequelize,
  Etablissement,
  Staticmenu,
  StaticItem,
  Dynamicmenu,
  Section,
  Item,
} = require("../models");
const multer = require("multer");
const upload = multer(); // pas de stockage, en mémoire
const auth = require("../middleware/auth.js");
const { addImageOnStaticItem } = require("../Helpers/ImageHelper.js");
const { emtyEtablissementCache } = require("../modules/APIEtablissementCache");

async function getItems(etablissement_id) {
  // search
  const items = await Item.findAll({
    where: { etablissement_id },
    order: [["id", "ASC"]],
  });
  return items;
}

async function getSections(etablissement_id) {
  // search
  const sections = await Section.findAll({
    where: { etablissement_id },
    order: [["id", "ASC"]],
  });
  return sections;
}

async function getDynamicMenus(etablissement_id) {
  // search
  const menus = await Dynamicmenu.findAll({
    where: { etablissement_id },
    order: [["id", "ASC"]],
  });
  return menus;
}

async function getStaticMenus(etablissement_id) {
  // search
  const menus = await Staticmenu.findAll({
    where: { etablissement_id },
    order: [["id", "ASC"]],
  });
  return menus;
}

async function getStaticItems(etablissement_id) {
  // search
  const items = await StaticItem.findAll({
    where: { etablissement_id },
    order: [["id", "ASC"]],
  });
  return items;
}

function csvSection(section) {
  const res = `section;"${section.nom}";${section.position};`;
  return res;
}

function csvItem(item) {
  const res = `item;"${item.nom}";"${item.description}";${item.prix};${item.position};"${item.image}";${item.image_mode};`;
  return res;
}

function csvDynamicMenu(menu) {
  const res = `dynamic_menu;"${menu.nom}";${menu.position};${menu.is_active};`;
  return res;
}

function csvStaticMenu(staticMenu) {
  const res = `static_menu;"${staticMenu.nom}";${staticMenu.position};${staticMenu.is_active};`;
  return res;
}

function csvStaticItem(item) {
  const imagePath =
    item.image.length > 0
      ? process.env.UPLOAD_FILE_PATH + "/" + item.image
      : "";
  const res = `static_item;${item.position};"${imagePath}";`;
  return res;
}

async function cleanMenus(etablissementId) {
  // static menu
  await sequelize.query(
    "DELETE FROM static_menu WHERE etablissement_id = :etablissementId",
    {
      replacements: { etablissementId: etablissementId },
      type: sequelize.QueryTypes.DELETE,
    }
  );
  // static item
  await sequelize.query(
    "DELETE FROM static_item WHERE etablissement_id = :etablissementId",
    {
      replacements: { etablissementId: etablissementId },
      type: sequelize.QueryTypes.DELETE,
    }
  );

  // sequelize.query("DELETE FROM `session` WHERE `max_timestamp` < NOW()");
}

async function createStaticMenu(etablissementId, fields) {
  let nom = fields.at(1); //  '\\"test2\\"', '30', '0'
  nom = nom.replace(/^\\\"+|\\"+$/g, "");
  const position = parseInt(fields.at(2)) ?? 0;
  const isActive = fields.at(3) === "0" ? 0 : 1;

  const inputs = {
    etablissement_id: etablissementId,
    nom,
    is_active: isActive,
    position,
  };
  const res = await Staticmenu.create(inputs);

  return res;
}

async function createStaticItem(etablissementId, staticMenuId, fields) {
  // verify inputs
  const position = fields.at(1); //
  let image = fields.at(2); // static_item;10;\"C:/images/1/images/menu1.jpg\";\n
  image = image.replace(/^\\\"+|\\"+$/g, "");

  // create item
  const inputs = {
    etablissement_id: etablissementId,
    static_menu_id: staticMenuId,
    position,
  };
  const created = await StaticItem.create(inputs);

  // create images
  if (image && image.length > 0) {
    const { httpCode, errorMsg } = await addImageOnStaticItem(image, created);
  }

  // return
  return created;
}

// export a menu
router.get("/:etabid(\\d+)", auth, async (req, res, next) => {
  // get etablissement
  const etablissement = await Etablissement.findByPk(req.params.etabid);
  if (!etablissement) return res.status(404).json({ erreur: "Non trouvé" });

  // verify session
  if (!req.Session) {
    return res.status(401).json({ erreur: "Bad auth token" });
  }
  if (req.Session.role === "admin");
  else if (req.Session.role === "commercial");
  else if (
    req.Session.role === "etablissement" &&
    req.Session.etablissement_id == req.params.etabid
  );
  else {
    return res.status(403).json({ erreur: "Forbidden" });
  }

  // search
  try {
    let myRes = [];
    const etabId = req.params.etabid;
    const staticMenus = await getStaticMenus(etabId);
    const staticItems = await getStaticItems(etabId);
    const dynamicMenus = await getDynamicMenus(etabId);
    const sections = await getSections(etabId);
    const items = await getItems(etabId);

    // static menu
    if (staticMenus && staticMenus.length > 0) {
      staticMenus.map(function (menu) {
        myRes.push(csvStaticMenu(menu));
        // static items
        if (!staticItems || !staticItems.length) return;
        const localItems =
          staticItems.filter((item) => item.static_menu_id === menu.id) ?? [];
        if (!localItems || !localItems.length) return;
        localItems.map(function (item) {
          myRes.push(csvStaticItem(item));
        });
      });
    }

    // dynamic menu
    if (dynamicMenus && dynamicMenus.length > 0) {
      dynamicMenus.map(function (menu) {
        myRes.push(csvDynamicMenu(menu));
        // sections
        if (!sections || !sections.length) return;
        const localSections =
          sections.filter((section) => section.dynamic_menu_id === menu.id) ??
          [];
        if (!localSections || !localSections.length) return;
        localSections.map(function (section) {
          myRes.push(csvSection(section));
          // items
          if (!items || !items.length) return;
          const localItems =
            items.filter((item) => item.section_id === section.id) ?? [];
          if (!localItems || !localItems.length) return;
          localItems.map(function (item) {
            myRes.push(csvItem(item));
          });
        });
      });
    }
    res.status(200).json(myRes.join("\n"));
  } catch (err) {
    next(err);
  }
});

// import a menu
router.post("/:etabid(\\d+)", auth, upload.none(), async (req, res, next) => {
  // verify
  if (!req.body.data) {
    return res.status(400).json({ erreur: "Required field : data" });
  }
  const data = req.body.data;

  // get etablissement
  const etablissement = await Etablissement.findByPk(req.params.etabid);
  if (!etablissement) return res.status(404).json({ erreur: "Non trouvé" });

  // verify session
  if (!req.Session) {
    return res.status(401).json({ erreur: "Bad auth token" });
  }
  if (req.Session.role === "admin");
  else if (req.Session.role === "commercial");
  else if (
    req.Session.role === "etablissement" &&
    req.Session.etablissement_id == req.params.etabid
  );
  else {
    return res.status(403).json({ erreur: "Forbidden" });
  }

  // import
  const etablissementId = etablissement.id;
  let staticMenuId = 0;
  let dynamicMenuId = 0;
  let sectionId = 0;

  try {
    const lines = data.split("\\n");
    if (!lines || !lines.length) {
      return res.status(400).json({ erreur: "Bad field format : data" });
    }
    await cleanMenus(etablissementId);

    lines.forEach(async function (line) {
      const fields = line.split(";");
      if (fields.at(0) === "static_menu") {
        const staticMenu = await createStaticMenu(etablissementId, fields);
        staticMenuId = staticMenu.id;
      } else if (fields.at(0) === "static_item") {
        createStaticItem(etablissementId, staticMenuId, fields);
      }
    });
    // empty cache
    emtyEtablissementCache(etablissementId);
    // return
    res.status(200).json({ msg: "ok" });
  } catch (err) {
    next(err);
  }
});
module.exports = router;
