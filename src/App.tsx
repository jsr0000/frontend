import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import LandingPage from './components/LandingPage';
import PhotoUpload from './components/PhotoUpload';
import RoomVisualizer from './components/RoomVisualizer';
import FurnitureCatalog from './components/FurnitureCatalog';
import EditorUI from './components/EditorUI';
import PhoneUploadPage from './components/PhoneUploadPage';

// Match the FurnitureItem model from the backend
interface FurnitureItemData {
  id: string;
  name: string;
  category: string;
  style: string;
  dimensions: { width: number; height: number; depth: number };
  model_path: string;
}

type AppState = 'landing' | 'uploading' | 'designing';

// Main application component rendered for the default route
function MainApp() {
  const [appState, setAppState] = useState<AppState>('landing');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // State for the editor
  const [placedFurniture, setPlacedFurniture] = useState<FurnitureItemData[]>([]);
  const [selectedFurnitureItem, setSelectedFurnitureItem] = useState<FurnitureItemData | null>(null);

  const handleStartDesigning = () => {
    setAppState('uploading');
    setError(null);
    setProjectId(null); // Reset project ID when starting new design
    setPlacedFurniture([]); // Clear previous items
    setSelectedFurnitureItem(null);
  };

  const handleUploadSuccess = (newProjectId: string) => {
    setProjectId(newProjectId);
    setAppState('designing'); // Move to design view after successful upload
    setError(null);
  };

  const handleUploadError = (message: string) => {
    setError(`Upload Failed: ${message}`);
    // Keep user on upload screen or provide option to retry
    setAppState('uploading'); // Stay on upload state on error
  };

  const handleSelectFurniture = (item: FurnitureItemData) => {
    // Add item to the scene (for now, just logs and adds to list)
    console.log("Adding item:", item);
    // Prevent adding duplicates for simplicity in this example
    if (!placedFurniture.find(pf => pf.id === item.id)) {
      setPlacedFurniture([...placedFurniture, item]);
    }
    // TODO: Implement actual placement logic in RoomVisualizer
  };

  const handleRemoveFurniture = (itemId: string) => {
    setPlacedFurniture(placedFurniture.filter(item => item.id !== itemId));
    if (selectedFurnitureItem?.id === itemId) {
      setSelectedFurnitureItem(null); // Deselect if removed
    }
  };

  const handleSaveLayout = () => {
    // TODO: Implement saving the layout (e.g., positions of placedFurniture)
    // This would likely involve another API call to the backend
    alert("Save Layout functionality not implemented yet.");
    console.log("Current Layout:", placedFurniture);
  }

  const handleSelectItem = (itemId: string | null) => {
    if (!itemId) {
      setSelectedFurnitureItem(null);
      return;
    }
    const item = placedFurniture.find(pf => pf.id === itemId);
    setSelectedFurnitureItem(item || null);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>AI Interior Designer</h1>
      </header>
      <main>
        {error && <p className="error-message"><strong>Error:</strong> {error}</p>}

        {appState === 'landing' && (
          <LandingPage onStartDesigning={handleStartDesigning} />
        )}

        {appState === 'uploading' && (
          <PhotoUpload
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />
          // Optional: Add a button to go back to landing
        )}

        {appState === 'designing' && (
          <div>
            <h2>Design Your Room (Project ID: {projectId})</h2>
            {/* Display Room Visualizer, Catalog, and Editor */}
            <RoomVisualizer
              projectId={projectId}
              placedItems={placedFurniture}
              selectedItemId={selectedFurnitureItem?.id ?? null}
              onSelectItem={handleSelectItem}
            />
            {/* <EditorUI
              placedItems={placedFurniture}
              selectedItem={selectedFurnitureItem}
              onSelectItem={(item) => handleSelectItem(item?.id ?? null)}
              onRemoveItem={handleRemoveFurniture}
              onSaveLayout={handleSaveLayout}
            />
            <FurnitureCatalog onSelectFurniture={handleSelectFurniture} /> */}
            {/* End Temporarily Disabled Furniture UI */}

            <button onClick={handleStartDesigning} style={{ marginTop: '20px' }}>Start New Design</button>
          </div>
        )}
      </main>
    </div>
  );
}

// Top-level App component to handle routing
function App() {
  return (
    <Routes>
      <Route path="/" element={<MainApp />} />
      <Route path="/phone-upload/:uploadId" element={<PhoneUploadPage />} />
      {/* Add other routes here if needed */}
    </Routes>
  );
}

export default App;
