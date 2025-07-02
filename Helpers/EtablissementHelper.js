const crypto = require("crypto");
require("dotenv").config();

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

module.exports = { encryptPassword, createSecretKey, removeSecretInformations };
