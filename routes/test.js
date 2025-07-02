const express = require("express");
const router = express.Router();
const { Test } = require("../models");
const multer = require("multer");
const upload = multer(); // pas de stockage, en mémoire

// GET all
router.get("/", async (req, res, next) => {
  try {
    const data = await Test.findAll();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET by ID
router.get("/:id(\\d+)", async (req, res, next) => {
  try {
    const item = await Test.findByPk(req.params.id);
    if (!item) return res.status(404).json({ erreur: "Non trouvé" });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// POST
router.post("/", upload.none(), async (req, res, next) => {
  try {
    const { nom, age, email } = req.body;
    const created = await Test.create({ nom, age, email });

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// PUT
router.put("/:id(\\d+)", async (req, res, next) => {
  try {
    const updated = await Test.update(req.body, {
      where: { id: req.params.id },
    });
    res.json({ updated });
  } catch (err) {
    next(err);
  }
});

// DELETE
router.delete("/:id(\\d+)", async (req, res, next) => {
  try {
    const deleted = await Test.destroy({
      where: { id: req.params.id },
    });
    res.json({ deleted });
  } catch (err) {
    next(err);
  }
});

// Route easter egg
router.get("/yippee", (req, res) => {
  res.json({
    message: "Yippee-ki-yay, développeur ! 💥",
    hero: "John McClane",
    film: "Die Hard (1988)",
  });
});

module.exports = router;
