
import React, { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import ChatMessage from "./ChatMessage";
import { Message, MessageType } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    type: MessageType.BOT,
    content: "Hello! I'll help you design your warehouse layout. What's the height requirement for your warehouse?",
    timestamp: new Date(),
  },
];

const ChatPanel: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = () => {
    if (inputValue.trim() === "") return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: MessageType.USER,
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Simulate bot response
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: MessageType.BOT,
        content: getBotResponse(messages.length),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // For demo purposes - in production this would be replaced with API call
  const getBotResponse = (messageCount: number): string => {
    const responses = [
      "Great! Now, what's the width and length of the warehouse floor in meters?",
      "Perfect. How many pallets do you need to store in total?",
      "What type of goods will primarily be stored? This helps determine the racking type.",
      "Do you need any special temperature controls for the goods?",
      "Are there any height restrictions due to sprinkler systems or other overhead equipment?",
      "Based on your answers, I'm starting to generate a visualization of your warehouse layout. You'll see it appearing in the right panel shortly.",
      "Would you like to add any office spaces or specific work areas?",
      "Do you need loading docks? If yes, how many?",
      "I'm refining the warehouse layout based on your requirements. The visualization should be updating in real-time.",
      "Is there anything specific about the layout you'd like to change?",
    ];

    return responses[messageCount % responses.length];
  };

  return (
    <div className="chat-container bg-card p-4 h-full">
      <div className="text-xl font-semibold mb-4 pb-2 border-b">OVKit Chat Builder</div>
      
      <ScrollArea className="flex-grow mb-4 pr-4">
        <div className="flex flex-col">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      <div className="flex items-center gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="flex-grow"
          disabled={isLoading}
        />
        <Button 
          onClick={handleSendMessage} 
          size="icon" 
          disabled={isLoading || inputValue.trim() === ""}
          className="transition-all duration-150"
        >
          <Send size={18} />
        </Button>
      </div>
    </div>
  );
};

export default ChatPanel;
