// routes/chat.js
import express from "express";
import ChatConversation from "../models/ChatConversation.js";
import userAuth from "../middlewares/userauth.js";

const router = express.Router();

router.get("/chatsync", userAuth, async (req, res) => {
	try {
		const userId = req.userId;

		if (!userId) {
			return res.status(401).json({ error: "Unauthorized" });
		}

		const rawChats = await ChatConversation.find({ userId }).lean();

		const chats = rawChats.map(chat => ({
			id: chat.chatId,
			userId: chat.userId,
			title: chat.title,
			messages: chat.messages,
			isPinned: chat.isPinned
		}));

		return res.json({ chats });
	} catch (err) {
		console.error("Error in /chatsync:", err);
		res.status(500).json({ error: "Internal server error" });
	}
});

router.post("/changeTitle", userAuth, async (req, res) => {
	try {
        console.log("reached this endpoint")
		const userId = req.userId;
		const chatId = req.headers.chatid;
		const { title } = req.body;
        console.log(title)

		if (!chatId || !title) return res.status(400).json({ error: "Missing chatId or title" });

		const chat = await ChatConversation.findOne({ chatId});
		if (!chat) return res.status(404).json({ error: "Chat not found" });

		chat.title = title;
		await chat.save();

		res.json({ success: true, title: chat.title });
	} catch (err) {
		console.error("Error in /changeTitle:", err);
		res.status(500).json({ error: "Internal server error" });
	}
});

router.post("/updatePin", userAuth, async (req, res) => {
	try {
		const userId = req.userId;
		const chatId = req.headers.chatid;

		if (!chatId) return res.status(400).json({ error: "Missing chatId" });

		const chat = await ChatConversation.findOne({ chatId });
		if (!chat) return res.status(404).json({ error: "Chat not found" });

		chat.isPinned = !chat.isPinned;
		await chat.save();

		res.json({ success: true, isPinned: chat.isPinned });
	} catch (err) {
		console.error("Error in /updatePin:", err);
		res.status(500).json({ error: "Internal server error" });
	}
});

router.post("/deleteChat", userAuth, async (req, res) => {
	try {
		const userId = req.userId;
		const chatId = req.headers.chatid;

		if (!chatId) return res.status(400).json({ error: "Missing chatId" });

		const chat = await ChatConversation.findOne({ chatId });
		if (!chat) return res.status(404).json({ error: "Chat not found" });

		await chat.deleteOne();

		res.json({ success: true });
	} catch (err) {
		console.error("Error in /deleteChat:", err);
		res.status(500).json({ error: "Internal server error" });
	}
});

export default router;
