import React from 'react';

interface LandingPageProps {
    onStartDesigning: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartDesigning }) => {
    return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
            <h1>Welcome to AI Interior Designer</h1>
            <p>Upload photos of your room and let our AI help you redesign it!</p>
            <p>1. Upload 2-4 photos of your empty room.</p>
            <p>2. Our AI reconstructs a 3D model.</p>
            <p>3. Browse furniture and place it in your virtual room.</p>
            <button onClick={onStartDesigning}>Start Designing</button>
        </div>
    );
};

export default LandingPage; 