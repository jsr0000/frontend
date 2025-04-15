import React, { Suspense, useEffect, useState, useRef } from 'react';
import { Canvas, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Stage, Box, Text, useProgress, Html, useGLTF, Cylinder } from '@react-three/drei';
import * as THREE from 'three';

// Match the FurnitureItem model from the backend (already defined in App.tsx, could be shared)
interface FurnitureItemData {
    id: string;
    name: string;
    category: string;
    style: string;
    dimensions: { width: number; height: number; depth: number };
    model_path: string;
}

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface RoomVisualizerProps {
    projectId: string | null;
    placedItems: FurnitureItemData[];
    selectedItemId: string | null;
    onSelectItem: (itemId: string | null) => void;
}

function Loader() {
    const { progress } = useProgress();
    return <Html center>{progress.toFixed(1)} % loaded</Html>;
}

// Placeholder for the actual reconstructed room model
function RoomModel({ projectId }: { projectId: string }) {
    const [modelUrl, setModelUrl] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string>('Loading project status...');
    const [pollingIntervalId, setPollingIntervalId] = useState<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const pollStatus = async () => {
            if (!projectId) return;
            try {
                const response = await fetch(`${API_URL}/projects/${projectId}`);
                if (!response.ok) {
                    // Stop polling on fetch error
                    if (pollingIntervalId) clearInterval(pollingIntervalId);
                    throw new Error(`Failed to fetch project status (${response.status})`);
                }
                const data = await response.json();
                setStatusMessage(`Project status: ${data.status}`);

                if (data.status === 'photogrammetry_complete' && data.room_model_path) {
                    if (pollingIntervalId) clearInterval(pollingIntervalId);
                    // TODO: Implement actual model loading using data.room_model_path
                    // setModelUrl(data.room_model_path); // This should be a URL accessible by the client
                    setStatusMessage('Room model generated (loading not implemented).');
                    console.log("Model path found:", data.room_model_path);
                } else if (data.status.includes('failed')) {
                    if (pollingIntervalId) clearInterval(pollingIntervalId);
                    setStatusMessage(`Processing failed: ${data.status}`);
                } else {
                    // Continue polling if still processing
                    console.log('Project status:', data.status);
                }
            } catch (err: any) {
                console.error(err);
                setStatusMessage(`Error: ${err.message}`);
                if (pollingIntervalId) clearInterval(pollingIntervalId);
            }
        };

        if (projectId) {
            pollStatus(); // Fetch immediately
            // Start polling every 5 seconds
            const intervalId = setInterval(pollStatus, 5000);
            setPollingIntervalId(intervalId);
        } else {
            setStatusMessage('No project selected.');
        }

        // Cleanup function to stop polling when component unmounts or projectId changes
        return () => {
            if (pollingIntervalId) clearInterval(pollingIntervalId);
        };

    }, [projectId]); // Rerun effect if projectId changes

    // Placeholder geometry: A simple box representing the room bounds
    return (
        <mesh>
            <boxGeometry args={[10, 4, 10]} />
            {/* Transparent wireframe box facing inwards */}
            <meshStandardMaterial color="#ccc" side={THREE.BackSide} wireframe transparent opacity={0.3} />
            <Text position={[0, 2.2, 0]} fontSize={0.3} color="#555" anchorY="top">
                {statusMessage}
            </Text>
            {/* TODO: Replace this with actual GLTF model loading when ready */}
            {/* {modelUrl && <Model url={modelUrl} />} */}
        </mesh>
    );
}

/*
// Placeholder for loading a GLTF model - Needs refinement
function Model({ url }: { url: string }) {
  // useGLTF.preload(url) // Optional: preload
  const { scene } = useGLTF(url);
  // You might need to scale, position, or traverse the scene graph
  return <primitive object={scene} />;
}
*/

// Represents a single placed furniture item
function PlacedFurnitureItem({
    item,
    isSelected,
    onSelect
}: {
    item: FurnitureItemData,
    isSelected: boolean,
    onSelect: (id: string | null) => void
}) {
    // Using placeholder shapes based on category for MVP
    const { width = 1, height = 1, depth = 1 } = item.dimensions;
    // Store position in state to make it movable later (though movement isn't implemented yet)
    const [position, setPosition] = useState<[number, number, number]>([Math.random() * 4 - 2, height / 2, Math.random() * 4 - 2]);
    const meshRef = useRef<THREE.Mesh>(null!); // Ref to the mesh for clicking

    const handleClick = (event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation(); // Prevent click from bubbling to background/stage
        onSelect(item.id);
    };

    // Determine shape based on category
    const renderShape = () => {
        switch (item.category.toLowerCase()) {
            case 'tables':
                // Cylinder for tables (using width as radius, height)
                return <Cylinder ref={meshRef} args={[width / 2, width / 2, height, 16]} castShadow receiveShadow>
                    <meshStandardMaterial color={isSelected ? "yellow" : "brown"} />
                </Cylinder>;
            case 'chairs':
            case 'sofas':
            default:
                // Box for others
                return <Box ref={meshRef} args={[width, height, depth]} castShadow receiveShadow>
                    <meshStandardMaterial color={isSelected ? "yellow" : "purple"} />
                </Box>;
        }
    };

    return (
        // Group allows easier positioning and adding labels/controls later
        <group position={position} onClick={handleClick}>
            {renderShape()}
            {/* Optional: Label always visible */}
            {/* <Text position={[0, height / 2 + 0.2, 0]} fontSize={0.15} color="black" anchorX="center" anchorY="middle">
                {item.name}
            </Text> */}
            {/* Show label only when selected? */}
            {isSelected && (
                <Text position={[0, height / 2 + 0.3, 0]} fontSize={0.15} color="black" anchorX="center" anchorY="middle">
                    {item.name}
                </Text>
            )}
        </group>
    );
}


const RoomVisualizer: React.FC<RoomVisualizerProps> = ({ projectId, placedItems, selectedItemId, onSelectItem }) => {

    const handleBackgroundClick = () => {
        // Deselect when clicking the background/stage floor
        onSelectItem(null);
    };

    return (
        <div style={{ height: '60vh', width: '100%', background: '#f0f0f0', marginTop: '20px', border: '1px solid #ccc' }}>
            <Canvas shadows camera={{ position: [0, 3, 8], fov: 50 }}>
                <Suspense fallback={<Loader />}>
                    {/* Added onClick handler to Stage for deselecting */}
                    <Stage
                        environment="city"
                        intensity={0.5}
                        adjustCamera={1.2}
                        shadows="contact"
                        onClick={handleBackgroundClick} >

                        {/* Room Model (or placeholder) */}
                        {projectId ? (
                            <RoomModel projectId={projectId} />
                        ) : (
                            <Text position={[0, 0, 0]} fontSize={0.5} color="grey">
                                Upload photos to see the room model.
                            </Text>
                        )}

                        {/* Placed Furniture Items */}
                        {projectId && placedItems.map(item => (
                            <PlacedFurnitureItem
                                key={item.id}
                                item={item}
                                isSelected={item.id === selectedItemId}
                                onSelect={onSelectItem} // Pass selection handler down
                            />
                        ))}

                    </Stage>
                </Suspense>
                <OrbitControls makeDefault />
            </Canvas>
        </div>
    );
};

export default RoomVisualizer; 