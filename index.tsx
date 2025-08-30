import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

// --- START OF types.ts ---
interface Language {
  value: string;
  label: string;
}

interface SummaryResult {
  summary: string;
  replies: string[];
}

interface GoogleUser {
  id: string;
  email: string;
}
// --- END OF types.ts ---

// --- START OF constants.ts ---
const SUPPORTED_LANGUAGES: Language[] = [
  { value: 'English', label: 'English' },
  { value: 'Spanish', label: 'Español' },
  { value: 'French', label: 'Français' },
  { value: 'German', label: 'Deutsch' },
  { value: 'Italian', label: 'Italiano' },
  { value: 'Portuguese', label: 'Português' },
  { value: 'Japanese', label: '日本語' },
  { value: 'Korean', label: '한국어' },
  { value: 'Mandarin Chinese', label: '中文' },
];
// --- END OF constants.ts ---

// --- START OF config.ts ---
const GOOGLE_CLIENT_ID = 'REPLACE_WITH_YOUR_GOOGLE_CLIENT_ID';
const GOOGLE_DEVELOPER_KEY = 'REPLACE_WITH_YOUR_GOOGLE_DEVELOPER_KEY';
// --- END OF config.ts ---

// --- START OF components/icons.tsx ---
const HeaderIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12c0 4.971 3.582 9.123 8.205 9.873" />
        <path d="M7 12a5 5 0 0 1 5-5" />
        <path d="M12 12a5 5 0 0 1 5 5" />
    </svg>
);

const UploadIcon: React.FC = () => (
    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
    </svg>
);

const CopyIcon: React.FC = () => (
    <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
    </svg>
);

const CheckIcon: React.FC = () => (
    <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
    </svg>
);

const GoogleDriveIcon: React.FC = () => (
    <svg className="w-6 h-6 mr-2" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <path fill="#4CAF50" d="M32.1,10H15.9l-7.4,12.9l7.4,12.9h16.2l7.4-12.9L32.1,10z"></path>
        <path fill="#2E7D32" d="M15.9,35.8l-7.4-12.9L15.9,10h8.1L15.9,35.8z"></path>
        <path fill="#FFC107" d="M32.1,10l-7.4,12.9l7.4,12.9L40,22.9L32.1,10z"></path>
        <path fill="#1E88E5" d="M24,22.9l8.1,12.9H15.9L24,22.9z"></path>
    </svg>
);

const KeyIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H5v-2H3v-2H1v-4a6 6 0 016-6h4a6 6 0 016 6z" />
    </svg>
);

const UserIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);
// --- END OF components/icons.tsx ---


// --- START OF services/geminiService.ts ---
async function summarizeAudio(
  base64Audio: string, 
  mimeType: string, 
  language: string,
  apiKey: string
): Promise<SummaryResult> {
  if (!apiKey) {
    throw new Error("Gemini API key is not provided.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-2.5-flash";

  const audioPart = {
    inlineData: {
      data: base64Audio,
      mimeType: mimeType,
    },
  };

  const textPart = {
    text: `You are an expert audio analyst. Listen to this audio carefully. 
    1. Provide a concise summary of the audio content in 2-5 lines.
    2. Suggest 3 short, distinct, and plausible replies to the message.
    3. The entire response, including summary and replies, must be in ${language}.
    4. Your response must be in JSON format according to the provided schema.`,
  };

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: [audioPart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: `A 2-5 line summary of the audio in ${language}.`,
            },
            replies: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
              description: `An array of 3 short, possible replies in ${language}.`,
            },
          },
          required: ["summary", "replies"],
        },
      },
    });

    const jsonText = response.text.trim();
    try {
        const parsedResult = JSON.parse(jsonText);
        if (parsedResult && typeof parsedResult.summary === 'string' && Array.isArray(parsedResult.replies)) {
            return parsedResult as SummaryResult;
        } else {
            throw new Error("Parsed JSON does not match the expected structure.");
        }
    } catch(e) {
        console.error("Failed to parse JSON response:", jsonText);
        throw new Error("The API returned an invalid JSON format. The raw response was: " + jsonText);
    }

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get a response from the AI model.");
  }
}
// --- END OF services/geminiService.ts ---

// --- START OF components/Loader.tsx ---
const Loader: React.FC = () => {
  return (
    <div className="flex justify-center items-center py-4">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-400"></div>
      <p className="ml-4 text-gray-400">AI is thinking...</p>
    </div>
  );
};
// --- END OF components/Loader.tsx ---

// --- START OF components/LanguageSelector.tsx ---
interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selectedLanguage, onLanguageChange }) => {
  return (
    <div>
      <label htmlFor="language-select" className="block text-sm font-medium text-gray-300 mb-2">
        Language for Summary
      </label>
      <select
        id="language-select"
        value={selectedLanguage}
        onChange={(e) => onLanguageChange(e.target.value)}
        className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 transition"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.value} value={lang.value}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
};
// --- END OF components/LanguageSelector.tsx ---

// --- START OF components/FileUpload.tsx ---
interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  selectedFileName: string | null;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, selectedFileName }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    onFileSelect(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  };
  
  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files ? event.dataTransfer.files[0] : null;
    onFileSelect(file);
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="audio/*"
      />
      <label 
        onClick={handleButtonClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="flex flex-col items-center justify-center w-full h-32 px-4 transition bg-gray-700/50 border-2 border-gray-500 border-dashed rounded-md appearance-none cursor-pointer hover:border-blue-400 focus:outline-none"
      >
        <span className="flex items-center space-x-2">
            <UploadIcon />
            <span className="font-medium text-gray-400">
                {selectedFileName ? 'File selected: ' : 'Drop files to attach, or '}
                <span className={selectedFileName ? 'font-bold text-blue-400' : 'text-blue-400 underline'}>
                    {selectedFileName ? selectedFileName : 'browse'}
                </span>
            </span>
        </span>
      </label>
    </div>
  );
};
// --- END OF components/FileUpload.tsx ---

// --- START OF components/SummaryDisplay.tsx ---
interface SummaryDisplayProps {
  summary: string;
  replies: string[];
}

const ReplyButton: React.FC<{ text: string }> = ({ text }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="flex items-center justify-between w-full text-left bg-gray-700/60 hover:bg-gray-700 p-3 rounded-lg transition-colors duration-200"
        >
            <span className="text-gray-200 mr-4">{text}</span>
            {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
    );
};

const SummaryDisplay: React.FC<SummaryDisplayProps> = ({ summary, replies }) => {
  return (
    <div className="animate-fade-in space-y-6 bg-gray-800/30 p-6 rounded-xl">
      <div>
        <h2 className="text-xl font-semibold text-blue-300 mb-3">Summary</h2>
        <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">
          {summary}
        </p>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-blue-300 mb-3">Suggested Replies</h3>
        <div className="space-y-3">
            {replies.map((reply, index) => (
                <ReplyButton key={index} text={reply} />
            ))}
        </div>
      </div>
    </div>
  );
};
// --- END OF components/SummaryDisplay.tsx ---


// --- START OF components/ApiKeyManager.tsx ---
interface ApiKeyManagerProps {
  onKeySave: (key: string) => void;
  onSignIn: () => void;
  user: GoogleUser | null;
  isGisReady: boolean;
  isGoogleConfigured: boolean;
}

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ onKeySave, onSignIn, user, isGisReady, isGoogleConfigured }) => {
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
// --- END OF components/ApiKeyManager.tsx ---

// --- START OF components/GoogleDrivePicker.tsx ---
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

const GoogleDrivePicker: React.FC<GoogleDrivePickerProps> = ({ onFileSelect, onError, accessToken }) => {
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
// --- END OF components/GoogleDrivePicker.tsx ---

// --- START OF App.tsx ---
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

  useEffect(() => {
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
            fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { 'Authorization': `Bearer ${tokenResponse.access_token}` }
            })
            .then(res => res.json())
            .then(data => {
                const user = { id: data.sub, email: data.email };
                setGoogleUser(user);
                sessionStorage.removeItem('gemini-api-key-guest'); 
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
    setGoogleUser(null);
    setAccessToken(null);
    setApiKey(null);

    if (googleUser) {
        localStorage.removeItem(`gemini-api-key-${googleUser.id}`);
    }
    sessionStorage.removeItem('gemini-api-key-guest');
    
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
// --- END OF App.tsx ---

// --- Main render ---
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
