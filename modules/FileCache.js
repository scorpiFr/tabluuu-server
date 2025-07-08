require("dotenv").config();
const crypto = require("crypto");
const fs = require("fs");

class FileCache {
  constructor() {
    if (FileCache.instance) {
      return FileCache.instance;
    }
    FileCache.instance = this;
    this.absoluteCachePath = process.env.CACHEFILE_PATH + "/";
  }

  getFilepath(cacheVarName) {
    let hash = crypto.createHash("md5").update("some_string").digest("hex");
    return this.absoluteCachePath + hash + ".txt";
  }

  set(cacheVarName, value) {
    // verif
    if (value === null) {
      return this.empty(cacheVarName);
    }
    // init
    const filePath = this.getFilepath(cacheVarName);
    const valueJson = JSON.stringify(value);
    // action
    fs.writeFile(filePath, valueJson, "utf8", (err) => {
      if (err) {
        console.error("Erreur lors de l'écriture :", err);
      }
    });
  }

  empty(cacheVarName) {
    const filePath = this.getFilepath(cacheVarName);
    if (!fs.existsSync(filePath)) {
      return;
    }
    fs.unlinkSync(filePath);
  }

  get(cacheVarName) {
    const filePath = this.getFilepath(cacheVarName);
    let content = null;

    if (fs.existsSync(filePath)) {
      content = fs.readFileSync(filePath, "utf8");
      content = content.length > 0 ? JSON.parse(content) : null;
    }
    return content;
  }
}

module.exports = FileCache;
