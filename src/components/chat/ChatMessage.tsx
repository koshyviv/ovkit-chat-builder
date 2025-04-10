
import React from "react";
import { Message, MessageType } from "@/types/chat";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUserMessage = message.type === MessageType.USER;
  
  return (
    <div
      className={cn(
        "message-bubble",
        isUserMessage ? "user-message" : "bot-message"
      )}
    >
      <div className="message-content">{message.content}</div>
      <div className="text-xs opacity-60 mt-1">
        {formatTime(message.timestamp)}
      </div>
    </div>
  );
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default ChatMessage;
