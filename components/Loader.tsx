
import React from 'react';

export const Loader: React.FC = () => {
  return (
    <div className="flex justify-center items-center py-4">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-400"></div>
      <p className="ml-4 text-gray-400">AI is thinking...</p>
    </div>
  );
};
