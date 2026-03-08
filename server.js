import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import Tesseract from "tesseract.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.static("public"));

/* Health check */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", model: "llama-3.1-8b-instant" });
});

/* Document extraction */
async function extractText(doc) {
  const { type, contentBase64 } = doc;
  const buffer = Buffer.from(contentBase64, "base64");

  try {
    if (type === "pdf") {
      const data = await pdfParse(buffer);
      return data.text || "";
    }
    if (type === "word") {
      const { value } = await mammoth.extractRawText({ buffer });
      return value || "";
    }
    if (type === "image") {
      const { data: { text } } = await Tesseract.recognize(buffer, "eng");
      return text || "";
    }
    if (type === "text") {
      return buffer.toString("utf-8");
    }
    return "";
  } catch (err) {
    console.error(`Error extracting ${type}:`, err);
    return "";
  }
}

/* Chat endpoint */
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, documents } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array required" });
    }

    console.log("Documents received:", documents?.length || 0);

    // Extract all documents
    const docTexts = documents?.length
      ? await Promise.all(documents.map(extractText))
      : [];

    const docContext = docTexts
      .map((text, i) => `Document ${i + 1}:\n${text}`)
      .join("\n\n");

    const question = messages[messages.length - 1]?.content || "No question provided";

    const prompt = `
You are an AI assistant.

Use the provided DOCUMENTS to answer the QUESTION.

If the answer is not in the documents, say:
"I couldn't find that information in the provided documents."

DOCUMENTS:
${docContext}

QUESTION:
${question}
`;

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
          max_tokens: 1024,
        }),
      }
    );

    const data = await groqResponse.json();
    const aiText =
      data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || "No response generated";

    res.json({ content: [{ text: aiText }] });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* Serve frontend */
app.get("*", (req, res) => {
  res.sendFile(path.resolve("public/index.html"));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
