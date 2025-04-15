import React from 'react';

// Match the FurnitureItem model from the backend
interface FurnitureItemData {
    id: string;
    name: string;
    category: string;
    style: string;
    dimensions: { width: number; height: number; depth: number };
    model_path: string;
}

interface EditorUIProps {
    placedItems: FurnitureItemData[]; // Items currently placed in the scene
    selectedItem: FurnitureItemData | null;
    onSelectItem: (item: FurnitureItemData | null) => void;
    onRemoveItem: (itemId: string) => void;
    onSaveLayout: () => void; // Function to save the current arrangement
}

const EditorUI: React.FC<EditorUIProps> = ({
    placedItems,
    selectedItem,
    onSelectItem,
    onRemoveItem,
    onSaveLayout
}) => {
    return (
        <div style={{ border: '1px solid #ccc', padding: '15px', marginTop: '20px' }}>
            <h2>Room Editor Controls</h2>
            {/* This UI is very basic. A real editor would need more sophisticated controls */}
            {/* for positioning, rotation, scaling, etc., likely integrated with the 3D view */}

            <div>
                <strong>Placed Items:</strong>
                {placedItems.length === 0 ? (
                    <p>No items placed yet. Select items from the catalog.</p>
                ) : (
                    <ul>
                        {placedItems.map(item => (
                            <li key={item.id} onClick={() => onSelectItem(item)} style={{ cursor: 'pointer', background: selectedItem?.id === item.id ? '#eee' : 'transparent' }}>
                                {item.name}
                                <button onClick={(e) => { e.stopPropagation(); onRemoveItem(item.id); }} style={{ marginLeft: '10px', color: 'red' }}>X</button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {selectedItem && (
                <div>
                    <strong>Selected: {selectedItem.name}</strong>
                    {/* Add controls for the selected item here (position, rotation etc.) */}
                    <p><i>(Position/Rotation controls would go here)</i></p>
                </div>
            )}

            <button onClick={onSaveLayout} style={{ marginTop: '15px' }}>Save Layout</button>
        </div>
    );
};

export default EditorUI; 