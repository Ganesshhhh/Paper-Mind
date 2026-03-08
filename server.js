import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.static("public"));

const GROQ_API_KEY = process.env.GROQ_API_KEY;

/* Health check */
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    model: "llama-3.1-8b-instant"
  });
});

/* Chat endpoint with document context */
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, documents } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages must be an array" });
    }

    // Combine uploaded document text
    const docContext = Array.isArray(documents)
      ? documents.map(doc => doc.content).join("\n\n")
      : "";

    // Latest user question
    const question = messages[messages.length - 1]?.content || "";

    // Build prompt
    const prompt = `
You are an AI assistant that answers questions based on company documents.

DOCUMENTS:
${docContext}

QUESTION:
${question}

Answer clearly using the documents when relevant.
If the answer is not in the documents, say you don't know.
`;

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.3
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq API Error:", data);
      return res.status(500).json({ error: "Groq API request failed" });
    }

    const aiText =
      data.choices?.[0]?.message?.content || "No response generated";

    res.json({
      content: [
        {
          text: aiText
        }
      ]
    });

  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/* Serve frontend */
app.get("*", (req, res) => {
  res.sendFile(path.resolve("public/index.html"));
});

/* Start server */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
