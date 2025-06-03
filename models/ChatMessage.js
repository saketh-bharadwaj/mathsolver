// models/ChatMessage.js
import mongoose from 'mongoose';

const ChatMessageSchema = new mongoose.Schema({
	type: {
		type: String,
		enum: ['text', 'image','image-text','image-base64'],
		required: true
	},
	content: {
		type: String,
		required: true
	},
	fromUser: {
		type: Boolean,
		required: true
	}
}, { _id: false }); // No individual _id for embedded messages

export default ChatMessageSchema;
