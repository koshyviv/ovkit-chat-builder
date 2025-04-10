import React, { useState, useRef, useEffect } from "react";
import { Send, Check, Loader2 } from "lucide-react";
import ChatMessage from "./ChatMessage";
import { Message, MessageType } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { WarehouseAttributes } from "@/types/warehouse";
import { toast } from "@/hooks/use-toast";

// Initial warehouse attributes
const initialAttributes: WarehouseAttributes = {
  length: null,
  width: null,
  height: null,
  palletType: null,
  storage: null,
  storageType: null
};

// Initial welcome message
const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    type: MessageType.BOT,
    content: "Hello! I'll help you design your warehouse layout. What's the height requirement for your warehouse?",
    timestamp: new Date(),
  },
];

// OpenAI API endpoint
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
// Server API endpoint
const SERVER_API_URL = "http://localhost:3001/api";

const ChatPanel: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [warehouseAttributes, setWarehouseAttributes] = useState<WarehouseAttributes>(initialAttributes);
  const [apiKey, setApiKey] = useState<string>("");
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load existing configuration from server if available
  useEffect(() => {
    const loadExistingConfig = async () => {
      try {
        const response = await fetch(`${SERVER_API_URL}/warehouse-config`);
        const data = await response.json();
        
        if (data && data.length !== undefined) {
          // We have a valid configuration
          setWarehouseAttributes(data);
          
          // Notify the visualization panel
          console.log("Warehouse Configuration:", data);
          
          // Add a message about the loaded configuration
          const loadedMessage: Message = {
            id: Date.now().toString(),
            type: MessageType.BOT,
            content: "I've loaded your previous warehouse configuration. You can continue from where you left off or start a new design.",
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, loadedMessage]);
        }
      } catch (error) {
        console.error("Error loading configuration:", error);
        // Silently fail - we'll just start with a new configuration
      }
    };
    
    loadExistingConfig();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Process user message and extract warehouse attributes
  const processUserMessage = (message: string): void => {
    const lengthMatch = message.match(/(\d+(\.\d+)?)\s*(meters|m|feet|ft)?\s*(length|long|by|x)/i);
    const widthMatch = message.match(/(\d+(\.\d+)?)\s*(meters|m|feet|ft)?\s*(width|wide|by|x)/i);
    const heightMatch = message.match(/(\d+(\.\d+)?)\s*(meters|m|feet|ft)?\s*(height|high|tall)/i);
    const palletMatch = message.match(/(standard|euro|block|stringer|plastic|wooden)\s*pallet/i);
    const storageMatch = message.match(/(\d+)\s*(pallets|pallet|storage|capacity)/i);
    const storageTypeMatch = message.match(/(rack|racking|shelving|block stacking|drive-in|pallet flow|push-back|cantilever|mezzanine)/i);

    setWarehouseAttributes(prev => {
      const updated = { ...prev };
      
      if (lengthMatch && !updated.length) updated.length = parseFloat(lengthMatch[1]);
      if (widthMatch && !updated.width) updated.width = parseFloat(widthMatch[1]);
      if (heightMatch && !updated.height) updated.height = parseFloat(heightMatch[1]);
      if (palletMatch && !updated.palletType) updated.palletType = palletMatch[1].toLowerCase();
      if (storageMatch && !updated.storage) updated.storage = parseInt(storageMatch[1]);
      if (storageTypeMatch && !updated.storageType) updated.storageType = storageTypeMatch[1].toLowerCase();
      
      return updated;
    });
  };

  // Save configuration to server
  const saveConfigurationToServer = async () => {
    try {
      const response = await fetch(`${SERVER_API_URL}/warehouse-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(warehouseAttributes),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Configuration Saved",
          description: "Your warehouse configuration has been saved to the server.",
        });
      } else {
        console.error("Error saving configuration:", data.error);
        toast({
          title: "Save Error",
          description: "Failed to save your configuration. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving configuration:", error);
      toast({
        title: "Connection Error",
        description: "Could not connect to the server. Make sure the server is running.",
        variant: "destructive",
      });
    }
  };

  // Call OpenAI API to get bot response
  const getOpenAIResponse = async (userMessages: Message[]): Promise<string> => {
    if (!apiKey) {
      return "Please provide your OpenAI API key to continue the conversation.";
    }

    try {
      const messages = [
        {
          role: "system",
          content: `You are a warehouse configuration assistant. Help the user design their warehouse by collecting the following information: length, width, height, pallet type, storage capacity, and storage type. Current information gathered: ${JSON.stringify(warehouseAttributes)}. Ask for missing information one by one, confirming what you've understood. Be concise and friendly.`
        },
        ...userMessages.map(msg => ({
          role: msg.type === MessageType.USER ? "user" : "assistant",
          content: msg.content
        }))
      ];

      const response = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages,
          temperature: 0.7,
          max_tokens: 150
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to get response from OpenAI");
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error("OpenAI API error:", error);
      return "Sorry, I had trouble connecting to my knowledge base. Please try again or check your API key.";
    }
  };

  // Fallback response if OpenAI API is not available
  const getFallbackResponse = (): string => {
    const attributes = warehouseAttributes;
    
    if (attributes.height === null) return "What's the height of your warehouse in meters?";
    if (attributes.length === null) return "Great! Now, what's the length of your warehouse in meters?";
    if (attributes.width === null) return "What's the width of your warehouse in meters?";
    if (attributes.palletType === null) return "What type of pallets will you be using? (Standard, Euro, Block, etc.)";
    if (attributes.storage === null) return "How many pallets do you need to store in total?";
    if (attributes.storageType === null) return "What type of storage system would you prefer? (Racking, Block Stacking, Drive-in, etc.)";
    
    return "Thanks for providing all the details! I'm generating your warehouse visualization now.";
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (inputValue.trim() === "") return;

    // If API key input is showing, set the API key
    if (showApiKeyInput) {
      setApiKey(inputValue);
      setShowApiKeyInput(false);
      setInputValue("");
      
      // Add a message indicating API key has been set
      const apiKeyMessage: Message = {
        id: Date.now().toString(),
        type: MessageType.BOT,
        content: "API key has been set. Now, let's start designing your warehouse. What's the height of your warehouse in meters?",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, apiKeyMessage]);
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: MessageType.USER,
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Process user message to extract warehouse attributes
    processUserMessage(userMessage.content);

    // Get bot response from OpenAI or fallback
    try {
      const updatedMessages = [...messages, userMessage];
      const botResponse = await getOpenAIResponse(updatedMessages);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: MessageType.BOT,
        content: botResponse,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botMessage]);

      // Check if all attributes are filled
      const allAttributesFilled = Object.values(warehouseAttributes).every(value => value !== null);
      if (allAttributesFilled) {
        // Notify about complete configuration
        toast({
          title: "Warehouse Configuration Complete!",
          description: "All required information has been collected.",
        });

        // Send data to visualization component
        console.log("Warehouse Configuration:", warehouseAttributes);
        
        // Save configuration to server
        saveConfigurationToServer();
      }
    } catch (error) {
      console.error("Error getting response:", error);
      
      // Use fallback response
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: MessageType.BOT,
        content: getFallbackResponse(),
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-container bg-card p-4 h-full flex flex-col">
      <div className="text-xl font-semibold mb-2 pb-2 border-b flex items-center justify-between">
        <span>Warehouse Assistant</span>
        <div className="flex gap-2">
          {Object.entries(warehouseAttributes).map(([key, value], index) => (
            <div 
              key={key} 
              className={`w-6 h-6 rounded-full flex items-center justify-center border ${value !== null ? 'bg-green-100 border-green-500' : 'bg-gray-100 border-gray-300'}`}
              title={`${key}: ${value !== null ? value : 'Not provided yet'}`}
            >
              {value !== null ? (
                <Check size={14} className="text-green-500" />
              ) : (
                <span className="text-xs text-gray-400">{index + 1}</span>
              )}
            </div>
          ))}
        </div>
      </div>
      
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
          placeholder={showApiKeyInput ? "Enter your OpenAI API key..." : "Type your message..."}
          className="flex-grow"
          disabled={isLoading}
          type={showApiKeyInput ? "password" : "text"}
        />
        <Button 
          onClick={handleSendMessage} 
          size="icon" 
          disabled={isLoading || inputValue.trim() === ""}
          className="transition-all duration-150"
        >
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </Button>
      </div>
    </div>
  );
};

export default ChatPanel;
