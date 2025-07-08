const express = require("express");
const router = express.Router();
const {
  Etablissement,
  Dynamicmenu,
  Section,
  Item,
  Staticmenu,
  StaticItem,
} = require("../models");
const multer = require("multer");
const upload = multer(); // pas de stockage, en mémoire
const {
  getEtablissementCache,
  setEtablissementCache,
  emtyEtablissementCache,
} = require("../modules/APIEtablissementCache");

/*
modele d'api : 
{
  "name": "La fontaine aux frites - demo",
  "type": "resto",
  "isAvailable": 1,
  "menutype": "menu",
  "lines": [
      {
        "id": "1234",
        "name": "Assiettes",
        "items": [
          {
            "id": "1",
            "name": "Assiette kebab",
            "description" : "(Avec Frites Et Boisson 33 Cl)",
            "price" : "15",
            "image" : "7/assiette_kebab.png",
            "miniature" : ""
          },
          {
            "id": "2",
            "name" : "Assiette americaine",
            "description" : "(Avec Frites Et Boisson 33 Cl)",
            "price" : "15",
            "image" : "7/assiette_americaine.png",
            "miniature" : ""
          }
        ]
      },
      {
        "id": "1235",
        "name": "Burgers",
        "items": [
          {
            "id": "10",
            "name": "Menu kebab",
            "description" : "Sandwitch, frites et boissons",
            "price" : "10",
            "image" : "7/kebab_frites.png",
            "miniature" : ""
          },
          {
            "id": "20",
            "name" : "Kebab",
            "description" : "Sandwitch seul",
            "price" : "8",
            "image" : "7/kebab_seul.png",
            "miniature" : ""
          },
          {
            "id": "30",
            "name" : "Menu maxi kebab",
            "description" : "Sandwitch, frites et boissons",
            "price" : "12",
            "image" : "7/menu-maxi-kebab.jpg",
            "miniature" : ""
          },
          {
            "id": "40",
            "name" : "Maxi kebab",
            "description" : "Sandwitch seul",
            "price" : "10",
            "image" : "7/maxi-kebab.jpg",
            "miniature" : ""
          }
        ]
      },
      {
        "id": "234",
        "name": "Paninis",
        "items": [
          {
            "id": "50",
            "name": "Menu Panini",
            "description" : "(Kebab, Américain, Kofté, Escalope, Ou 3 Fromages + Frites Et Boisson 33 Cl)",
            "price" : "8",
            "image" : "7/panini.jpg",
            "miniature" : ""
          },
          {
            "id": "51",
            "name" : "Panini Au Choix",
            "description" : "(Kebab, Américain, Kofté, Escalope, Ou 3 Fromages + Frites)",
            "price" : "6",
            "image" : "7/panini.jpg",
            "miniature" : ""
          }
        ]
      },
      {
        "id": "34",
        "name": "Extra",
        "items": [
          {
            "id": "60",
            "name": "Extra sauce",
            "description" : "(Harissa, Mayonnaise, Ketchup, Sauce Blanche, Moutarde, Samouraï)",
            "price" : "0.20",
            "image" : "",
            "miniature" : ""
          },
          {
            "id": "61",
            "name" : "Extra cheddar",
            "description" : "Tranche de chedddar supplémentaire",
            "price" : "0.5",
            "image" : "",
            "miniature" : ""
          }
        ]
      }
  ]
}

*/

async function getDynamicData(etablissementId) {
  // menu
  const menu = await Dynamicmenu.findOne({
    where: { etablissement_id: etablissementId, is_active: 1 },
  });
  if (!menu) {
    return [null, null, null];
  }
  // sections
  const sections = await Section.findAll({
    where: { dynamic_menu_id: menu.id },
    order: [["position", "ASC"]],
  });
  // items
  const items = await Item.findAll({
    where: { dynamic_menu_id: menu.id },
    order: [["position", "ASC"]],
  });
  return [menu, sections, items];
}

function renderDynamicData(etablissement, sections, items) {
  const res = {
    name: etablissement.nom_etablissement,
    type: etablissement.type,
    isAvailable: etablissement.is_available,
    menutype: etablissement.type_contrat,
    lines:
      sections?.map((section) => {
        return {
          id: section.id,
          name: section.nom,
          items:
            items
              ?.filter((item) => item.section_id === section.id)
              ?.map((item) => {
                return {
                  id: item.id,
                  name: item.nom,
                  description: item.description,
                  price: item.prix,
                  image: item.image,
                  miniature: item.thumbnail,
                };
              }) ?? [],
        };
      }) ?? [],
  };
  return res;
}

async function getStaticData(etablissementId) {
  // menu
  const menu = await Staticmenu.findOne({
    where: { etablissement_id: etablissementId, is_active: 1 },
  });
  if (!menu) {
    return [null];
  }
  // items
  const items = await StaticItem.findAll({
    where: { static_menu_id: menu.id },
    order: [["position", "ASC"]],
  });
  return items;
}

/*
{
  "name": "Housegang bar - demo",
  "type": "bar",
  "isAvailable": 1,
  "menutype": "image",
  "images": ["1/menu1.jpg"]
}
*/
function renderStaticData(etablissement, items) {
  const res = {
    name: etablissement.nom_etablissement,
    type: etablissement.type,
    isAvailable: etablissement.is_available,
    menutype: etablissement.type_contrat,
    images: items?.map((item) => {
      return item.image;
    }),
  };
  return res;
}

// GET by ID
router.get("/:id(\\d+)", async (req, res, next) => {
  // get from cache
  const cacheValue = getEtablissementCache(req.params.id);
  if (cacheValue) {
    return res.json(cacheValue);
  }

  // get data and calculate
  let res2 = {};
  try {
    const etablissementId = req.params.id;
    // etablissement
    const etablissement = await Etablissement.findByPk(etablissementId);
    if (!etablissement) return res.status(404).json({ erreur: "Non trouvé" });
    // get datas & render
    if (
      etablissement.type_contrat === "commande" ||
      etablissement.type_contrat === "menu"
    ) {
      const [menu, sections, items] = await getDynamicData(etablissement.id);
      res2 = renderDynamicData(etablissement, sections, items);
    } else if (etablissement.type_contrat === "image") {
      const items = await getStaticData(etablissementId);
      res2 = renderStaticData(etablissement, items);
    }
    // set to cache
    setEtablissementCache(etablissementId, res2);
    // return
    res.json(res2);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
