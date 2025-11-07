"use client";

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ChordRecognizer from "./pages/ChordRecognizer";
import NotFound from "./pages/NotFound";
import { Butterfly } from 'lucide-react'; // Import Butterfly icon

const App = () => {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-50">
        <header className="w-full p-4 bg-white dark:bg-gray-800 shadow-md flex items-center justify-center lg:justify-start">
          <Butterfly className="h-8 w-8 text-purple-600 mr-2" />
          <h1 className="text-2xl font-bold text-purple-600">CIFRA-REPERTORIO</h1>
        </header>
        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<ChordRecognizer />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;