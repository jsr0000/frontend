import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Match the FurnitureItem model from the backend
interface FurnitureItemData {
    id: string;
    name: string;
    category: string;
    style: string;
    dimensions: { width: number; height: number; depth: number };
    model_path: string;
}

interface FurnitureCatalogProps {
    onSelectFurniture: (item: FurnitureItemData) => void;
    // Add filters if needed
}

const FurnitureCatalog: React.FC<FurnitureCatalogProps> = ({ onSelectFurniture }) => {
    const [furniture, setFurniture] = useState<FurnitureItemData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedStyle, setSelectedStyle] = useState<string>('');

    // TODO: Get categories/styles dynamically or define them
    const categories = ['Chairs', 'Sofas', 'Tables', 'Lamps', 'Rugs'];
    const styles = ['modern', 'scandinavian', 'bohemian', 'industrial'];

    useEffect(() => {
        const fetchFurniture = async () => {
            setIsLoading(true);
            setError(null);
            let url = `${API_URL}/furniture?`;
            if (selectedCategory) url += `category=${encodeURIComponent(selectedCategory)}&`;
            if (selectedStyle) url += `style=${encodeURIComponent(selectedStyle)}&`;

            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error('Failed to fetch furniture');
                const data: FurnitureItemData[] = await response.json();
                setFurniture(data);
            } catch (err: any) {
                setError(err.message || 'Could not load furniture data.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFurniture();
    }, [selectedCategory, selectedStyle]);

    return (
        <div style={{ border: '1px solid #ccc', padding: '15px', marginTop: '20px' }}>
            <h2>Furniture Catalog</h2>
            <div>
                <label>Category: </label>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                    <option value="">All</option>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <label style={{ marginLeft: '15px' }}>Style: </label>
                <select value={selectedStyle} onChange={(e) => setSelectedStyle(e.target.value)}>
                    <option value="">All</option>
                    {styles.map(style => <option key={style} value={style}>{style}</option>)}
                </select>
            </div>

            {isLoading && <p>Loading furniture...</p>}
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}
            {!isLoading && !error && (
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexWrap: 'wrap' }}>
                    {furniture.length > 0 ? furniture.map(item => (
                        <li key={item.id} style={{ border: '1px solid #eee', margin: '5px', padding: '10px', width: '150px' }}>
                            <strong>{item.name}</strong><br />
                            <small>{item.category} ({item.style})</small><br />
                            <small>Dims: {item.dimensions.width}x{item.dimensions.height}x{item.dimensions.depth}m</small><br />
                            {/* In a real app, show a thumbnail image */}
                            <button onClick={() => onSelectFurniture(item)} style={{ fontSize: '0.8em', padding: '3px 5px', marginTop: '5px' }}>
                                Add to Room
                            </button>
                        </li>
                    )) : <p>No furniture found matching criteria.</p>}
                </ul>
            )}
        </div>
    );
};

export default FurnitureCatalog; 