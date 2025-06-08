const express = require("express");
const router = express.Router();
const { Test } = require("../models");
const multer = require("multer");
const upload = multer(); // pas de stockage, en mémoire
const path = require("path");
const fs = require("fs");

// Dossier racine autorisé
const BASE_DIR = path.resolve(process.env.UPLOAD_FILE_PATH);

// GET /test/getFile
router.get("/getFile", (req, res) => {
  const filePathRaw = Object.keys(req.query)[0]; // ex: images/panini.jpg

  if (!filePathRaw) {
    return res.status(400).send("No file specified.");
  }

  // Rejeter tout chemin contenant des tentatives d’évasion
  if (
    filePathRaw.includes("..") ||
    filePathRaw.includes("\\..") ||
    filePathRaw.includes("/..")
  ) {
    return res.status(403).send("Access denied.");
  }

  // Résolution du chemin complet
  const resolvedPath = path.resolve(BASE_DIR, filePathRaw);

  // Vérifie que le chemin reste bien dans le dossier de base
  if (!resolvedPath.startsWith(BASE_DIR)) {
    return res.status(403).send("Access denied.");
  }

  // Vérifie que le fichier existe
  fs.access(resolvedPath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).send("File not found.");
    }

    res.sendFile(resolvedPath, (err) => {
      if (err) {
        console.error("SendFile error:", err);
        res.status(500).send("Error sending file.");
      }
    });
  });
});

module.exports = router;
