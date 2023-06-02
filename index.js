const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

/*
 * these variables will come from a .env file
 */
const PORT = 1337;
const VERIFY_TOKEN = "laksdjfklasjfklasj";
const WA_ACCESS_TOKEN =
  "EAAKbDcRaqHUBAANv3sw3YcBhQsTP0lNYkyOmAFUfGTnf9rqW4n4pXytTLsehSYnSHfXidXv7GmGwLbCmPwQQmVIi5binYfE6GYqVUEvPcdZCkhFET03bl3w3hzuBtS4qBgZBfUGj51XvQNsLRrZBRaCXuYSHHDDc5KqqOKIHOcQlE07BFlsxDIJnkKtJ8kfP4bqdTzZAIwZDZD";

// this data will be stored in a db
const botIdentifiers = [
  {
    phoneNoId: "108443718619194",
    message: "This is a test message from whatsapp bot server",
  },
];

const app = express();

app.use(bodyParser.json());

app.post("/webhook/whatsapp", (req, res) => {
  const { body } = req;

  console.log({ response: JSON.stringify(body) });
  const isFromBusinessAccount = body.object === "whatsapp_business_account";
  if (!isFromBusinessAccount) {
    res.sendStatus(404);
  }

  body.entry.forEach(async (entry) => {
    const webhookEvent = entry.changes[0];
    const { messages, metadata } = webhookEvent.value;
    const userNumber = messages?.[0].from;
    const botData = botIdentifiers.find(
      (data) => data.phoneNoId === metadata.phone_number_id
    );

    if (botData && messages) {
      const url = `https://graph.facebook.com/v15.0/${botData.phoneNoId}/messages`;
      const data = {
        messaging_product: "whatsapp",
        to: userNumber,
        type: "text",
        text: {
          preview_url: false,
          body: botData.message,
        },
      };

      await axios.post(url, data, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${WA_ACCESS_TOKEN}`,
        },
      });
    }
  });

  res.status(200).send("EVENT_RECEIVED");
});

app.get("/webhook/whatsapp", (req, res) => {
  // Parse the query params
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Checks the mode and token sent is correct
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      // Responds with the challenge token from the request
      /* eslint-disable-next-line no-console */
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
