require("dotenv").config();
const axios = require("axios");
const { getTodayDateFR } = require("../Helpers/BillHelper.js");

function sendEmailBrevo(
  apikey,
  senderName,
  senderEmail,
  receiverName,
  receiverEmail,
  subject,
  htmlContent
) {
  const body = {
    sender: {
      name: senderName,
      email: senderEmail,
    },
    to: [
      {
        name: receiverName,
        email: receiverEmail,
      },
    ],
    subject: subject,
    htmlContent: htmlContent,
  };
  const headers = {
    Accept: "application/json",
    "api-key": apikey,
    "Content-Types": "application/json",
  };
  axios
    .post("https://api.brevo.com/v3/smtp/email", body, { headers })
    .then(() => {
      // Succès
    })
    .catch((error) => {
      console.error("Erreur lors de l'envoi email brevo :", error);
    });
}

function sendInvoiceNotif(etablissement) {
  let html = `Bonjour ${etablissement.nom} ${etablissement.prenom},<br />
<br />
Une facture a été générée sur votre compte.<br />
Pour la régler, veuillez vous connecter à votre compte sur admin.tabluuu.fr, et aller sur l'espace "mes factures".<br />
<br />
<br />
En cas de doute ou de problème, n'hésitez pas à contacter nos équipes.<br />
<br />
Pour nous contacter : contact.tabluuu@gmail.com ou 06 15 53 26 20<br />
-- <br />
TABLUUU<br />
www.tabluuu.fr `;

  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;

  // create calculated subject
  const subject = "Une facture est en attente dans votre espace";
  // send mail
  sendEmailBrevo(
    apiKey,
    "Tabluuu.fr",
    senderEmail,
    etablissement.email_facturation,
    etablissement.email_facturation,
    subject,
    html
  );
}

function sendReceipt(bill, etablissement) {
  let html = `Bonjour ${etablissement.nom} ${etablissement.prenom},<br />
<br />
Votre facture ${bill.id} d'un montant de ${
    bill.amount
  } € à bien été payée le ${getTodayDateFR()}.<br />
<br />
<br />
Vous pouvez consulter l'ensemble de vos factures en vous connectans à votre compte sur admin.tabluuu.fr, et aller sur la rubrique "mes factures".<br />
En cas de doute ou de problème, n'hésitez pas à contacter nos équipes.<br />
<br />
Pour nous contacter : contact.tabluuu@gmail.com ou 06 15 53 26 20<br />
-- <br />
TABLUUU<br />
www.tabluuu.fr `;

  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;

  // create calculated subject
  const subject = `Recu pour la facture ${bill.id} .`;
  // send mail
  sendEmailBrevo(
    apiKey,
    "Tabluuu.fr",
    senderEmail,
    etablissement.email_facturation,
    etablissement.email_facturation,
    subject,
    html
  );
}
module.exports = {
  sendReceipt,
  sendInvoiceNotif,
  sendEmailBrevo,
};
