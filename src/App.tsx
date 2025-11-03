"use client";

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ChordRecognizer from "./pages/ChordRecognizer";
import NotFound from "./pages/NotFound";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ChordRecognizer />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;