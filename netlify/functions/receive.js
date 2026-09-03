exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method not allowed"
    };
  }

  try {
    const { type, filename, data } = JSON.parse(event.body || "{}");

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return {
        statusCode: 500,
        body: "Telegram settings missing"
      };
    }

    if (!data || !data.includes(",")) {
      return {
        statusCode: 400,
        body: "Invalid file"
      };
    }

    const base64 = data.split(",")[1];
    const buffer = Buffer.from(base64, "base64");

    // Keep uploads small enough for serverless requests.
    if (buffer.length > 4500000) {
      return {
        statusCode: 413,
        body: "File too large"
      };
    }

    const mime =
      type === "photo"
        ? "image/jpeg"
        : "audio/webm";

    const form = new FormData();

    form.append("chat_id", chatId);

    form.append(
      type === "photo" ? "photo" : "document",
      new Blob([buffer], { type: mime }),
      filename || (type === "photo"
        ? "Riddhi-selfie.jpg"
        : "Riddhi-voice-note.webm")
    );

    const telegramMethod =
      type === "photo"
        ? "sendPhoto"
        : "sendDocument";

    const response = await fetch(
      `https://api.telegram.org/bot${token}/${telegramMethod}`,
      {
        method: "POST",
        body: form
      }
    );

    const result = await response.text();

    return {
      statusCode: response.ok ? 200 : 502,
      headers: {
        "Content-Type": "application/json"
      },
      body: result
    };

  } catch (error) {

    return {
      statusCode: 500,
      body: "Upload failed"
    };

  }
};
