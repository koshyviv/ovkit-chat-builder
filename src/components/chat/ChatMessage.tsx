import React from "react";
import { Message, MessageType } from "@/types/chat";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUserMessage = message.type === MessageType.USER;
  
  return (
    <div
      className={cn(
        "mb-4 p-3 rounded-lg max-w-[85%]",
        isUserMessage 
          ? "ml-auto bg-primary text-primary-foreground" 
          : "mr-auto bg-muted"
      )}
    >
      <div className="message-content prose prose-sm dark:prose-invert">
        {isUserMessage ? (
          <div>{message.content}</div>
        ) : (
          <ReactMarkdown>{message.content}</ReactMarkdown>
        )}
      </div>
      <div className={cn(
        "text-xs mt-1",
        isUserMessage ? "opacity-70" : "text-muted-foreground"
      )}>
        {formatTime(message.timestamp)}
      </div>
    </div>
  );
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default ChatMessage;
