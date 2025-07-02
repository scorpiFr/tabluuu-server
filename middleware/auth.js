const { Session } = require("../models");

// verify if your session token exists and is valid.
module.exports = async (req, res, next) => {
  try {
    // get token
    const token = req.headers.authorization;
    if (!token) {
      res
        .status(401)
        .json({ error: "Missing or invalid authentication token" });
      return res;
    }

    // get token from db
    const sess = await Session.findOne({
      where: {
        token: token,
      },
    });
    if (!sess) {
      res
        .status(401)
        .json({ error: "Missing or invalid authentication token" });
      return res;
    }

    // max_timestamp verify
    const dateFromTimestamp = new Date(sess.max_timestamp); // session max time
    const now = new Date(); // actual time
    if (dateFromTimestamp < now) {
      res.status(401).json({ error: "Timestamp outdated" });
      return res;
    }

    // maxtimestamp update
    now.setHours(now.getHours() + 2); // ajoute 2 heures
    sess.max_timestamp = now.toISOString();
    const updated = await sess.update(sess, {
      where: { id: sess.id },
    });

    // add session to request
    req.Session = sess;
    // return
    next();
  } catch (error) {
    res.status(401).json({ error });
  }
};
