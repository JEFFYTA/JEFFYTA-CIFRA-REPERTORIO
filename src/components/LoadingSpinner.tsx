"use client";

import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
    </div>
  );
};

export default LoadingSpinner;