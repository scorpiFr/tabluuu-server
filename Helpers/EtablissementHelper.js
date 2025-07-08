const crypto = require("crypto");
require("dotenv").config();
const { sequelize } = require("../models");

function encryptPassword(password) {
  const salt = process.env.SALT;
  const res = crypto
    .createHash("sha1")
    .update(password + salt)
    .digest("hex");

  return res;
}
function createSecretKey() {
  const rndStr = "" + Math.floor(Math.random() * 100000) + 1;
  const res = crypto.createHash("md5").update(rndStr).digest("hex");
  return res;
}

// remove secret informations of etablissement. like secretkey or password
function removeSecretInformations(etablissement) {
  etablissement.password = "";
  etablissement.secret_key = "";
  return etablissement;
}

function isStrictDecimal(str) {
  return /^(-?\d+(\.\d+)?|-?\.\d+)$/.test(str);
}

async function getNbrEmailsUser(email) {
  // test
  try {
    const [results, metadata] = await sequelize.query(
      "SELECT COUNT(id) AS nbr FROM user WHERE email = :email",
      {
        replacements: { email: email },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    // results sera un tableau d'objets, ex : [{ position: 5 }]
    return [results.nbr, null];
  } catch (error) {
    console.error("Erreur dans getNbrEmailsUser:", error);
    return [0, error];
  }
}

async function getNbrEmailsEtablissement(email) {
  // test
  try {
    const [results, metadata] = await sequelize.query(
      "SELECT COUNT(id) AS nbr FROM etablissement WHERE email_facturation = :email OR email_commandes = :email",
      {
        replacements: { email: email },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    // results sera un tableau d'objets, ex : [{ position: 5 }]
    return [results.nbr, null];
  } catch (error) {
    console.error("Erreur dans getNbrEmailsEtablissement:", error);
    return [0, error];
  }
}

// test if email exists on the system.
// return true if email exists.
async function testEmail(email) {
  const [nbrEmailEtablissement, tmp1] = await getNbrEmailsEtablissement(email);
  if (nbrEmailEtablissement > 0) {
    return true;
  }

  const [nbrEmailUser, tmp2] = await getNbrEmailsUser(email);
  if (nbrEmailUser > 0) {
    return true;
  }

  return false;
}

// verify if email is syntaxically valid
function emailIsValid(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function getRandomPassword(width = 7) {
  const caracts = "abcdefghijklmnopqrstuvwxyz0123456789";
  let res = "";
  let len = caracts.length;

  for (let i = 0; i < width; i++) {
    const index = Math.floor(Math.random() * len);
    res += caracts[index];
  }

  return res;
}

function getRandomPasswordEncrypted() {
  return encryptPassword(getRandomPassword());
}

module.exports = {
  encryptPassword,
  createSecretKey,
  removeSecretInformations,
  isStrictDecimal,
  testEmail,
  emailIsValid,
  getRandomPassword,
  getRandomPasswordEncrypted,
};
