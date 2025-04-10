
import React from "react";
import ChatPanel from "./chat/ChatPanel";
import VisualizationPanel from "./visualization/VisualizationPanel";
import Navbar from "./navigation/Navbar";
import { useIsMobile } from "@/hooks/use-mobile";

const AppLayout: React.FC = () => {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Navbar at the top */}
      <Navbar />
      
      {/* Main content area */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Chat Panel (Left on desktop, top on mobile) */}
        <div className={`${isMobile ? 'h-1/2' : 'md:w-2/5'} md:h-full border-r border-border`}>
          <ChatPanel />
        </div>

        {/* Visualization Panel (Right on desktop, bottom on mobile) */}
        <div className={`${isMobile ? 'h-1/2' : 'md:w-3/5'} md:h-full`}>
          <VisualizationPanel />
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
