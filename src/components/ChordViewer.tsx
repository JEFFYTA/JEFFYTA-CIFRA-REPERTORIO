"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight, Save, Minimize2, Search, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Song } from "@/types/song";
import { transposeChordLine } from "@/lib/chordUtils";
import { toast } from "sonner";

interface ChordViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSong: Song | null;
  viewerNavigableSongs: Song[];
  currentViewerSongIndex: number;
  onNextSong: () => void;
  onPreviousSong: () => void;
  onSearchTermChange: (term: string) => void;
  searchTerm: string;
  searchResults: Song[];
  onSelectViewerSong: (songId: string) => void;
  isRepertoireViewerActive: boolean;
  selectedRepertoireName: string | null;
  onContentChange: (newContent: string) => void;
  onSaveTransposition: (songId: string, newContent: string) => void;
}

const ChordViewer: React.FC<ChordViewerProps> = ({
  open,
  onOpenChange,
  currentSong,
  viewerNavigableSongs,
  currentViewerSongIndex,
  onNextSong,
  onPreviousSong,
  onSearchTermChange,
  searchTerm,
  searchResults,
  onSelectViewerSong,
  isRepertoireViewerActive,
  selectedRepertoireName,
  onContentChange,
  onSaveTransposition,
}) => {
  const [viewerTransposeDelta, setViewerTransposeDelta] = useState<number>(0);
  const [viewerFontSize, setViewerFontSize] = useState<number>(1.2);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);

  useEffect(() => {
    // Reset transpose and font size when a new song is loaded or viewer opens/closes
    setViewerTransposeDelta(0);
    setViewerFontSize(1.2);
    setShowSearchResults(false);
  }, [currentSong, open]);

  const getViewerContent = useCallback(() => {
    if (!currentSong) {
      if (!isRepertoireViewerActive && searchTerm.trim() !== '' && searchResults.length === 0) {
        return "Nenhuma música encontrada com este termo.";
      }
      if (!isRepertoireViewerActive && searchTerm.trim() === '') {
        return "Busque por uma música para começar.";
      }
      if (isRepertoireViewerActive && viewerNavigableSongs.length === 0) {
        return "Este repertório não possui músicas.";
      }
      return '';
    }

    let contentToDisplay = currentSong.extractedChords; // Use the actual extracted chords from the song object

    if (contentToDisplay) {
      let lines = contentToDisplay.split('\n');
      lines = lines.map(line => transposeChordLine(line, viewerTransposeDelta));
      return lines.join('\n');
    }
    return '';
  }, [currentSong, viewerTransposeDelta, isRepertoireViewerActive, searchTerm, searchResults, viewerNavigableSongs]);

  const getViewerTitle = () => {
    if (!currentSong) {
      if (!isRepertoireViewerActive && searchTerm.trim() !== '' && searchResults.length === 0) {
        return "Nenhuma música encontrada";
      }
      return "Visualizador de Cifras";
    }

    if (isRepertoireViewerActive && selectedRepertoireName) {
      return `${selectedRepertoireName} - ${currentSong.title}`;
    }
    return currentSong.title;
  };

  const handleInternalSaveTransposition = () => {
    if (!currentSong || viewerTransposeDelta === 0) {
      toast.info("Nenhuma transposição para salvar ou nenhuma música selecionada.");
      return;
    }

    const currentTransposedContent = getViewerContent();
    onSaveTransposition(currentSong.id, currentTransposedContent);
    setViewerTransposeDelta(0); // Reset internal delta after saving
    toast.success("Transposição salva com sucesso!");
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchTermChange(e.target.value);
    setShowSearchResults(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[90vw] h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b dark:border-gray-700">
          <DialogTitle className="text-xl text-center">
            {getViewerTitle()}
          </DialogTitle>
        </DialogHeader>
        <div className="p-4 border-b dark:border-gray-700">
          {!isRepertoireViewerActive && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input
                placeholder="Buscar músicas na tela cheia..."
                value={searchTerm}
                onChange={handleSearchInputChange}
                className="pl-9 w-full"
              />
            </div>
          )}
          {!isRepertoireViewerActive && showSearchResults && searchTerm.trim() !== '' && searchResults.length > 0 && (
            <ScrollArea className="mt-2 h-40 border rounded-md">
              <div className="p-2 space-y-1">
                {searchResults.map((song) => (
                  <Button
                    key={song.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start",
                      currentSong?.id === song.id && "bg-accent text-accent-foreground"
                    )}
                    onClick={() => {
                      onSelectViewerSong(song.id);
                      setShowSearchResults(false); // Hide results after selection
                    }}
                  >
                    {song.title}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          )}
          {!isRepertoireViewerActive && showSearchResults && searchTerm.trim() !== '' && searchResults.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 mt-2">Nenhuma música encontrada.</p>
          )}
        </div>
        <div className="flex-1 p-4 overflow-auto font-mono leading-relaxed">
          <Textarea
            value={getViewerContent()}
            onChange={(e) => onContentChange(e.target.value)}
            className="w-full h-full resize-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
            style={{ fontSize: `${viewerFontSize}rem` }}
            disabled={!currentSong}
          />
        </div>
        <div className="flex flex-wrap justify-center gap-2 p-4 border-t dark:border-gray-700">
          <div className="flex gap-2">
            <Button onClick={() => setViewerTransposeDelta(prev => prev - 1)} variant="secondary" disabled={!currentSong}>Transpor -1</Button>
            <Button onClick={() => setViewerTransposeDelta(prev => prev + 1)} variant="secondary" disabled={!currentSong}>Transpor +1</Button>
            <Button
              onClick={handleInternalSaveTransposition}
              variant="default"
              disabled={!currentSong || viewerTransposeDelta === 0}
            >
              <Save className="mr-2 h-4 w-4" /> Salvar Transposição
            </Button>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setViewerFontSize(prev => Math.max(prev - 0.1, 0.8))} variant="secondary" disabled={!currentSong}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button onClick={() => setViewerFontSize(prev => Math.min(prev + 0.1, 2.5))} variant="secondary" disabled={!currentSong}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={onPreviousSong}
              disabled={!currentSong || viewerNavigableSongs.length <= 1}
              variant="outline"
            >
              <ChevronLeft className="h-4 w-4" /> Anterior
            </Button>
            <Button
              onClick={onNextSong}
              disabled={!currentSong || viewerNavigableSongs.length <= 1}
              variant="outline"
            >
              Próxima <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => onOpenChange(false)} variant="ghost">
            <Minimize2 className="mr-2 h-4 w-4" /> Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChordViewer;