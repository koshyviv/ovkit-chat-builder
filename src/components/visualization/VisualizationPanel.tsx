
import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PlaceholderVisualization from "./PlaceholderVisualization";

const VisualizationPanel: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasStream, setHasStream] = useState(false);
  const [currentViewType, setCurrentViewType] = useState<"3d" | "2d">("3d");

  // Simulate loading delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Initialize OVKit stream (simulated)
  const handleInitializeStream = () => {
    setIsLoading(true);
    setTimeout(() => {
      setHasStream(true);
      setIsLoading(false);
    }, 1500);
  };

  // Reset stream (simulated)
  const handleResetStream = () => {
    setIsLoading(true);
    setTimeout(() => {
      setHasStream(false);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="h-full flex flex-col bg-background p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Warehouse Visualization</h2>
        
        <div className="flex gap-2">
          {hasStream ? (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleResetStream}
            >
              Reset View
            </Button>
          ) : (
            <Button 
              variant="default" 
              size="sm"
              onClick={handleInitializeStream}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initializing...
                </>
              ) : (
                "Initialize OVKit Stream"
              )}
            </Button>
          )}
        </div>
      </div>

      {hasStream && (
        <Tabs defaultValue="3d" className="mb-4">
          <TabsList>
            <TabsTrigger value="3d" onClick={() => setCurrentViewType("3d")}>3D View</TabsTrigger>
            <TabsTrigger value="2d" onClick={() => setCurrentViewType("2d")}>2D View</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      <div className="flex-grow relative rounded-lg border overflow-hidden">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-sm font-medium">Loading visualization...</span>
          </div>
        ) : hasStream ? (
          <div className="h-full bg-muted/30 flex items-center justify-center">
            <div className="text-center p-6">
              <div className={`text-xl font-semibold mb-2 ${currentViewType === "3d" ? "text-primary" : "text-muted-foreground"}`}>
                {currentViewType === "3d" ? "3D Warehouse Visualization" : "2D Floor Plan"}
              </div>
              <p className="text-muted-foreground">
                {currentViewType === "3d" 
                  ? "Live OVKit stream would appear here, showing the 3D warehouse model based on chat inputs." 
                  : "2D floor plan view would show the layout from above with measurements and zone markings."}
              </p>
            </div>
          </div>
        ) : (
          <PlaceholderVisualization />
        )}
      </div>

      {hasStream && (
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div className="p-3 rounded-md bg-card shadow-sm">
            <div className="font-medium">Dimensions</div>
            <div className="text-muted-foreground">30m × 20m × 12m</div>
          </div>
          <div className="p-3 rounded-md bg-card shadow-sm">
            <div className="font-medium">Pallets</div>
            <div className="text-muted-foreground">450 Standard</div>
          </div>
          <div className="p-3 rounded-md bg-card shadow-sm">
            <div className="font-medium">Storage Type</div>
            <div className="text-muted-foreground">High Bay Racking</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualizationPanel;
