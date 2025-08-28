import { Timestamp } from "firebase/firestore";

export interface Conversation {
  id: string;
  participants: string[]; 
  rideId: string;
  lastMessage?: string;
  lastMessageTime?: Timestamp;
  unreadCount: { [userId: string]: number };
  createdAt: Timestamp;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Timestamp;
  type: 'text' | 'system';
  readBy: string[];
}

export interface MessageInput {
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'system';
}
