import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { extractTextFromImage } from "./ocr/geminiOCR.js";

dotenv.config();

const app = express();
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  credentials: true
}));

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["*"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error("❌ Missing GITHUB_TOKEN in .env file!");
  process.exit(1);
}

const endpoint = "https://models.inference.ai.azure.com";
const modelName = "Meta-Llama-3.1-8B-Instruct";

io.on("connection", (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  const messages = [{ role: "system", content: "You are a helpful assistant." }];

  socket.on("user_message", async (data) => {
    try {
      // If it's an image
      if (data.type === "image" && data.base64) {
        const base64Data = data.base64.replace(/^data:image\/\w+;base64,/, "");
        const tempDir = "./temp";
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

        const tempFilePath = path.join(tempDir, `${uuidv4()}.png`);
        fs.writeFileSync(tempFilePath, base64Data, "base64");

        // OCR Step
        const extractedText = await extractTextFromImage(tempFilePath);
        console.log(`📄 OCR Extracted: ${extractedText}`);

        messages.push({ role: "user", content: extractedText });

      } else if (data.type === "text") {
        messages.push({ role: "user", content: data.text });
        console.log(data.text);
      } else {
        socket.emit("bot_response", "⚠️ Invalid message type.");
        return;
      }

      // LLaMA Response
      const client = ModelClient(endpoint, new AzureKeyCredential(token));
      const response = await client.path("/chat/completions").post({
          body: {
            messages,
            model: modelName,
            max_tokens: 2048,
            temperature: 0.7
          }
        });


      if (isUnexpected(response)) {
        throw response.body.error;
      }

      const botMessage = response.body.choices[0]?.message?.content || "⚠️ Sorry, I have no response.";
      messages.push({ role: "assistant", content: botMessage });
      console.log(botMessage)
      socket.emit("bot_response", botMessage);

    } catch (err) {
      console.error("❌ Error:", err);
      socket.emit("bot_response", "⚠️ Error occurred during processing.");
    }
  });

  socket.on("disconnect", () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
  });
});

server.listen(5000, () => {
  console.log("🚀 Server running on port 5000");
});
