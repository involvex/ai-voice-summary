import React, { useState } from 'react';
import { KeyIcon, GoogleDriveIcon } from './icons';
import type { GoogleUser } from '../types';

interface ApiKeyManagerProps {
  onKeySave: (key: string) => void;
  onSignIn: () => void;
  user: GoogleUser | null;
  isGisReady: boolean;
  isGoogleConfigured: boolean;
}

export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ onKeySave, onSignIn, user, isGisReady, isGoogleConfigured }) => {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);

  const handleSave = () => {
    const trimmedKey = apiKey.trim();
    if (trimmedKey.length < 10) { // Basic validation
      setError('Please enter a valid API key.');
      return;
    }
    setError('');
    onKeySave(trimmedKey);
  };

  const renderChoice = () => (
    <div className="space-y-6 text-center">
        <div>
            <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Welcome!</h1>
            <p className="text-gray-300">Choose an option to get started.</p>
        </div>
        <div className="space-y-4">
             {isGoogleConfigured ? (
                <button 
                    onClick={onSignIn} 
                    disabled={!isGisReady}
                    className="w-full flex items-center justify-center bg-white hover:bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-lg transition-colors shadow disabled:bg-gray-400 disabled:cursor-wait">
                    <GoogleDriveIcon/>
                    {isGisReady ? 'Sign in with Google' : 'Loading...'}
                </button>
            ) : (
                <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-300 p-4 rounded-lg text-center space-y-2">
                  <p className="font-semibold">Google Sign-In Setup Required</p>
                  <p className="text-sm">
                    To enable Google Sign-In, you need to provide your own Google Client ID.
                  </p>
                   <p className="text-sm">
                    <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline font-semibold">
                      Get credentials from Google Cloud
                    </a>
                    &nbsp;and add them to the <code>config.ts</code> file.
                  </p>
                  <p className="text-sm text-yellow-400/80 mt-2">
                      You can still use the app by selecting the "Use an API Key" option below.
                  </p>
                </div>
            )}
             <button 
                onClick={() => setShowKeyInput(true)} 
                className="w-full flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow">
                <KeyIcon/>
                Use an API Key
            </button>
        </div>
    </div>
  );
  
  const renderApiKeyInput = () => (
    <div className="space-y-6">
        <div className="text-center">
            <h1 className="text-2xl font-bold text-white tracking-tight mb-2">{user ? 'One More Step' : 'Enter API Key'}</h1>
            {user ? (
                <p className="text-gray-400 text-sm">Signed in as <span className="font-semibold text-gray-300">{user.email}</span></p>
            ) : (
                <p className="text-gray-300">Enter your Gemini API key to continue.</p>
            )}
        </div>
        
        <div className="space-y-4">
            <div>
                <label htmlFor="api-key-input" className="flex items-center text-sm font-medium text-gray-300 mb-2">
                    <KeyIcon />
                    Gemini API Key
                </label>
                <input
                    id="api-key-input"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your API key here"
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 transition"
                />
                 <p className="text-xs text-gray-500 mt-2">
                    Your key is saved only for this session. Get a key from{' '}
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                         Google AI Studio
                    </a>.
                </p>
            </div>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <div className="flex flex-col sm:flex-row gap-3">
                {!user && (
                    <button onClick={() => setShowKeyInput(false)} className="w-full sm:w-auto bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                        Back
                    </button>
                )}
                <button
                    onClick={handleSave}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out"
                >
                    Save and Continue
                </button>
            </div>
        </div>
      </div>
  );

  if (user || showKeyInput) {
    return renderApiKeyInput();
  }
  return renderChoice();
};