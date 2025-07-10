require("dotenv").config();
const express = require("express");
const router = express.Router();
const { Test } = require("../models");
const multer = require("multer");
const upload = multer(); // pas de stockage, en mémoire
const path = require("path");
const fs = require("fs");
const QRCode = require("qrcode");
const { createCanvas, loadImage } = require("canvas");

// Dossier racine autorisé
const BASE_DIR = path.resolve(process.env.UPLOAD_FILE_PATH);
const PUBLIC_DIR = path.resolve("./public/");

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

//-----------------------------------------------------------
function generateQrMenu(barid, table) {
  const proforma_menu = path.resolve(PUBLIC_DIR, "proforma-menu-kebab.png");
  return generateQrImage(proforma_menu, barid, table);
}

function generateQrCarte(barid, table) {
  const proforma_menu = path.resolve(PUBLIC_DIR, "proforma-carte-bar.png");
  return generateQrImage(proforma_menu, barid, table);
}

async function generateQrImage(proformaPath, barid, table) {
  const qrText = `https://www.tabluuu.fr/?barid=${barid}&table=${table}`;
  const qrSize = 500;

  // Charger le proforma
  const proforma = await loadImage(proformaPath);

  // Générer le QR code en dataURL
  const qrDataUrl = await QRCode.toDataURL(qrText, {
    width: qrSize,
    margin: 1,
  });
  const qrImage = await loadImage(qrDataUrl);

  // dessiner l'image
  const canvas = createCanvas(614, 874);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(proforma, 0, 0);
  ctx.drawImage(qrImage, 60, 200);

  return canvas;
}

router.get("/getqrcode", async (req, res) => {
  const barid = req.query.barid;
  const table = req.query.table;
  const type = req.query.type || "bar";

  if (!barid || !table || !type) {
    return res.status(400).send("Missing barid, table or type parameter");
  }

  // Chemin du dossier et du fichier
  const dirPath = path.join(BASE_DIR, `${barid}/QrCodes/`);
  const fileName = `${table}.jpg`;
  const filePath = path.join(dirPath, fileName);

  // Vérifier si le fichier existe
  fs.access(filePath, fs.constants.F_OK, async (err) => {
    if (!err) {
      // Fichier existe, on le renvoie directement
      return res.sendFile(filePath);
    }

    try {
      // Créer le dossier s'il n'existe pas
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      // URL à encoder dans le QR code
      let canvas = "";
      if (type === "bar") {
        canvas = await generateQrCarte(barid, table);
      } else {
        canvas = await generateQrMenu(barid, table);
      }
      const buffer = canvas.toBuffer("image/png");

      // Sauvegarde
      fs.writeFileSync(filePath, buffer);

      // Sauvegarde
      return res.sendFile(filePath);
    } catch (error) {
      console.error("Erreur dans la génération du QR code:", error);
      return res.status(500).send("Erreur serveur");
    }
  });
});

module.exports = router;
