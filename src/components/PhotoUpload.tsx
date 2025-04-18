import React, { useState, ChangeEvent, FormEvent, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react'; // Import named export QRCodeSVG
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000'; // Define your backend URL

interface PhotoUploadProps {
    onUploadSuccess: (projectId: string) => void;
    onUploadError: (message: string) => void;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ onUploadSuccess, onUploadError }) => {
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string>('');

    // State for phone upload flow
    const [phoneUploadId, setPhoneUploadId] = useState<string | null>(null);
    const [showQrCode, setShowQrCode] = useState(false);
    const [phoneUploadStatus, setPhoneUploadStatus] = useState<string>('pending'); // pending, completed, failed
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // --- Phone Upload Logic ---
    const handleStartPhoneUpload = () => {
        const newUploadId = uuidv4();
        setPhoneUploadId(newUploadId);
        setPhoneUploadStatus('pending');
        setShowQrCode(true);
        setMessage('Scan the QR code with your phone to upload photos.');
        setSelectedFiles(null); // Clear any locally selected files

        // Start polling backend for status
        startPolling(newUploadId);
    };

    const startPolling = (uploadId: string) => {
        // Clear previous interval if any
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
        }

        pollingIntervalRef.current = setInterval(async () => {
            try {
                const response = await fetch(`${API_URL}/api/phone-upload-status/${uploadId}`);
                if (!response.ok) {
                    // Handle cases where the ID might not be found yet or server error
                    console.warn(`Polling status check failed: ${response.status}`);
                    // Optionally stop polling after too many errors
                    return;
                }
                const data = await response.json();
                setPhoneUploadStatus(data.status || 'pending');

                if (data.status === 'completed') {
                    setMessage('Phone upload complete! Click "Upload & Start Processing" to continue.');
                    setShowQrCode(false);
                    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
                    // Store file info if needed, or let handleSubmit handle it
                    console.log('Phone upload completed. Files:', data.files);
                } else if (data.status === 'failed') {
                    setMessage('Phone upload failed. Please try again.');
                    setShowQrCode(false);
                    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
                    setPhoneUploadId(null); // Reset
                }
                // Keep polling if status is still pending

            } catch (error) {
                console.error('Error polling phone upload status:', error);
                // Optionally stop polling on network errors
                // setMessage('Error checking phone upload status.');
                // if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
            }
        }, 3000); // Poll every 3 seconds
    };

    // Cleanup polling on component unmount
    useEffect(() => {
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, []);

    // --- Local Upload Logic ---
    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        console.log('handleFileChange triggered');
        // Reset phone upload if local files are selected
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        setShowQrCode(false);
        setPhoneUploadId(null);
        setPhoneUploadStatus('pending');

        if (event.target.files) {
            console.log('Files selected locally:', event.target.files);
            setSelectedFiles(event.target.files);
            setMessage(`${event.target.files.length} file(s) selected locally.`);
        } else {
            console.log('No files property on event target?');
            setSelectedFiles(null);
            setMessage('');
        }
    };

    // --- Form Submission ---
    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();

        // Check if we are in phone upload mode and if it's complete
        if (phoneUploadId && phoneUploadStatus === 'completed') {
            // Proceed using phoneUploadId
            setIsLoading(true);
            setMessage('Starting project processing using phone uploads...');
            try {
                const response = await fetch(`${API_URL}/projects`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ phone_upload_id: phoneUploadId }),
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.detail || 'Failed to start project from phone upload');
                setMessage(`Project created successfully! Project ID: ${data.id}. Processing started...`);
                onUploadSuccess(data.id);
            } catch (error: any) { // ... (error handling) ...
                console.error('Error starting project from phone upload:', error);
                const errorMsg = error.message || 'An error occurred.';
                setMessage(`Error: ${errorMsg}`);
                onUploadError(errorMsg);
            } finally {
                setIsLoading(false);
                setPhoneUploadId(null); // Reset phone upload state
                setPhoneUploadStatus('pending');
            }

        } else if (selectedFiles) {
            // Proceed using locally selected files
            if (selectedFiles.length < 2 || selectedFiles.length > 4) {
                setMessage('Please select between 2 and 4 photos.');
                return;
            }
            setIsLoading(true);
            setMessage('Uploading photos and starting project...');
            const formData = new FormData();
            for (let i = 0; i < selectedFiles.length; i++) {
                formData.append('files', selectedFiles[i]);
            }
            try {
                const response = await fetch(`${API_URL}/projects`, {
                    method: 'POST',
                    body: formData,
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.detail || 'Upload failed');
                setMessage(`Project created successfully! Project ID: ${data.id}. Processing started...`);
                onUploadSuccess(data.id);
            } catch (error: any) { // ... (error handling) ...
                console.error('Upload error:', error);
                const errorMsg = error.message || 'An error occurred during upload.';
                setMessage(`Error: ${errorMsg}`);
                onUploadError(errorMsg);
            } finally {
                setIsLoading(false);
            }
        } else {
            // No files selected either way
            setMessage('Please select photos locally or use the phone upload option.');
        }
    };

    // Dynamically generate QR code URL
    // IMPORTANT: Replace 'localhost' with your actual local network IP for the phone to access it!
    // You can find your IP using `ipconfig` (Windows) or `ifconfig` (macOS/Linux)
    // Or instruct the user to ensure phone is on the same Wi-Fi and use the displayed IP.
    const qrCodeUrl = phoneUploadId ? `${window.location.protocol}//<YOUR_LAPTOP_IP>:3000/phone-upload/${phoneUploadId}` : '';
    const potentialIpUrl = phoneUploadId ? `${window.location.protocol}//<YOUR_LAPTOP_IP>:3000/phone-upload/${phoneUploadId}` : '';

    return (
        <div className="photo-upload-options">
            <h2>Upload Room Photos</h2>
            <div className="photo-upload-options">
                {/* Option 1: Local File Input */}
                <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
                    <label htmlFor="photo-upload">Option 1: Select Files From This Device (2-4 photos)</label>
                    <br />
                    <input
                        style={{ marginTop: '5px', marginBottom: '10px' }}
                        type="file"
                        id="photo-upload"
                        multiple
                        accept="image/*"
                        // capture="environment" // Keep this? Maybe confusing if also offering phone upload button
                        onChange={handleFileChange}
                        disabled={isLoading || showQrCode}
                    />
                    <br />
                    {/* Button to submit either local files or completed phone upload */}
                    <button
                        type="submit"
                        disabled={isLoading || (!selectedFiles && !(phoneUploadId && phoneUploadStatus === 'completed'))}
                    >
                        {isLoading ? 'Processing...' : 'Upload & Start Processing'}
                    </button>
                </form>

                <hr />

                {/* Option 2: Phone Upload Trigger */}
                <div style={{ marginTop: '20px' }}>
                    <label>Option 2: Upload Photos From Your Phone</label>
                    <br />
                    <button
                        type="button"
                        onClick={handleStartPhoneUpload}
                        disabled={isLoading || showQrCode}
                        style={{ marginTop: '5px' }}
                    >
                        Generate Phone Upload Link (QR Code)
                    </button>
                </div>
            </div>

            {/* QR Code Display Area */}
            {showQrCode && phoneUploadId && (
                <div className="qr-code-area">
                    <p>
                        Scan this QR code with your phone. Ensure your phone is on the <strong>same Wi-Fi network</strong> as this computer.
                        <br />
                        The QR code points to: <code>{qrCodeUrl}</code>
                        <br />
                        <strong style={{ color: 'red' }}>If `localhost` doesn't work on your phone, manually enter the URL using this computer's local IP address (find using ipconfig/ifconfig/System Settings):</strong>
                        <br />
                        Example: <code>{potentialIpUrl.replace('<YOUR_LAPTOP_IP>', '192.168.X.X')}</code>
                    </p>
                    <QRCodeSVG value={qrCodeUrl} size={256} />
                    <p style={{ marginTop: '10px' }}>Status: Waiting for phone upload... ({phoneUploadStatus})</p>
                </div>
            )}

            {/* General Status Message Area */}
            {message && <p className="status-message">{message}</p>}
        </div>
    );
};

export default PhotoUpload; 