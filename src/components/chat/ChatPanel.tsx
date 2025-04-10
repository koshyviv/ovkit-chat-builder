import React, { useState, useRef, useEffect } from "react";
import { Send, Check, Loader2, FileSpreadsheet, Download } from "lucide-react";
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

// Server API endpoint (using environment variable)
// Fallback to localhost if the env var is not set during local dev outside Docker
const SERVER_API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

// Define types/interfaces
interface ChatApiResponse {
  content: string;
  parsed: Record<string, any> | null; // Or a more specific type if preferred
  usage?: Record<string, any>; // Keep usage if needed, though not currently used here
}

const ChatPanel: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [warehouseAttributes, setWarehouseAttributes] = useState<WarehouseAttributes>(initialAttributes);
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load existing configuration from server if available
  // useEffect(() => {
  //   const loadExistingConfig = async () => {
  //     try {
  //       const response = await fetch(`${SERVER_API_URL}/warehouse-config`);
  //       const data = await response.json();
        
  //       if (data && data.length !== undefined) {
  //         // We have a valid configuration
  //         setWarehouseAttributes(data);
          
  //         // Notify the visualization panel
  //         console.log("Warehouse Configuration:", data);
          
  //         // Add a message about the loaded configuration
  //         const loadedMessage: Message = {
  //           id: Date.now().toString(),
  //           type: MessageType.BOT,
  //           content: "I've loaded your previous warehouse configuration. You can continue from where you left off or start a new design.",
  //           timestamp: new Date(),
  //         };
  //         setMessages(prev => [...prev, loadedMessage]);
  //       }
  //     } catch (error) {
  //       console.error("Error loading configuration:", error);
  //       // Silently fail - we'll just start with a new configuration
  //     }
  //   };
    
  //   loadExistingConfig();
  // }, []);

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
          title: "Configuration Extracted",
          description: "Your warehouse configuration has been saved.",
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


  // Get response from server-side OpenAI
  const getOpenAIResponse = async (userMessages: Message[]): Promise<ChatApiResponse> => {
    try {
      const messagesSendToAPI = userMessages.map(msg => ({
        role: msg.type === MessageType.USER ? "user" : "assistant",
        content: msg.content
      }));

      const response = await fetch(`${SERVER_API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: messagesSendToAPI,
          warehouseAttributes: warehouseAttributes
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || "Failed to get response from server");
      }

      const data: ChatApiResponse = await response.json();
      return data;
    } catch (error) {
      console.error("Server API error:", error);
      return { 
        content: "Sorry, I had trouble connecting to my knowledge base. Please try again later.",
        parsed: null
      };
    }
  };

  // Fallback response if API is not available
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

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: MessageType.USER,
      content: inputValue,
      timestamp: new Date(),
    };

    // Optimistically update messages list
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue("");
    setIsLoading(true);

    // Process user message to potentially update attributes (optional, as parsed data is primary)
    // processUserMessage(userMessage.content); // Consider if this incremental update is still needed

    // Get bot response from OpenAI or fallback
    try {
      const apiResponse = await getOpenAIResponse(updatedMessages); // Get the full { content, parsed } object
      
      let botResponseContent = apiResponse.content;
      const parsedData = apiResponse.parsed;
      let isComplete = false;
      let transformedData: WarehouseAttributes | null = null;

      // Check for completion primarily based on parsed data
      if (parsedData) {
        isComplete = true;
        console.log("Received parsed data from server:", parsedData);

        // Transform snake_case keys to camelCase and map capacity
        transformedData = {
          length: parsedData.length ?? null,
          width: parsedData.width ?? null,
          height: parsedData.height ?? null,
          palletType: parsedData.pallet_type ?? null,
          storage: parsedData.capacity ?? null, // Map 'capacity' to 'storage'
          storageType: parsedData.storage_type ?? null,
        };
        console.log("Transformed data for state and event:", transformedData);

        // Update local state with the definitive parsed data
        setWarehouseAttributes(transformedData);
        
        // Optionally remove #completed if it's still present in content
        if (botResponseContent.includes('#completed')) {
           botResponseContent = botResponseContent.replace('#completed', '').trim();
        }

      } else if (botResponseContent.includes('#completed')) {
        // Fallback: Completion indicated by keyword but no parsed data (parsing failed?)
        isComplete = true;
        console.warn("Completion flag #completed found, but no parsed data received from server.");
        toast({
          title: "Parsing Issue",
          description: "Configuration seems complete, but structured data couldn't be extracted automatically.",
          variant: "destructive", // Or 'default' with a less severe message
        });
         // Remove the keyword from the message before displaying
        botResponseContent = botResponseContent.replace('#completed', '').trim();
        // Keep current warehouseAttributes as is, or decide on fallback behavior
        // transformedData remains null here
      }


      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: MessageType.BOT,
        content: botResponseContent,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botMessage]); // Add bot message

      // Check if the response indicated completion
      if (isComplete) {
        // Notify about complete configuration
        toast({
          title: "Warehouse Configuration Complete!",
          description: transformedData 
            ? "All required information has been collected and parsed."
            : "All required information seems to be collected (parsing failed).",
        });

        // Dispatch event WITH parsed data if available
        const event = new CustomEvent('warehouseConfigComplete', { 
          detail: { parsedConfig: transformedData } // Send transformedData (can be null if parsing failed)
        });
        window.dispatchEvent(event);
        
        // Save configuration to server (using the potentially updated state)
        // Ensure saveConfigurationToServer uses the latest state, which it should if called after setWarehouseAttributes
        // If transformedData is not null, saveConfigurationToServer will use it because we called setWarehouseAttributes
        saveConfigurationToServer(); 
      }
    } catch (error) {
      console.error("Error getting response:", error);
      
      // Use fallback response (or handle error differently)
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: MessageType.BOT,
        content: "An error occurred while processing your request.", // Ensure content is a string
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

  // Check if all attributes are filled (for enabling Excel generation)
  const allAttributesFilled = Object.values(warehouseAttributes).every(value => value !== null);

  return (
    <div className="chat-container bg-card p-4 h-full flex flex-col">
      <div className="text-xl font-semibold mb-2 pb-2 border-b flex items-center justify-between">
        <span>Warehouse Assistant</span>
        {/* <div className="flex gap-2">
          {allAttributesFilled && (
            <div className="flex gap-2"></div>
          )}
          
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
        </div> */}
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
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </Button>
      </div>
    </div>
  );
};

export default ChatPanel;
