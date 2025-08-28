"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import { getUserConversations } from "@/utils/messaging-service";
import { Conversation } from "@/types/messaging";
import { Badge } from "@/components/ui/badge";

interface UnreadMessagesIndicatorProps {
  className?: string;
  variant?: "navigation" | "small" | "large";
}

const UnreadMessagesIndicator: React.FC<UnreadMessagesIndicatorProps> = ({
  className = "",
  variant = "navigation",
}) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = getUserConversations(user.uid, (conversations: Conversation[]) => {
      const totalUnread = conversations.reduce((total, conv) => {
        return total + (conv.unreadCount?.[user.uid] || 0);
      }, 0);
      setUnreadCount(totalUnread);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  if (unreadCount === 0) return null;


  if (variant === "navigation") {
    return (
      <Badge 
        variant="destructive" 
        className={`absolute -top-2 -right-2 h-6 w-6 p-0 flex items-center justify-center text-xs font-bold bg-red-500 text-white border-2 border-white rounded-full shadow-lg animate-pulse ${className}`}
      >
        {unreadCount > 99 ? "99+" : unreadCount}
      </Badge>
    );
  }


  if (variant === "small") {
    return (
      <Badge 
        variant="destructive" 
        className={`h-5 w-5 p-0 flex items-center justify-center text-xs font-bold bg-red-500 text-white rounded-full ${className}`}
      >
        {unreadCount > 9 ? "9+" : unreadCount}
      </Badge>
    );
  }


  return (
    <Badge 
      variant="destructive" 
      className={`h-7 w-7 p-0 flex items-center justify-center text-sm font-bold bg-red-500 text-white rounded-full shadow-lg ${className}`}
    >
      {unreadCount > 99 ? "99+" : unreadCount}
    </Badge>
  );
};

export default UnreadMessagesIndicator;
