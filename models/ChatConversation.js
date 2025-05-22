
import mongoose from 'mongoose';
import ChatMessageSchema from './ChatMessage.js';

const ChatConversationSchema = new mongoose.Schema({
	title: {
		type: String,
		required: true
	},
	messages: {
		type: [ChatMessageSchema],
		default: []
	},
	isPinned: {
		type: Boolean,
		default: false
	}
}, { timestamps: true });

const ChatConversation = mongoose.model('ChatConversation', ChatConversationSchema);
export default ChatConversation;
