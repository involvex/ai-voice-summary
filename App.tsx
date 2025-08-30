import React, { useState, useCallback, useEffect } from 'react';
import { LanguageSelector } from './components/LanguageSelector';
import { FileUpload } from './components/FileUpload';
import { SummaryDisplay } from './components/SummaryDisplay';
import { Loader } from './components/Loader';
import { ApiKeyManager } from './components/ApiKeyManager';
import { GoogleDrivePicker } from './components/GoogleDrivePicker';
import { HeaderIcon, UserIcon } from './components/icons';
import { summarizeAudio } from './services/geminiService';
import type { SummaryResult, GoogleUser } from './types';
import { SUPPORTED_LANGUAGES } from './constants';
import { GOOGLE_CLIENT_ID } from './config';

type SelectedFile = {
  name: string;
  base64: string;
  mimeType: string;
};

const App: React.FC = () => {
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isGisReady, setIsGisReady] = useState(false);
  const [tokenClient, setTokenClient] = useState<any>(null);
  const [isGoogleConfigured, setIsGoogleConfigured] = useState(true);

  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [language, setLanguage] = useState<string>(SUPPORTED_LANGUAGES[0].value);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Google Identity Services
  useEffect(() => {
    // Check for guest key first
    const guestKey = sessionStorage.getItem('gemini-api-key-guest');
    if (guestKey) {
        setApiKey(guestKey);
    }

    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.startsWith('REPLACE_WITH')) {
        console.error("Google Client ID is not configured. Please add your credentials to the config.ts file.");
        setIsGoogleConfigured(false);
        return;
    }

    const scriptGis = document.createElement('script');
    scriptGis.src = 'https://accounts.google.com/gsi/client';
    scriptGis.async = true;
    scriptGis.defer = true;
    scriptGis.onload = () => {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
        callback: (tokenResponse: any) => {
          if (tokenResponse && tokenResponse.access_token) {
            setAccessToken(tokenResponse.access_token);
            // Fetch user info
            fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { 'Authorization': `Bearer ${tokenResponse.access_token}` }
            })
            .then(res => res.json())
            .then(data => {
                const user = { id: data.sub, email: data.email };
                setGoogleUser(user);
                sessionStorage.removeItem('gemini-api-key-guest'); // Clear guest key on sign-in
                // After user is set, check for their API key
                const storedApiKey = localStorage.getItem(`gemini-api-key-${user.id}`);
                if (storedApiKey) {
                    setApiKey(storedApiKey);
                }
            });
          }
        },
      });
      setTokenClient(client);
      setIsGisReady(true);
    };
    document.body.appendChild(scriptGis);
    return () => { document.body.removeChild(scriptGis); }
  }, []);

  const handleSignIn = () => {
    if (tokenClient) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    }
  };

  const handleReset = () => {
    // Clear auth state
    setGoogleUser(null);
    setAccessToken(null);
    setApiKey(null);

    // Clear stored keys
    if (googleUser) {
        localStorage.removeItem(`gemini-api-key-${googleUser.id}`);
    }
    sessionStorage.removeItem('gemini-api-key-guest');
    
    // Reset app state
    setSelectedFile(null);
    setResult(null);
    setError(null);
  };
  
  const handleApiKeySave = (key: string) => {
    if (googleUser) {
        localStorage.setItem(`gemini-api-key-${googleUser.id}`, key);
    } else {
        sessionStorage.setItem('gemini-api-key-guest', key);
    }
    setApiKey(key);
  };

  const resetState = () => {
    setResult(null);
    setError(null);
  }

  const handleLocalFileSelect = (file: File | null) => {
    resetState();
    if (!file) {
      setSelectedFile(null);
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      const base64Data = (reader.result as string).split(',')[1];
      setSelectedFile({ name: file.name, base64: base64Data, mimeType: file.type });
    };
    reader.onerror = () => {
      setError('Could not read the selected file.');
    };
  };
  
  const handleDriveFileSelect = (file: { name: string; data: string; mimeType: string }) => {
    resetState();
    setSelectedFile({ name: file.name, base64: file.data, mimeType: file.mimeType });
  };


  const handleSummarize = useCallback(async () => {
    if (!selectedFile) {
      setError('Please select an audio file first.');
      return;
    }
    if (!apiKey) {
      setError('API Key is not set.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const { base64, mimeType } = selectedFile;
      const summaryResult = await summarizeAudio(base64, mimeType, language, apiKey);
      setResult(summaryResult);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to analyze the audio. Please try another file.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile, language, apiKey]);

  const hasApiKey = !!apiKey;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 flex flex-col items-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-2xl mx-auto">
        <header className="flex items-center justify-center gap-4 mb-8 text-center">
          <HeaderIcon />
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Audio Summarizer AI
          </h1>
        </header>

        <main className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
            <LanguageSelector
              selectedLanguage={language}
              onLanguageChange={setLanguage}
            />

            <hr className="border-gray-600 !my-6" />

            {!hasApiKey ? (
                <ApiKeyManager 
                    onKeySave={handleApiKeySave} 
                    onSignIn={handleSignIn}
                    user={googleUser}
                    isGisReady={isGisReady}
                    isGoogleConfigured={isGoogleConfigured}
                />
            ) : (
                <div className="space-y-6">
                    <p className="text-lg text-gray-300">
                      Upload an audio file to get started.
                    </p>
                    <FileUpload onFileSelect={handleLocalFileSelect} selectedFileName={selectedFile?.name ?? null} />
                    
                    {accessToken && (
                      <>
                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-gray-600"></div>
                            <span className="flex-shrink mx-4 text-gray-400">OR</span>
                            <div className="flex-grow border-t border-gray-600"></div>
                        </div>
                        
                        <GoogleDrivePicker 
                          onFileSelect={handleDriveFileSelect} 
                          onError={setError} 
                          accessToken={accessToken}
                         />
                      </>
                    )}

                  <button
                    onClick={handleSummarize}
                    disabled={!selectedFile || isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500/50 shadow-lg"
                  >
                    {isLoading ? 'Analyzing...' : 'Summarize Audio'}
                  </button>

                  {isLoading && <Loader />}

                  {error && (
                    <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-lg text-center">
                      <p className="font-semibold">Error</p>
                      <p>{error}</p>
                    </div>
                  )}

                  {result && !isLoading && (
                    <SummaryDisplay summary={result.summary} replies={result.replies} />
                  )}
                </div>
            )}
        </main>
        
        <footer className="text-center mt-8 text-gray-500 text-sm">
            <p className="mb-2">Powered by Gemini</p>
            {googleUser ? (
                <div className='flex items-center justify-center gap-2 text-gray-400'>
                    <UserIcon />
                    <span>{googleUser.email}</span>
                    <button onClick={handleReset} className="text-gray-500 hover:text-red-400 underline transition-colors text-xs font-semibold">
                        Sign Out
                    </button>
                </div>
            ) : hasApiKey && (
                 <button onClick={handleReset} className="text-gray-500 hover:text-red-400 underline transition-colors text-sm font-semibold">
                    Clear API Key
                </button>
            )}
        </footer>
      </div>
    </div>
  );
};

export default App;