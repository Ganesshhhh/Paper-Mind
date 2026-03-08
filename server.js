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

/* ==============================
   Health Check
============================== */

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    model: "llama-3.1-8b-instant"
  });
});

/* ==============================
   Chat Endpoint
============================== */

app.post("/api/chat", async (req, res) => {
  try {

    console.log("Incoming request body:", req.body);

    const { messages, documents } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: "messages array required"
      });
    }

    /* ==============================
       Combine Document Context
    ============================== */

    let docContext = "";

    if (Array.isArray(documents) && documents.length > 0) {

      console.log("Documents received:", documents.length);

      docContext = documents
        .map((doc, index) => `Document ${index + 1}:\n${doc.content}`)
        .join("\n\n");

    } else {

      console.log("No documents received");

    }

    /* ==============================
       Latest user question
    ============================== */

    const question =
      messages[messages.length - 1]?.content || "No question provided";

    /* ==============================
       Prompt construction
    ============================== */

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

    /* ==============================
       Groq API Call
    ============================== */

    const groqResponse = await fetch(
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
          temperature: 0.2,
          max_tokens: 1024
        })
      }
    );

    const data = await groqResponse.json();

    if (!groqResponse.ok) {

      console.error("Groq API Error:", data);

      return res.status(500).json({
        error: "Groq API request failed",
        details: data
      });

    }

    const aiText =
      data?.choices?.[0]?.message?.content ||
      "No response generated";

    /* ==============================
       Send response
    ============================== */

    res.json({
      content: [
        {
          text: aiText
        }
      ]
    });

  } catch (error) {

    console.error("Server error:", error);

    res.status(500).json({
      error: "Internal server error"
    });

  }
});

/* ==============================
   Serve frontend
============================== */

app.get("*", (req, res) => {
  res.sendFile(path.resolve("public/index.html"));
});

/* ==============================
   Start Server
============================== */

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
