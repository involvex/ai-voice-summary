
import React, { useState } from 'react';
import { CopyIcon, CheckIcon } from './icons';

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


export const SummaryDisplay: React.FC<SummaryDisplayProps> = ({ summary, replies }) => {
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
