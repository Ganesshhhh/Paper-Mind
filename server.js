import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/*
Health Check
*/
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    model: "gemini-2.0-flash"
  });
});

/*
Chat Endpoint
*/
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages must be an array" });
    }

    // Convert messages to a single prompt
    const prompt = messages.map(m => m.content).join("\n");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API Error:", data);
      return res.status(500).json({ error: "Gemini API request failed" });
    }

    const aiText =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response generated";

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

/*
Serve Frontend
*/
app.get("*", (req, res) => {
  res.sendFile(path.resolve("public/index.html"));
});

/*
Start Server
*/
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
