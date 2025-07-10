require("dotenv").config();
const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer(); // pas de stockage, en mémoire
const { sendEmailBrevo } = require("../Helpers/MailHelper.js");

function getCurrentDateTime() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0"); // Mois commence Ã  0
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

router.post("/sendmail", upload.none(), async (req, res) => {
  // get params and verif
  const { barid, table, price, receiverEmail, htmlContent } = req.body;
  if (!barid || !table || !price || !receiverEmail || !htmlContent) {
    return res.status(400).json({ erreur: "Element manquant" });
  }
  // create calculated subject
  const subject = `${price} € ${getCurrentDateTime()} ${table}`;
  // send mail
  sendEmailBrevo(
    process.env.BREVO_API_KEY,
    table,
    process.env.BREVO_SENDER_EMAIL,
    receiverEmail,
    receiverEmail,
    subject,
    htmlContent
  );
  // return
  return res.status(200).send("ok.");
});

module.exports = router;
