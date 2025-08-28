"use client";

import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Message } from "@/types/messaging";
import { Check, CheckCheck } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  senderAvatar?: string;
  showReadStatus?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  senderAvatar,
  showReadStatus = true,
}) => {
  const isRead = message.readBy?.length > 1; 

  return (
    <div className={`flex gap-2 mb-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}>
      {!isOwnMessage && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={senderAvatar || ""} alt={message.senderName} />
          <AvatarFallback className="text-xs bg-gray-200">
            {message.senderName?.charAt(0).toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? "text-right" : ""}`}>
        {message.type === "system" ? (
          <div className="text-center text-sm text-gray-500 italic py-2 px-4 bg-gray-50 rounded-lg my-2">
            <span className="text-blue-600">ℹ️</span> {message.content}
          </div>
        ) : (
          <>
            <div
              className={`inline-block p-3 rounded-lg shadow-sm ${
                isOwnMessage
                  ? "bg-blue-500 text-white rounded-br-none"
                  : "bg-white border text-gray-900 rounded-bl-none"
              }`}
            >
              <p className="text-sm leading-relaxed break-words">{message.content}</p>
            </div>
            <div className={`flex items-center gap-1 mt-1 px-1 ${isOwnMessage ? "justify-end" : "justify-start"}`}>
              <span className="text-xs text-gray-500">
                {format(message.timestamp.toDate(), "HH:mm", { locale: fr })}
              </span>
              {isOwnMessage && showReadStatus && (
                <div className="flex items-center">
                  {isRead ? (
                    <CheckCheck className="h-3 w-3 text-blue-500" />
                  ) : (
                    <Check className="h-3 w-3 text-gray-400" />
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
