"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { X, MessageCircle, MapPin, Calendar } from "lucide-react";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import { Message } from "@/types/messaging";
import {
  getOrCreateConversation,
  sendMessage,
  subscribeToMessages,
  markMessagesAsRead,
} from "@/utils/messaging-service";
import { toast } from "sonner";

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar?: string;
  rideId: string;
  rideInfo?: {
    departure: string;
    arrival: string;
    date: string;
  };
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  isOpen,
  onClose,
  otherUserId,
  otherUserName,
  otherUserAvatar,
  rideId,
  rideInfo,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isOpen || !user?.uid) return;

    const initializeConversation = async () => {
      try {
        setLoading(true);

        const conversationIdResult = await getOrCreateConversation(
          user.uid,
          otherUserId,
          rideId
        );
        
        setConversationId(conversationIdResult);
      } catch (error) {
        console.error("Erreur lors de l'initialisation de la conversation:", error);
        toast.error("Impossible d'ouvrir le chat");
      } finally {
        setLoading(false);
      }
    };

    initializeConversation();
  }, [isOpen, user?.uid, otherUserId, rideId]);

  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = subscribeToMessages(conversationId, (newMessages) => {
      setMessages(newMessages);

      if (isOpen && user?.uid) {
        markMessagesAsRead(conversationId, user.uid);
      }
    });

    return () => unsubscribe();
  }, [conversationId, isOpen, user?.uid]);

  const handleSendMessage = async (content: string) => {
    if (!conversationId || !user?.uid) return;

    try {
      await sendMessage({
        conversationId,
        senderId: user.uid,
        senderName: user.fullName || "Utilisateur",
        content,
        type: "text",
      });
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
      toast.error("Impossible d'envoyer le message");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md h-[600px] flex flex-col p-0">
        <DialogHeader className="p-4 border-b flex-shrink-0 bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-white shadow">
                <AvatarImage src={otherUserAvatar || ""} alt={otherUserName} />
                <AvatarFallback className="bg-blue-500 text-white font-semibold">
                  {otherUserName?.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <DialogTitle className="text-lg flex items-center gap-2">
                  {otherUserName}
                  <Badge variant="secondary" className="text-xs">
                    <MessageCircle className="h-3 w-3 mr-1" />
                    Chat
                  </Badge>
                </DialogTitle>
                {rideInfo && (
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate max-w-[200px]">
                        {rideInfo.departure} → {rideInfo.arrival}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{rideInfo.date}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-white/50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="flex flex-col items-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <div className="text-gray-500 text-sm">Chargement...</div>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <div className="text-center text-gray-500 space-y-3">
                <div className="bg-white rounded-full p-4 w-16 h-16 mx-auto flex items-center justify-center shadow-sm">
                  <MessageCircle className="h-8 w-8 text-blue-400" />
                </div>
                <div>
                  <p className="font-medium">Aucun message pour le moment</p>
                  <p className="text-sm">Commencez la conversation !</p>
                </div>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwnMessage={message.senderId === user?.uid}
                senderAvatar={
                  message.senderId === user?.uid ? (user as any)?.profilePicture : otherUserAvatar
                }
                showReadStatus={true}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={loading || !conversationId}
          placeholder={`Écrivez à ${otherUserName}...`}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ChatWindow;
