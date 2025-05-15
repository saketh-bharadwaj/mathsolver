import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import dotenv from "dotenv";

dotenv.config(); // Ensure .env variables are loaded before use

const app = express();
// Add this to your server.js
//app.use(express.static('public'));

// Create a public folder and put your HTML file there
// renamed to index.html
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
  console.error(" Missing GITHUB_TOKEN in .env file!");
  process.exit(1); // Stop execution if no token
}

const endpoint = "https://models.inference.ai.azure.com";
const modelName = "Meta-Llama-3.1-8B-Instruct";

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  const messages = [{ role: "system", content: "You are a helpful assistant." }];

  socket.on("user_message", async (userMessage) => {
    console.log(`User: ${userMessage}`);
    
    messages.push({ role: "user", content: userMessage });

    try {
      const client = ModelClient(endpoint, new AzureKeyCredential(token));
      const response = await client.path("/chat/completions").post({
        body: { messages, model: modelName },
      });
      console.log(response);

      if (isUnexpected(response)) {
        throw response.body.error;
      }

      const botMessage = response.body.choices[0]?.message?.content || "Sorry, I have no response.";
      console.log(`🤖 Bot: ${botMessage}`);
      
      messages.push({ role: "assistant", content: botMessage });

      socket.emit("bot_response", botMessage);
    } catch (err) {
      console.error(" Error:", err);
      socket.emit("bot_response", "⚠️ Sorry, an error occurred.");
    }
  });

  socket.on("disconnect", () => {
    console.log(` User disconnected: ${socket.id}`);
  });
});

server.listen(5000, () => {
  console.log("🚀 Server is running on port 5000");
});
