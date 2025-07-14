const axios = require("axios");
require("dotenv").config();
const FileCache = require("../modules/FileCache.js");

const PAYPAL_API_URL_BASE = "https://api-m.paypal.com"; // Sandbox (change en prod)
const paypalAppId = process.env.PAYPAL_APP_ID;
const paypalAppSecret = process.env.PAYPAL_APP_SECRET;
const paypalTokenUrl = PAYPAL_API_URL_BASE + "/v1/oauth2/token";
const paypalReadOrderUrl =
  PAYPAL_API_URL_BASE + "/v2/checkout/orders/<commandId>";
const paypalCheckOrderUrl =
  PAYPAL_API_URL_BASE + "/v2/checkout/orders/<commandId>";
const paypalCreateOrderUrl = PAYPAL_API_URL_BASE + "/v2/checkout/orders";
const paypalCapturePaymentUrl =
  PAYPAL_API_URL_BASE + "/v2/checkout/orders/<commandId>/capture";

const paypalUserSuccessUrl = "https://admin.tabluuu.fr/paypal-success";
const paypalUserCancelUrl = "https://admin.tabluuu.fr/paypal-cancel";

async function capturePayment(token, commandId) {
  // init
  const url = paypalCapturePaymentUrl.replace("<commandId>", commandId);
  let paymentId = "";
  let paymentDate = "";
  let buyerEmail = "";
  let buyerId = "";
  const body = {};
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  try {
    const res = await axios.post(url, body, {
      headers,
    });
    paymentId = res.data.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? "";
    paymentDate =
      res.data.purchase_units?.[0]?.payments?.captures?.[0]?.create_time ?? "";
    buyerEmail = res.data.payer?.email_address ?? "";
    buyerId = res.data.payer?.payer_id ?? "";
    return { paymentId, paymentDate, buyerId, buyerEmail };
  } catch (error) {
    if (error.response) {
      // La requête a été faite, le serveur a répondu avec un statut d’erreur
      console.error("Erreur HTTP :", error.response.status);
      console.error("URL :", url);
      console.error("Message :", error.response.statusText);
      // console.error("Contenu :", error.response.data);
    } else if (error.request) {
      // Requête envoyée mais pas de réponse reçue
      console.error("Pas de réponse reçue :", error.request);
    }
  }
  return { paymentId, paymentDate, buyerId, buyerEmail };
}

async function checkPaypalOrder(paypal_order_id) {
  let paypal_order_status = "";
  let returnData = {
    paypal_order_status,
    paypal_payment_id: "",
    paypal_payer_id: "",
    paypal_payer_email: "",
    paypal_date_payment: "",
  };

  // verif
  if (!paypal_order_id.length) {
    return returnData;
  }
  // init
  const token = await getPayPalAccessToken();
  const url = paypalCheckOrderUrl.replace("<commandId>", paypal_order_id);
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
  try {
    // action
    const res = await axios.get(url, {
      headers,
    });
    paypal_order_status = res.data.status;
    // status created
    if (paypal_order_status === "CREATED") {
      return returnData;
    }

    // status COMPLETED (paid)
    if (
      paypal_order_status === "COMPLETED" ||
      paypal_order_status === "APPROVED"
    ) {
      const res = await capturePayment(token, paypal_order_id);
      return {
        paypal_order_status: "COMPLETED",
        paypal_payment_id: res.paymentId,
        paypal_payer_id: res.buyerId,
        paypal_payer_email: res.buyerEmail,
        paypal_date_payment: res.paymentDate,
      };
    }

    // other statuses
    return returnData;
  } catch (error) {
    if (error.response) {
      // order not found
      if (error.response.status == 404) {
        return returnData;
      }
      // La requête a été faite, le serveur a répondu avec un statut d’erreur
      console.error("Erreur HTTP :", error.response.status);
      console.error("URL :", url);
      console.error("Message :", error.response.statusText);
      // console.error("Contenu :", error.response.data);
    } else if (error.request) {
      // Requête envoyée mais pas de réponse reçue
      console.error("Pas de réponse reçue :", error.request);
    }
  }
  return returnData;
}

async function createPaypalOrder(amount = "10.00", currency = "EUR") {
  let id = 0;
  let approveLink = "";
  const token = await getPayPalAccessToken();
  const body = {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: { currency_code: currency, value: amount },
      },
    ],
    application_context: {
      return_url: paypalUserSuccessUrl,
      cancel_url: paypalUserCancelUrl,
    },
  };
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  try {
    const res = await axios.post(paypalCreateOrderUrl, body, {
      headers,
    });
    id = res.data.id;
    const links = res.data.links;
    approveLink = links.find((l) => l.rel === "approve")?.href;
    return { id, approveLink };
  } catch (error) {
    if (error.response) {
      // La requête a été faite, le serveur a répondu avec un statut d’erreur
      console.error("Erreur HTTP :", error.response.status);
      console.error("Message :", error.response.statusText);
      // console.error("Contenu :", error.response.data);
    } else if (error.request) {
      // Requête envoyée mais pas de réponse reçue
      console.error("Pas de réponse reçue :", error.request);
    }
  }
  return { id, approveLink };
}

async function getPayPalAccessToken() {
  // init
  const fileCache = new FileCache();
  const cacheVarName = "paypalToken";
  const now = Date.now();
  let accessToken = null;
  let tokenExpiration = null;

  // get from cache
  const cacheValue = fileCache.get(cacheVarName);
  if (cacheValue) {
    accessToken = cacheValue.accessToken;
    tokenExpiration = cacheValue.tokenExpiration;
  }
  if (accessToken && tokenExpiration && now < tokenExpiration) {
    return accessToken;
  }

  try {
    // Redemander un nouveau token
    const res = await axios.post(
      paypalTokenUrl,
      "grant_type=client_credentials",
      {
        auth: {
          username: paypalAppId,
          password: paypalAppSecret,
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    accessToken = res.data.access_token;
    tokenExpiration = now + res.data.expires_in * 1000;

    fileCache.set(cacheVarName, { accessToken, tokenExpiration });
    return accessToken;
  } catch (err) {
    console.log(err);
  }

  return null;
}

module.exports = {
  paypalReadOrderUrl,
  getPayPalAccessToken,
  createPaypalOrder,
  checkPaypalOrder,
};
