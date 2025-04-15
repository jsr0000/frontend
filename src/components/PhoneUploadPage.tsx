import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function PhoneUploadPage() {
    const { uploadId } = useParams<{ uploadId: string }>();
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string>('Select 2-4 photos using your phone...');
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        // Basic check if uploadId is present
        if (!uploadId) {
            setMessage('Error: Missing upload ID in the URL.');
        }
    }, [uploadId]);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        setSelectedFiles(event.target.files);
        if (event.target.files) {
            setMessage(`${event.target.files.length} file(s) selected.`);
        }
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (!selectedFiles || selectedFiles.length < 2 || selectedFiles.length > 4) {
            setMessage('Please select between 2 and 4 photos.');
            return;
        }
        if (!uploadId) {
            setMessage('Error: Cannot upload without an upload ID.');
            return;
        }

        setIsLoading(true);
        setMessage('Uploading...');
        const formData = new FormData();
        for (let i = 0; i < selectedFiles.length; i++) {
            formData.append('files', selectedFiles[i]);
        }

        try {
            // Note: Using a specific endpoint for phone uploads
            const response = await fetch(`${API_URL}/api/phone-upload/${uploadId}`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json(); // Expect success/error message

            if (!response.ok) {
                throw new Error(data.detail || 'Upload failed from phone');
            }

            setMessage(`Upload Complete! ${data.message || 'You can now close this window.'}`);
            setIsComplete(true);

        } catch (error: any) {
            console.error('Phone upload error:', error);
            const errorMsg = error.message || 'An error occurred during phone upload.';
            setMessage(`Error: ${errorMsg}`);
        } finally {
            setIsLoading(false);
        }
    };

    if (!uploadId) {
        return <div>Error: Invalid Link. No upload ID provided.</div>;
    }

    if (isComplete) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h1>Upload Successful</h1>
                <p>{message}</p>
            </div>
        );
    }

    // Basic styling for mobile usability
    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <h1>Upload Room Photos</h1>
            <p>Session ID: {uploadId}</p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <label htmlFor="phone-photo-upload">Tap to Take/Select (2-4 photos):</label>
                <input
                    style={{ padding: '10px', border: '1px solid #ccc' }} // Basic styling
                    type="file"
                    id="phone-photo-upload"
                    multiple
                    accept="image/*"
                    capture="environment" // Encourage camera use
                    onChange={handleFileChange}
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={isLoading || !selectedFiles}
                    style={{ padding: '15px', fontSize: '1.1em', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}
                >
                    {isLoading ? 'Uploading...' : 'Upload Photos'}
                </button>
            </form>
            {message && <p style={{ marginTop: '15px', fontWeight: 'bold' }}>{message}</p>}
        </div>
    );
}

export default PhoneUploadPage; 