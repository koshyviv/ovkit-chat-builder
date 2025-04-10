
import React from "react";
import { Box, CircleNotch, Warehouse } from "lucide-react";

const PlaceholderVisualization: React.FC = () => {
  return (
    <div className="h-full w-full bg-gradient-to-br from-background to-muted/20 flex flex-col items-center justify-center p-6">
      <div className="relative mb-8">
        <Warehouse className="h-16 w-16 text-primary opacity-80" />
        <CircleNotch className="h-24 w-24 absolute -top-4 -left-4 text-primary/20 animate-spin" style={{ animationDuration: '8s' }} />
        <Box className="h-8 w-8 absolute bottom-0 right-0 text-accent/70 animate-float" />
      </div>
      
      <h3 className="text-2xl font-semibold mb-3 text-foreground">Visualization Ready</h3>
      
      <p className="text-center text-muted-foreground max-w-md mb-6">
        Answer questions in the chat to start building your warehouse layout.
        The visualization will update as you provide more details.
      </p>
      
      <div className="grid grid-cols-3 gap-6 opacity-50">
        <div className="flex flex-col items-center text-xs text-muted-foreground">
          <div className="w-8 h-8 mb-2 rounded-md border-2 border-dashed border-muted-foreground flex items-center justify-center">
            <Box size={16} />
          </div>
          <span>Storage</span>
        </div>
        <div className="flex flex-col items-center text-xs text-muted-foreground">
          <div className="w-8 h-8 mb-2 rounded-md border-2 border-dashed border-muted-foreground flex items-center justify-center">
            <Box size={16} />
          </div>
          <span>Layout</span>
        </div>
        <div className="flex flex-col items-center text-xs text-muted-foreground">
          <div className="w-8 h-8 mb-2 rounded-md border-2 border-dashed border-muted-foreground flex items-center justify-center">
            <Box size={16} />
          </div>
          <span>Zones</span>
        </div>
      </div>
    </div>
  );
};

export default PlaceholderVisualization;
