import mongoose from 'mongoose';
import ChatMessageSchema from './ChatMessage.js';

const ChatConversationSchema = new mongoose.Schema({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	chatId: {
		type: String,
		required: true,
		unique: true // Ensures no two chats have the same chatId
	},
	title: {
		type: String,
		default: 'Untitled Chat'
	},
	messages: [ChatMessageSchema],
	isPinned: {
		type: Boolean,
		default: false
	}
}, {
	timestamps: true
});

const Chat = mongoose.model('Chat', ChatConversationSchema);
export default Chat;
