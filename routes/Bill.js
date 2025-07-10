const express = require("express");
const router = express.Router();
const { Bill, Etablissement } = require("../models");
const multer = require("multer");
const upload = multer(); // pas de stockage, en mémoire
const auth = require("../middleware/auth.js");
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { generateInvoice } = require("../Helpers/BillHelper.js");
const { sendInvoiceNotif } = require("../Helpers/MailHelper.js");

function isStrictDecimal(str) {
  return /^(-?\d+(\.\d+)?|-?\.\d+)$/.test(str);
}

function getFuturDate(nbrDays = 0) {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + nbrDays);

  // Format YYYY-MM-DD
  const year = futureDate.getFullYear();
  const month = String(futureDate.getMonth() + 1).padStart(2, "0"); // mois de 0 à 11
  const day = String(futureDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// create
router.post("/", auth, async (req, res, next) => {
  // verify session
  if (!req.Session) {
    return res.status(401).json({ erreur: "Bad auth token" });
  }
  if (req.Session.role === "admin");
  else if (req.Session.role === "commercial");
  else {
    return res.status(403).json({ erreur: "Forbidden" });
  }

  // verify inputs
  const {
    etablissement_id,
    month,
    year,
    month_amount,
    qr_board_quantity,
    qr_board_unit_price,
    menu_edit_amount,
  } = req.body;
  let inputErrors = [];
  if (!etablissement_id) {
    inputErrors.push("etablissement_id");
  }
  if (month.length > 0 && isNaN(parseInt(month))) {
    inputErrors.push("month");
  }
  if (year.length > 0 && isNaN(parseInt(year))) {
    inputErrors.push("year");
  }
  const month_amount2 = month_amount.trim().replace(",", ".");
  if (month_amount2.length > 0 && !isStrictDecimal(month_amount2)) {
    inputErrors.push("month_amount");
  }
  if (qr_board_quantity.length > 0 && isNaN(parseInt(qr_board_quantity))) {
    inputErrors.push("qr_board_quantity");
  }
  const qr_board_unit_price2 = qr_board_unit_price.trim().replace(",", ".");
  if (
    qr_board_unit_price2.length > 0 &&
    !isStrictDecimal(qr_board_unit_price2)
  ) {
    inputErrors.push("qr_board_unit_price");
  }
  const menu_edit_amount2 = menu_edit_amount.trim().replace(",", ".");
  if (menu_edit_amount2.length > 0 && !isStrictDecimal(menu_edit_amount2)) {
    inputErrors.push("menu_edit_amount");
  }
  if (inputErrors.length > 0) {
    return res
      .status(400)
      .json({ error: "Mandatory fields : " + inputErrors.join() });
  }

  // get etablissement
  const etablissement = await Etablissement.findByPk(etablissement_id);
  if (!etablissement) return res.status(404).json({ erreur: "Non trouvé" });

  // generated values
  const status = "pending";
  let filepath = "";
  const max_date_payment = getFuturDate(15);
  let amount = 0;
  if (month_amount2.length > 0) {
    amount += parseFloat(month_amount2);
  }
  if (menu_edit_amount2.length > 0) {
    amount += parseFloat(menu_edit_amount2);
  }
  if (qr_board_unit_price2.length > 0 && qr_board_quantity.length > 0) {
    amount += parseFloat(qr_board_unit_price2) * parseInt(qr_board_quantity);
  }

  try {
    // create
    const created = await Bill.create({
      etablissement_id,
      etablissement,
      status,
      amount,
      filepath,
      max_date_payment,
      month,
      year,
      month_amount: month_amount2,
      qr_board_quantity,
      qr_board_unit_price: qr_board_unit_price2,
      menu_edit_amount: menu_edit_amount2,
    });

    // define files, path
    const billFileName = created.id + ".pdf";
    const relativeTargetDir = etablissement_id + "/bill/";
    const relativeTargetPath = relativeTargetDir + billFileName;
    const absoluteTargetDir = path.join(
      process.env.UPLOAD_FILE_PATH + "/" + relativeTargetDir
    );
    const absoluteTargetPath = absoluteTargetDir + billFileName;
    if (!fs.existsSync(absoluteTargetDir)) {
      fs.mkdirSync(absoluteTargetDir, { recursive: true });
    }

    // generate pdf
    const data = {
      numero: created.id,
      etablissement_id,
      etablissement,
      amount,
      max_date_payment,
      month,
      year,
      month_amount: month_amount2,
      qr_board_quantity,
      qr_board_unit_price: qr_board_unit_price2,
      menu_edit_amount: menu_edit_amount2,
    };

    generateInvoice(data, absoluteTargetPath);
    // update entity
    created.filepath = "" + relativeTargetPath;
    created.status = "created";
    await created.save();
    // send invoice notif
    sendInvoiceNotif(etablissement);
    // return
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
