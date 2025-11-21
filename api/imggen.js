// ================ CONFIG ==================
const YOUR_API_KEYS = ["SPLEXXO"]; // tumhara private key
const TARGET_API_BASE =
  "https://botfather.cloud/Apis/ImgGen/client.php"; // original text->image API
// ==========================================

module.exports = async (req, res) => {
  // CORS + JSON default
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method !== "GET") {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(405).json({ error: "method not allowed" });
  }

  const {
    text: rawText,
    inputText: rawInputText,
    prompt: rawPrompt,
    key: rawKey,
  } = req.query || {};

  // Text ko 3 naam se support karein: text / inputText / prompt
  const text = (rawText || rawInputText || rawPrompt || "").trim();
  const key = (rawKey || "").trim();

  if (!text || !key) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res
      .status(400)
      .json({ error: "missing parameters: text/inputText/prompt or key" });
  }

  // API key check
  if (!YOUR_API_KEYS.includes(key)) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(403).json({ error: "invalid key" });
  }

  // Upstream URL build
  const url =
    TARGET_API_BASE + "?inputText=" + encodeURIComponent(text);

  try {
    const upstream = await fetch(url);

    // Agar upstream fail ho gaya
    if (!upstream.ok) {
      const bodyText = await upstream.text().catch(() => "");
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.status(502).json({
        error: "upstream API failed",
        status: upstream.status,
        details: bodyText || "no body",
      });
    }

    // Upstream ka content-type as-is copy
    const contentType =
      upstream.headers.get("content-type") || "application/octet-stream";
    res.setHeader("Content-Type", contentType);

    // Apna branding header (body ko touch nahi karenge, taki image break na ho)
    res.setHeader("X-Developer", "splexxo");
    res.setHeader("X-Credit-By", "splexx");
    res.setHeader("X-Powered-By", "splexxo ImgGen Proxy");

    // Binary / image / JSON jo bhi ho, as-is forward kar do
    const arrayBuffer = await upstream.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return res.status(200).send(buffer);
  } catch (err) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(502).json({
      error: "upstream request error",
      details: err.message || "unknown error",
    });
  }
};
