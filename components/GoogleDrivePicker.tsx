import React, { useState, useEffect, useCallback } from 'react';
import { GOOGLE_DEVELOPER_KEY } from '../config.ts';
import { GoogleDriveIcon } from './icons.tsx';

declare global {
    interface Window {
        gapi: any;
        google: any;
    }
}

interface GoogleDrivePickerProps {
    onFileSelect: (file: { name: string; data: string; mimeType: string }) => void;
    onError: (error: string) => void;
    accessToken: string | null;
}

export const GoogleDrivePicker: React.FC<GoogleDrivePickerProps> = ({ onFileSelect, onError, accessToken }) => {
    const [gapiReady, setGapiReady] = useState(false);

    const gapiLoaded = useCallback(() => {
        window.gapi.load('client:picker', () => {
             setGapiReady(true);
        });
    }, []);

    useEffect(() => {
        const scriptGapi = document.createElement('script');
        scriptGapi.src = 'https://apis.google.com/js/api.js';
        scriptGapi.async = true;
        scriptGapi.defer = true;
        scriptGapi.onload = () => gapiLoaded();
        document.body.appendChild(scriptGapi);
        
        return () => {
            document.body.removeChild(scriptGapi);
        }
    }, [gapiLoaded]);

    const showPicker = useCallback(() => {
        if (!accessToken || !gapiReady || !GOOGLE_DEVELOPER_KEY || GOOGLE_DEVELOPER_KEY.startsWith('REPLACE_WITH')) {
            onError("Google Drive client is not ready or configured.");
            return;
        };

        const view = new window.google.picker.View(window.google.picker.ViewId.DOCS);
        view.setMimeTypes("audio/*");
        const picker = new window.google.picker.PickerBuilder()
            .addView(view)
            .setOAuthToken(accessToken)
            .setDeveloperKey(GOOGLE_DEVELOPER_KEY)
            .setCallback((data: any) => {
                if (data.action === window.google.picker.Action.PICKED) {
                    const doc = data.docs[0];
                    const fileId = doc.id;
                    const fileName = doc.name;
                    const mimeType = doc.mimeType;

                    // Download the file content
                    window.gapi.client.drive.files.get({
                        fileId: fileId,
                        alt: 'media'
                    }).then((res: any) => {
                         const reader = new FileReader();
                         reader.readAsDataURL(new Blob([res.body], { type: mimeType }));
                         reader.onloadend = () => {
                             const base64Data = (reader.result as string).split(',')[1];
                             onFileSelect({ name: fileName, data: base64Data, mimeType });
                         };
                         reader.onerror = () => onError('Failed to read file from Google Drive.');
                    }).catch(() => onError('Failed to download file from Google Drive.'));
                }
            })
            .build();
        picker.setVisible(true);
    }, [accessToken, gapiReady, onError, onFileSelect]);
    
    useEffect(() => {
        if (gapiReady && accessToken && GOOGLE_DEVELOPER_KEY && !GOOGLE_DEVELOPER_KEY.startsWith('REPLACE_WITH')) {
             window.gapi.client.init({
                apiKey: GOOGLE_DEVELOPER_KEY,
                discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
            }).catch(() => onError('Failed to initialize Google Drive client.'));
        }
    }, [gapiReady, accessToken, onError]);


    if (!gapiReady) {
        return <button className="w-full flex items-center justify-center bg-gray-600 text-white font-bold py-3 px-4 rounded-lg" disabled>Loading Google Drive...</button>;
    }

    if (!GOOGLE_DEVELOPER_KEY || GOOGLE_DEVELOPER_KEY.startsWith('REPLACE_WITH')) {
        return <button className="w-full flex items-center justify-center bg-yellow-600 text-white font-bold py-3 px-4 rounded-lg" disabled title="The developer has not configured Google Drive API keys.">Drive Not Configured</button>;
    }
    
    if (!accessToken) {
        return (
            <button className="w-full flex items-center justify-center bg-gray-600 text-white font-bold py-3 px-4 rounded-lg" disabled title="Please sign in to use Google Drive.">
                <GoogleDriveIcon/>
                Sign in to use Google Drive
            </button>
        )
    }

    return (
        <button onClick={showPicker} className="w-full flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors">
            <GoogleDriveIcon/>
            Select from Drive
        </button>
    );
};