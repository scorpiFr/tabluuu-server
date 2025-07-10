const PDFDocument = require("pdfkit");
const fs = require("fs");

function getTodayDateFR() {
  const today = new Date();

  // Format DD/MM/YYYY
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0"); // mois de 0 à 11
  const day = String(today.getDate()).padStart(2, "0");

  return `${day}/${month}/${year}`;
}

/*
const data = {
      etablissement_id,
      amount,
      max_date_payment,
      month,
      year,
      month_amount: month_amount2,
      qr_board_quantity,
      qr_board_unit_price: qr_board_unit_price2,
      menu_edit_amount: menu_edit_amount2,
    };
    const relativeTargetPath =
      etablissement_id + "/bill/" + created.id + ".pdf";
    const absoluteTargetPath = path.join(
      process.env.UPLOAD_FILE_PATH + "/" + relativeTargetPath
    );
    */

function generateInvoice(data, outputPath) {
  const doc = new PDFDocument({ margin: 50 });

  doc.pipe(fs.createWriteStream(outputPath));

  // ckconseil
  doc.fontSize(15).text("CK conseil").moveDown(0.5);
  doc.fontSize(8).text("8 rue de bellevue").moveDown(0.5);
  doc.fontSize(8).text("86580 vouneuil-sous-biard").moveDown(0.5);
  doc.fontSize(8).text("France").moveDown(0.5);
  doc.fontSize(15).text("").moveDown();

  // client
  doc.fontSize(15).text("Client : ").moveDown(0.5);
  doc.fontSize(8).text(data.etablissement.nom_etablissement).moveDown(0.5);
  if (data.etablissement.adresse) {
    doc.fontSize(8).text(data.etablissement.adresse).moveDown(0.5);
  }
  doc
    .fontSize(8)
    .text("Email :" + data.etablissement.email_facturation)
    .moveDown(0.5);
  if (data.etablissement.tel) {
    doc.fontSize(8).text(data.etablissement.tel).moveDown(0.5);
  }
  doc.fontSize(15).text("").moveDown();

  // Infos facture
  doc.fontSize(8).fontSize(15).text("Facture : ").moveDown(0.5);
  const todayDate = getTodayDateFR();
  doc
    .fontSize(8)
    .text(`Numéro : ${data.numero}`)
    .text(`Date : ${todayDate}`)
    .moveDown(0.5);
  doc.fontSize(15).text("").moveDown();

  // Produits
  doc.text("Détail des articles :").moveDown(0.5);
  let cpt = 1;
  if (data.month_amount > 0) {
    doc
      .text(
        `${cpt}. Acces au service tabluuu pour le mois ${data.month}/${data.year} - ${data.month_amount}€`
      )
      .moveDown(0.5);
    cpt++;
  }
  if (data.menu_edit_amount > 0) {
    doc
      .text(
        `${cpt}. Saisie de la carte du restaurant dans le service - ${data.menu_edit_amount}€`
      )
      .moveDown(0.5);
    cpt++;
  }
  if (data.qr_board_unit_price > 0 && data.qr_board_quantity > 0) {
    doc
      .text(
        `${cpt}. Impression de planches de QR codes - ${data.qr_board_quantity} * ${data.qr_board_unit_price}€`
      )
      .moveDown(0.5);
    cpt++;
  }
  doc.fontSize(15).text("").moveDown(0.5);

  // total
  doc
    .moveDown()
    .fontSize(14)
    .text(`Total à payer : ${data.amount.toFixed(2)} €`, { align: "right" });
  doc.fontSize(15).text("").moveDown();

  // mentions
  doc
    .fontSize(8)
    .text("Conditions de paiement et mentions particulières :")
    .moveDown(0.5);
  doc
    .fontSize(8)
    .text("TVA non applicable, article 293B du code général des impôts")
    .moveDown(0.5);
  doc.fontSize(8).text("conditions de paiement : 14 jours").moveDown(0.5);
  doc
    .fontSize(8)
    .text("Date d'échéance : " + data.max_date_payment)
    .moveDown(0.5);

  doc.fontSize(15).text("").moveDown();

  // footer
  doc
    .fontSize(8)
    .text("CK conseil 8 rue de bellevue 86580 vouneuil-sous-biard")
    .moveDown(0.5);
  doc.fontSize(8).text("E-mail : camille.khalaghi@gmail.com").moveDown(0.5);
  doc.fontSize(8).text("Tél : 0615532620").moveDown(0.5);
  doc.fontSize(8).text("N° SIREN/SIRET : 53847691200018").moveDown(0.5);
  doc
    .fontSize(8)
    .text("Code banque/BIC : 3003 01630 00050347732 06")
    .moveDown(0.5);
  doc.fontSize(8).text("IBAN : FR76 30003 01630 00050347732 06").moveDown(0.5);

  doc.end();
}

module.exports = {
  getTodayDateFR,
  generateInvoice,
};
