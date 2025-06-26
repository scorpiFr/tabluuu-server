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

module.exports = { encryptPassword, createSecretKey };
