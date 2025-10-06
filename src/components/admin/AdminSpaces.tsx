import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { 
  SpacesList, 
  SpaceGrid,
  EmptySpacesState, 
  SpacesHeader,
  SpaceDialog,
  useSpaces
} from "./spaces";
import { SpacesFilter } from "./spaces/SpacesFilter";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid2X2, List } from "lucide-react";
import StripeDebugPanel from "./spaces/StripeDebugPanel";
import { logger } from '@/utils/logger';

const AdminSpaces = () => {
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const {
    spaces,
    allSpaces,
    loading,
    addDialogOpen,
    setAddDialogOpen,
    editDialogOpen,
    setEditDialogOpen,
    selectedSpace,
    filter,
    setFilter,
    triggerRefresh,
    handleEditClick,
    handleDialogClose
  } = useSpaces();

  // Function to handle successful space operations
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleSpaceSuccess = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    logger.debug("Space operation successful, refreshing spaces...");
    triggerRefresh();
    setTimeout(() => setIsRefreshing(false), 1000); // prevent multiple rapid refreshes
  };

  return (
    <div className="space-y-6">
      <StripeDebugPanel />
      
      <SpacesHeader onAddSpace={() => setAddDialogOpen(true)} />

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Liste des espaces</CardTitle>
              <CardDescription>Gérez vos espaces de coworking</CardDescription>
            </div>
            <Tabs 
              value={viewMode} 
              onValueChange={(value) => setViewMode(value as "grid" | "table")}
              className="w-auto"
            >
              <TabsList>
                <TabsTrigger value="grid" className="flex items-center gap-1">
                  <Grid2X2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Grille</span>
                </TabsTrigger>
                <TabsTrigger value="table" className="flex items-center gap-1">
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">Tableau</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <SpacesFilter 
            filter={filter}
            setFilter={setFilter}
            allSpaces={allSpaces}
          />
          
          {loading || spaces.length === 0 ? (
            <EmptySpacesState loading={loading} />
          ) : viewMode === "grid" ? (
            <SpaceGrid 
              spaces={spaces} 
              loading={loading}
              onEditSpace={handleEditClick}
              onSpacesRefresh={triggerRefresh} 
            />
          ) : (
            <SpacesList 
              spaces={spaces} 
              onEditSpace={handleEditClick}
              onSpacesRefresh={triggerRefresh} 
            />
          )}
        </CardContent>
      </Card>

      <SpaceDialog 
        mode="add"
        open={addDialogOpen} 
        onOpenChange={setAddDialogOpen} 
        onSuccess={handleSpaceSuccess} 
      />

      {selectedSpace && (
        <SpaceDialog
          mode="edit"
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={handleSpaceSuccess}
          space={selectedSpace}
        />
      )}
    </div>
  );
};

export default AdminSpaces;
