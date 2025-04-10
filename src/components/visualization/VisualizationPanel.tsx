import React, { useState, useEffect } from "react";
import { Loader2, LayoutGrid, RefreshCw, Save, FileSpreadsheet, Download } from "lucide-react";
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
  const [warehouseAttributes, setWarehouseAttributes] = useState<WarehouseAttributes>(DEFAULT_ATTRIBUTES);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);

  // Simulate loading delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Listen for custom event from ChatPanel
  useEffect(() => {
    const handleConfigComplete = (event: CustomEvent) => {
      // Check if detail and parsedConfig exist
      if (event.detail && event.detail.parsedConfig) {
        const configData: WarehouseAttributes = event.detail.parsedConfig;
        console.log("Received parsed config via event:", configData);
        setWarehouseAttributes(configData);
        // Auto-initialize stream with the newly received, parsed configuration
        handleInitializeStream(); 
      } else {
        console.warn("warehouseConfigComplete event received, but missing parsedConfig in detail.");
        // Optionally, handle the case where the event is dispatched without parsed data (e.g., parsing failed)
        // Maybe fall back to the state updated by ChatPanel? Or show an error?
        // For now, we just log a warning.
      }
    };

    // Add event listener
    window.addEventListener('warehouseConfigComplete', handleConfigComplete as EventListener);
    
    // Remove event listener on cleanup
    return () => {
      window.removeEventListener('warehouseConfigComplete', handleConfigComplete as EventListener);
    };
  }, []);



  // Initialize OVKit stream (simulated)
  const handleInitializeStream = () => {
    setIsLoading(true);
    // Ensure we have *some* valid data before initializing
    // This check might be redundant if the button is disabled, but adds safety
    const isValidConfig = Object.values(warehouseAttributes).every(v => v !== null);
    if (!isValidConfig) {
      console.warn("Attempted to initialize stream without complete configuration.");
      toast({
        title: "Incomplete Data",
        description: "Cannot initialize visualization without complete warehouse data.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    console.log("Initializing visualization with:", warehouseAttributes);
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

  const allAttributesFilled = Object.values(warehouseAttributes).every(value => value !== null);

  return (
    <div className="h-full flex flex-col bg-background p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Warehouse Visualization</h2>
        
        <div className="flex gap-2">
          {/* <Button 
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
           */}
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
                <>
                  <LayoutGrid className="mr-2 h-4 w-4" />
                  Initialize Omniverse Stream
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="flex-grow relative rounded-lg border overflow-hidden">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-sm font-medium">Loading visualization...</span>
          </div>
        ) : allAttributesFilled ? (
          <div className="h-full bg-muted/30 flex items-center justify-center">
            <div className="text-center p-6">
              <div className="text-xl font-semibold mb-2 text-primary">
                3D Warehouse Visualization
              </div>
              <p className="text-muted-foreground">
                {`Loading a ${warehouseAttributes.length}m × ${warehouseAttributes.width}m × ${warehouseAttributes.height}m warehouse with ${warehouseAttributes.storage} ${warehouseAttributes.palletType} pallets using ${warehouseAttributes.storageType} storage.`}
              </p>
            </div>
          </div>
        ) : (
          <PlaceholderVisualization />
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        {allAttributesFilled ? (
          <>
            {renderAttributeCards()}
            {allAttributesFilled && (
              <div className="col-span-3 flex justify-end gap-2 mt-2"></div>
            )}
          </>
        ) : (
          <div className="col-span-3 p-3 rounded-md bg-card shadow-sm">
            <div className="font-medium">Warehouse Configuration</div>
            <div className="text-muted-foreground">Complete the wizard to generate your warehouse visualization</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualizationPanel;
