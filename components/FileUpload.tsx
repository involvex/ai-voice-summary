import React, { useRef } from 'react';
import { UploadIcon } from './icons.tsx';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  selectedFileName: string | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, selectedFileName }) => {
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