
import React, { useState, useCallback } from 'react';
import { LanguageSelector } from './components/LanguageSelector';
import { FileUpload } from './components/FileUpload';
import { SummaryDisplay } from './components/SummaryDisplay';
import { Loader } from './components/Loader';
import { HeaderIcon } from './components/icons';
import { summarizeAudio } from './services/geminiService';
import type { SummaryResult } from './types';
import { SUPPORTED_LANGUAGES } from './constants';

const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<string>(SUPPORTED_LANGUAGES[0].value);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    setResult(null);
    setError(null);
  };

  const handleSummarize = useCallback(async () => {
    if (!selectedFile) {
      setError('Please select an audio file first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onloadend = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          const mimeType = selectedFile.type;

          const summaryResult = await summarizeAudio(base64Data, mimeType, language);
          setResult(summaryResult);
        } catch (err) {
          console.error(err);
          setError('Failed to analyze the audio. Please try another file or check the console.');
        } finally {
          setIsLoading(false);
        }
      };
      reader.onerror = () => {
        console.error('File reading error');
        setError('Could not read the selected file.');
        setIsLoading(false);
      };
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred.');
      setIsLoading(false);
    }
  }, [selectedFile, language]);

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
          <div className="space-y-4">
            <p className="text-lg text-gray-300">
              Get a quick summary of any voice message or audio file.
            </p>
            <LanguageSelector
              selectedLanguage={language}
              onLanguageChange={setLanguage}
            />
            <FileUpload onFileSelect={handleFileSelect} selectedFile={selectedFile} />
          </div>

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
        </main>
        
        <footer className="text-center mt-8 text-gray-500 text-sm">
            <p>Powered by Gemini</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
