"use client";

import React from 'react';
import { notaMap } from "@/lib/chordUtils";

interface StyledChordDisplayProps {
  content: string;
  fontSize: number;
}

// Regex para encontrar padrões de cifra comuns, incluindo baixo invertido
// Adicionado \b (word boundary) no início e no fim para garantir que apenas cifras isoladas sejam reconhecidas.
// Ex: C, C#m7, G/B, F7M/C
const chordRegex = /\b([CDEFGAB][#b]?)(m|°)?(6|7|7M|7\(9-\)|7\(9\)|7\(4\)|9|11|13|13-|add9|sus4)?(\/[CDEFGAB][#b]?)?\b/g;

const StyledChordDisplay: React.FC<StyledChordDisplayProps> = ({ content, fontSize }) => {
  const renderLine = (line: string, index: number) => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // Reset regex lastIndex for each line to ensure it starts matching from the beginning
    chordRegex.lastIndex = 0;
    let match;

    while ((match = chordRegex.exec(line)) !== null) {
      const chord = match[0];
      const startIndex = match.index;
      const endIndex = chordRegex.lastIndex;

      // Add text before the chord
      if (startIndex > lastIndex) {
        parts.push(<span key={`text-${index}-${lastIndex}`}>{line.substring(lastIndex, startIndex)}</span>);
      }

      // Check if it's a valid chord root using notaMap
      const rootMatch = match[1]; // e.g., "C", "G#", "Bb"
      const isValidChordRoot = notaMap[rootMatch] !== undefined;

      if (isValidChordRoot) {
        parts.push(
          <strong key={`chord-${index}-${startIndex}`} className="text-purple-600 dark:text-purple-400">
            {chord}
          </strong>
        );
      } else {
        // If it matches the regex pattern but the root is not recognized, render as plain text
        parts.push(<span key={`invalid-chord-${index}-${startIndex}`}>{chord}</span>);
      }

      lastIndex = endIndex;
    }

    // Add any remaining text after the last chord
    if (lastIndex < line.length) {
      parts.push(<span key={`text-end-${index}-${lastIndex}`}>{line.substring(lastIndex)}</span>);
    }

    return <div key={`line-${index}`}>{parts}</div>;
  };

  return (
    <pre
      className="w-full h-full border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent whitespace-pre-wrap"
      style={{ fontSize: `${fontSize}rem`, lineHeight: '1.5' }}
    >
      {content.split('\n').map((line, index) => renderLine(line, index))}
    </pre>
  );
};

export default StyledChordDisplay;