import { useState } from "react";
import { DashboardProvider, useDashboard, WidgetType } from "@/context/DashboardContext";
import { WidgetLoader } from "./widgets/WidgetLoader";
import { Button } from "@/components/ui/button";
import { PlusCircle, Save, RotateCcw, Grid, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import GridLayout from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const COLS = 12;
const ROW_HEIGHT = 150;

function DashboardContent() {
  const { widgets, layouts, isEditMode, availableWidgets, addWidget, updateLayout, saveLayout, toggleEditMode, resetLayout } = useDashboard();
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  
  const handleLayoutChange = (newLayout: any) => {
    updateLayout(newLayout);
  };

  const handleSave = async () => {
    await saveLayout();
    toast({
      title: "Dashboard saved",
      description: "Your dashboard layout has been saved.",
    });
    toggleEditMode();
  };

  const handleReset = () => {
    setIsResetDialogOpen(true);
  };

  const confirmReset = () => {
    resetLayout();
    setIsResetDialogOpen(false);
    toast({
      title: "Dashboard reset",
      description: "Your dashboard has been reset to default.",
    });
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex space-x-2">
          {isEditMode ? (
            <>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button variant="default" size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Layout
              </Button>
              <Button variant="ghost" size="sm" onClick={toggleEditMode}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </>
          ) : (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Widget
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Widget Types</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {availableWidgets.map((widget) => (
                    <DropdownMenuItem key={widget.id} onClick={() => addWidget(widget.type)}>
                      {widget.title}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button variant="default" size="sm" onClick={toggleEditMode}>
                <Grid className="h-4 w-4 mr-2" />
                Edit Layout
              </Button>
            </>
          )}
        </div>
      </div>

      {isEditMode && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
          <p className="text-yellow-800">
            <strong>Edit Mode:</strong> Drag widgets to rearrange them. Resize widgets by dragging the bottom-right corner.
          </p>
        </div>
      )}

      <div className="bg-muted/20 rounded-md p-1 min-h-[500px]">
        <GridLayout
          className="layout"
          layout={layouts}
          cols={COLS}
          rowHeight={ROW_HEIGHT}
          width={1200}
          isDraggable={isEditMode}
          isResizable={isEditMode}
          onLayoutChange={handleLayoutChange}
          compactType="vertical"
          margin={[16, 16]}
          containerPadding={[16, 16]}
          useCSSTransforms={true}
        >
          {widgets.map((widget) => (
            <div key={widget.id} className="shadow-md rounded-md overflow-hidden border border-gray-100 bg-white">
              <WidgetLoader id={widget.id} />
            </div>
          ))}
        </GridLayout>
      </div>

      <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Dashboard</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset your dashboard to the default layout. All your customizations will be lost. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReset}>Reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function Dashboard() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}