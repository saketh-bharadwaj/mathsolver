import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";

import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

import { extractTextFromImage } from "./ocr/geminiOCR.js";
import connectDB from "./config/mongoDB.js";

// Auth & Routing Imports

import userSignup from "./routes/userSignup.js";
import userSignin from "./routes/userSignin.js";

dotenv.config();

// Initialize express and connect DB
const app = express();
connectDB();

// Middleware
app.use(express.json());
app.use(cors({ origin: "*", methods: ["GET", "POST"], credentials: true }));

// Routes

app.use("/user", userSignup);
app.use("/user", userSignin);


// Create HTTP server and Socket.IO
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["*"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Socket.IO Middleware: JWT Auth
io.use((socket, next) => {
  const token =
    socket.handshake.auth.token || socket.handshake.headers["token"];

  if (!token) return next(new Error("Authentication token missing"));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Make sure you define JWT_SECRET in .env
    socket.user = decoded; // Attach user data to socket
    next();
  } catch (err) {
    return next(new Error("Authentication failed"));
  }
});

// Azure Inference setup
const token = process.env.GITHUB_TOKEN;
const endpoint = "https://models.inference.ai.azure.com";
const modelName = "Meta-Llama-3.1-8B-Instruct";

if (!token) {
  console.error("❌ Missing GITHUB_TOKEN in .env file!");
  process.exit(1);
}

// Socket.IO Connection Logic
io.on("connection", (socket) => {
  console.log(`🔌 User connected: ${socket.id}, user:`, socket.user);

  const messages = [{ role: "system", content: "You are a helpful assistant." }];

  socket.on("user_message", async (data) => {
    try {
      // OCR Flow
      if (data.type === "image" && data.base64) {
        const base64Data = data.base64.replace(/^data:image\/\w+;base64,/, "");
        const tempDir = "./temp";
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
        const tempFilePath = path.join(tempDir, `${uuidv4()}.png`);
        fs.writeFileSync(tempFilePath, base64Data, "base64");

        const extractedText = await extractTextFromImage(tempFilePath);
        console.log(`📄 OCR Extracted: ${extractedText}`);
        messages.push({ role: "user", content: extractedText });
      } else if (data.type === "text") {
        messages.push({ role: "user", content: data.text });
        console.log(`📩 Text Received: ${data.text}`);
      } else {
        socket.emit("bot_response", "⚠️ Invalid message type.");
        return;
      }

      const client = ModelClient(endpoint, new AzureKeyCredential(token));
      const response = await client.path("/chat/completions").post({
        body: {
          messages,
          model: modelName,
          max_tokens: 2048,
          temperature: 0.7,
        },
      });

      if (isUnexpected(response)) throw response.body.error;

      const botMessage =
        response.body.choices[0]?.message?.content || "⚠️ Sorry, no response.";
      messages.push({ role: "assistant", content: botMessage });
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

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
