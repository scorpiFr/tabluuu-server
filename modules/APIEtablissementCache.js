const FileCache = require("./FileCache");

class APIEtablissementCache {
  constructor() {
    if (APIEtablissementCache.instance) {
      return APIEtablissementCache.instance;
    }
    APIEtablissementCache.instance = this;
    this.fileCache = new FileCache();
    this.cacheVarNamePrefix = "tabluuuserver:frontApi";
  }

  getCacheVarName(etablissementId) {
    return this.cacheVarNamePrefix + ":" + etablissementId;
  }
  set(etablissementId, jsonvalue) {
    // verif
    if (!etablissementId) {
      return;
    }
    const cacheVarName = this.getCacheVarName(etablissementId);
    // action
    this.fileCache.set(cacheVarName, jsonvalue);
  }

  get(etablissementId) {
    // verif
    if (!etablissementId) {
      return null;
    }
    const cacheVarName = this.getCacheVarName(etablissementId);
    // action
    const res = this.fileCache.get(cacheVarName);
    // return
    return res;
  }
}

function getEtablissementCache(etablissementId) {
  const frontCache = new APIEtablissementCache();
  return frontCache.get(etablissementId);
}

function setEtablissementCache(etablissementId, value) {
  const frontCache = new APIEtablissementCache();
  return frontCache.set(etablissementId, value);
}

function emtyEtablissementCache(etablissementId) {
  const frontCache = new APIEtablissementCache();
  return frontCache.set(etablissementId, null);
}

module.exports = {
  APIEtablissementCache,
  getEtablissementCache,
  setEtablissementCache,
  emtyEtablissementCache,
};
