
import React, { useState, useEffect } from "react";
import { Loader2, LayoutGrid, RefreshCw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PlaceholderVisualization from "./PlaceholderVisualization";
import { Card, CardContent } from "@/components/ui/card";
import { WarehouseAttributes } from "@/types/warehouse";
import { toast } from "@/hooks/use-toast";

const DEFAULT_ATTRIBUTES: WarehouseAttributes = {
  length: null,
  width: null,
  height: null,
  palletType: null,
  storage: null,
  storageType: null
};

// Server API endpoint
const SERVER_API_URL = "http://localhost:3001/api";

const VisualizationPanel: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasStream, setHasStream] = useState(false);
  const [currentViewType, setCurrentViewType] = useState<"3d" | "2d">("3d");
  const [warehouseAttributes, setWarehouseAttributes] = useState<WarehouseAttributes>(DEFAULT_ATTRIBUTES);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);

  // Simulate loading delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Listen for console.log messages with warehouse configuration
  useEffect(() => {
    const originalConsoleLog = console.log;
    console.log = function(...args) {
      // Call the original console.log
      originalConsoleLog.apply(console, args);
      
      // Check if this is a warehouse configuration log
      if (args.length > 1 && args[0] === "Warehouse Configuration:") {
        const configData = args[1];
        setWarehouseAttributes(configData);
        
        // Auto-initialize stream when all data is available
        if (Object.values(configData).every(value => value !== null)) {
          handleInitializeStream();
        }
      }
    };

    return () => {
      console.log = originalConsoleLog;
    };
  }, []);

  // Load existing configuration from server
  const loadExistingConfig = async () => {
    setIsLoadingConfig(true);
    try {
      const response = await fetch(`${SERVER_API_URL}/warehouse-config`);
      const data = await response.json();
      
      if (data && data.length !== undefined) {
        // We have a valid configuration
        setWarehouseAttributes(data);
        
        // Auto-initialize stream when all data is available
        if (Object.values(data).every(value => value !== null)) {
          handleInitializeStream();
        }
        
        toast({
          title: "Configuration Loaded",
          description: "Your warehouse configuration has been loaded from the server.",
        });
      } else {
        toast({
          title: "No Configuration Found",
          description: "No existing warehouse configuration was found on the server.",
        });
      }
    } catch (error) {
      console.error("Error loading configuration:", error);
      toast({
        title: "Connection Error",
        description: "Could not connect to the server. Make sure the server is running.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingConfig(false);
    }
  };

  // Save configuration to server
  const saveConfigurationToServer = async () => {
    setIsSaving(true);
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
    } finally {
      setIsSaving(false);
    }
  };

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

  const renderAttributeCards = () => {
    const attributeLabels = {
      length: "Length",
      width: "Width",
      height: "Height",
      palletType: "Pallet Type",
      storage: "Storage Capacity",
      storageType: "Storage Type"
    };

    const attributeUnits = {
      length: "m",
      width: "m",
      height: "m",
      palletType: "",
      storage: " pallets",
      storageType: ""
    };

    return Object.entries(warehouseAttributes).map(([key, value]) => (
      <Card key={key} className="p-3 rounded-md bg-card shadow-sm">
        <CardContent className="p-0">
          <div className="font-medium">{attributeLabels[key as keyof typeof attributeLabels]}</div>
          <div className="text-muted-foreground">
            {value !== null ? `${value}${attributeUnits[key as keyof typeof attributeUnits]}` : "Not specified"}
          </div>
        </CardContent>
      </Card>
    ));
  };

  return (
    <div className="h-full flex flex-col bg-background p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Warehouse Visualization</h2>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={loadExistingConfig}
            disabled={isLoadingConfig}
          >
            {isLoadingConfig ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Load Config
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={saveConfigurationToServer}
            disabled={isSaving || Object.values(warehouseAttributes).some(value => value === null)}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Config
              </>
            )}
          </Button>
          
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
              disabled={isLoading || Object.values(warehouseAttributes).some(value => value === null)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initializing...
                </>
              ) : Object.values(warehouseAttributes).some(value => value === null) ? (
                <>
                  <LayoutGrid className="mr-2 h-4 w-4" />
                  Waiting for Data...
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
                  ? `Showing a ${warehouseAttributes.length}m × ${warehouseAttributes.width}m × ${warehouseAttributes.height}m warehouse with ${warehouseAttributes.storage} ${warehouseAttributes.palletType} pallets using ${warehouseAttributes.storageType} storage.` 
                  : "2D floor plan view showing layout from above with measurements and zone markings."}
              </p>
            </div>
          </div>
        ) : (
          <PlaceholderVisualization />
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        {hasStream ? renderAttributeCards() : (
          <div className="col-span-3 p-3 rounded-md bg-card shadow-sm">
            <div className="font-medium">Warehouse Configuration</div>
            <div className="text-muted-foreground">Complete the chat to generate your warehouse visualization</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualizationPanel;
