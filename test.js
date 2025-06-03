import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import { uploadToCloudinary } from "./middlewares/uploadToCloudinary.js";
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

import { extractTextFromImage } from "./ocr/geminiOCR.js";
import connectDB from "./config/mongoDB.js";

// Mongoose models
import ChatConversation from "./models/ChatConversation.js";

dotenv.config();

const app = express();
connectDB();

app.use(express.json());
app.use(cors({ origin: "*", methods: ["GET", "POST"], credentials: true }));

// Routes
import userSignup from "./routes/userSignup.js";
import userSignin from "./routes/userSignin.js";
import chatRoutes from "./routes/chatFetch.js"


app.use("/user", userSignup);
app.use("/user", userSignin);
app.use("/user", chatRoutes)

// HTTP & WebSocket setup
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

// JWT Auth middleware for WebSocket
io.use((socket, next) => {
  //console.log("token from header: ",socket.handshake.headers["token"])
	const token = socket.handshake.headers["token"];
 // console.log("token received from query: ",token)
	if (!token) return next(new Error("Token not found in headers"));
	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		socket.userId = decoded.id;
		next();
	} catch (err) {
		next(new Error("Invalid token"));
	}
});

// Azure setup
const azureToken = process.env.GITHUB_TOKEN;
const endpoint = "https://models.inference.ai.azure.com";
const modelName = "Meta-Llama-3.1-8B-Instruct";
if (!azureToken) {
	console.error("Missing GITHUB_TOKEN in .env");
	process.exit(1);
}

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}, userId: ${socket.userId}`);

  socket.on("user_message", async (data) => {
    try {
      const userId = socket.userId;
      let chatId = socket.handshake.query.chatId;
      //console.log("ChatId from query : ",chatId)
      //console.log("chatId from headers: ", socket.handshake.headers["chatId"])

      let conversation;

      // Find conversation by chatId (not _id) and userId
      if (chatId) {
        conversation = await ChatConversation.findOne({ chatId, userId });
      }

      // If not found, create new conversation with given chatId (or generate if missing)
      if (!conversation) {
        if (!chatId) {
          chatId = uuidv4(); // generate new chatId if missing
        }
        conversation = new ChatConversation({
          userId,
          chatId,
          title: "New Chat",
          messages: [],
          isPinned: false,
        });
        await conversation.save();
        console.log("New conversation created with chatId:", chatId);
      }

      const messages = [{ role: "system", content: "You are a helpful assistant." }];
      conversation.messages.forEach((m) => {
        messages.push({
          role: m.fromUser ? "user" : "assistant",
          content: m.content,
        });
      });

      // Handle image with OCR
      if (data.type === "image" && data.base64) {
        const base64Data = data.base64.replace(/^data:image\/\w+;base64,/, "");
        const tempDir = "./temp";
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
        const tempFilePath = path.join(tempDir, `${uuidv4()}.png`);
        fs.writeFileSync(tempFilePath, base64Data, "base64");

        const cloudinaryUrl = await uploadToCloudinary(tempFilePath);

        const extractedText = await extractTextFromImage(tempFilePath);

        messages.push({ role: "user", content: extractedText || "[Image received]" });

        conversation.messages.push({ type: "image-base64", content: data.base64, fromUser: true });

        if (cloudinaryUrl) {
          conversation.messages.push({ type: "image", content: cloudinaryUrl, fromUser: true });
        }

        if (extractedText) {
          conversation.messages.push({ type: "image-text", content: extractedText, fromUser: true });
        }
      }
      // Handle text message
      else if (data.type === "text") {
        messages.push({ role: "user", content: data.text });
        conversation.messages.push({ type: "text", content: data.text, fromUser: true });
      }
      // Invalid message type
      else {
        socket.emit("bot_response",  "Invalid message type." );
        return;
      }

      // Call Azure AI model
      const client = ModelClient(endpoint, new AzureKeyCredential(azureToken));
      const response = await client.path("/chat/completions").post({
        body: {
          messages,
          model: modelName,
          max_tokens: 2048,
          temperature: 0.7,
        },
      });

      if (isUnexpected(response)) throw response.body.error;

      const botMessage = response.body.choices[0]?.message?.content || "No response.";

      conversation.messages.push({ type: "text", content: botMessage, fromUser: false });
      await conversation.save();

      socket.emit("bot_response", botMessage);

    } catch (err) {
      console.error("Error:", err);
      socket.emit("bot_response", "Error occurred during processing." );
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});


// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
