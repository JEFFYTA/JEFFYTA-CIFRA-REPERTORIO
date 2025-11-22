"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Music, ListMusic, Loader2 } from 'lucide-react';
import { Song } from "@/types/song";
import ChordRecognizerCore from "@/components/ChordRecognizerCore";
import ChordViewer from "@/components/ChordViewer";
import { useSongManagement } from "@/hooks/useSongManagement";
import { useRepertoireManagement } from "@/hooks/useRepertoireManagement"; // Ainda necessário para o ChordViewer
import { supabase } from "@/integrations/supabase/client";
import { transposeChordLine } from "@/lib/chordUtils";

const ChordRecognizer = () => {
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false);
  const [isRepertoireViewerActive, setIsRepertoireViewerActive] = useState<boolean>(false);
  const [viewerSearchTerm, setViewerSearchTerm] = useState<string>('');
  const [viewerNavigableSongs, setViewerNavigableSongs] = useState<Song[]>([]);
  const [currentViewerSongIndex, setCurrentViewerSongIndex] = useState<number>(0);
  const [activeViewerSongId, setActiveViewerSongId] = useState<string | null>(null);

  const {
    inputText,
    setInputText,
    outputText,
    setOutputText,
    originalOutputText,
    setOriginalOutputText,
    songs,
    setSongs, // Manter setSongs para o ChordViewer
    currentSongIndex,
    newSongTitle,
    setNewSongTitle,
    handleClear,
    handleSaveSong,
    handleLoadSong,
    handleDeleteSong,
    handleUpdateSongChords,
    loadingSongs,
    fetchSongs,
  } = useSongManagement({
    initialInputText: ''
  });

  // useRepertoireManagement é necessário aqui para que o ChordViewer possa exibir repertórios
  const {
    repertoires,
    selectedRepertoireId,
    selectedRepertoire,
  } = useRepertoireManagement({ songs });

  const handleTranspose = (delta: number) => {
    if (!outputText) return;
    const lines = outputText.split('\n');
    const transposedLines = lines.map((line: string) => transposeChordLine(line, delta));
    setOutputText(transposedLines.join('\n'));
    toast.success(`Cifras transpostas em ${delta > 0 ? '+' : ''}${delta} semitons.`);
  };

  const handleRestore = () => {
    if (originalOutputText) {
      setOutputText(originalOutputText);
      toast.info("Cifras restauradas para a versão original.");
    }
  };

  const handleSaveOutput = () => {
    handleSaveSong();
  };

  const handleOutputTextChange = (newText: string) => {
    setOutputText(newText);
    setOriginalOutputText(newText);
  };

  const prepareViewerSongs = useCallback((search: string, isRepertoireMode: boolean) => {
    let baseSongsList: Song[] = [];
    if (isRepertoireMode && selectedRepertoire) {
      baseSongsList = selectedRepertoire.songIds
        .map(id => songs.find(s => s.id === id))
        .filter((s): s is Song => s !== undefined);
    } else {
      baseSongsList = songs;
    }

    const lowerCaseSearch = search.toLowerCase();
    let filtered = baseSongsList.filter(song =>
      song.title.toLowerCase().startsWith(lowerCaseSearch) ||
      song.extractedChords.toLowerCase().includes(lowerCaseSearch)
    );

    filtered.sort((a, b) => a.title.localeCompare(b.title));
    return filtered;
  }, [songs, selectedRepertoire]);

  useEffect(() => {
    if (isViewerOpen) {
      const filteredSongs = prepareViewerSongs(viewerSearchTerm, isRepertoireViewerActive);
      setViewerNavigableSongs(filteredSongs);
    }
  }, [viewerSearchTerm, isViewerOpen, isRepertoireViewerActive, prepareViewerSongs]);

  useEffect(() => {
    if (isViewerOpen && viewerNavigableSongs.length > 0) {
      const currentActiveSongIndexInNewList = viewerNavigableSongs.findIndex(s => s.id === activeViewerSongId);

      if (currentActiveSongIndexInNewList !== -1) {
        setCurrentViewerSongIndex(currentActiveSongIndexInNewList);
      } else {
        setActiveViewerSongId(viewerNavigableSongs[0].id);
        setCurrentViewerSongIndex(0);
      }
    } else if (isViewerOpen && viewerNavigableSongs.length === 0) {
      setActiveViewerSongId(null);
      setCurrentViewerSongIndex(0);
    } else if (!isViewerOpen) {
      setActiveViewerSongId(null);
      setCurrentViewerSongIndex(0);
    }
  }, [viewerNavigableSongs, isViewerOpen, activeViewerSongId]);

  const handleOpenFullScreenViewer = () => {
    setIsRepertoireViewerActive(false);
    setViewerSearchTerm('');

    const allSongsSorted = [...songs].sort((a, b) => a.title.localeCompare(b.title));
    setViewerNavigableSongs(allSongsSorted);
    
    if (allSongsSorted.length > 0) {
      setActiveViewerSongId(allSongsSorted[0].id);
      setCurrentViewerSongIndex(0);
    } else {
      setActiveViewerSongId(null);
      setCurrentViewerSongIndex(0);
    }
    setIsViewerOpen(true);
  };

  const handleSelectViewerSong = (songId: string) => {
    setActiveViewerSongId(songId);
    const index = viewerNavigableSongs.findIndex(s => s.id === songId);
    if (index !== -1) {
      setCurrentViewerSongIndex(index);
    }
  };

  const handleNextViewerSong = () => {
    if (!activeViewerSongId || viewerNavigableSongs.length === 0) return;
    const nextIndex = (currentViewerSongIndex + 1) % viewerNavigableSongs.length;
    const nextSong = viewerNavigableSongs[nextIndex];
    setActiveViewerSongId(nextSong.id);
    setCurrentViewerSongIndex(nextIndex);
  };

  const handlePreviousViewerSong = () => {
    if (!activeViewerSongId || viewerNavigableSongs.length === 0) return;
    const prevIndex = (currentViewerSongIndex - 1 + viewerNavigableSongs.length) % viewerNavigableSongs.length;
    const prevSong = viewerNavigableSongs[prevIndex];
    setActiveViewerSongId(prevSong.id);
    setCurrentViewerSongIndex(prevIndex);
  };

  const currentViewerSong = activeViewerSongId
    ? viewerNavigableSongs.find(s => s.id === activeViewerSongId)
    : null;

  // O handleSignOut foi movido para HomePage
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erro ao sair: " + error.message);
      console.error("Erro ao sair:", error);
    } else {
      toast.success("Você foi desconectado.");
      // Não precisa mais de setSession(null) aqui, pois o App.tsx gerencia
      handleClear();
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-50 p-4 space-y-4 lg:space-y-0 lg:space-x-4">
      <ChordRecognizerCore
        inputText={inputText}
        onInputTextChange={setInputText}
        outputText={outputText}
        onOutputTextChange={handleOutputTextChange}
        onTranspose={handleTranspose}
        onRestore={handleRestore}
        onClear={handleClear}
        onSaveOutput={handleSaveOutput}
        onOpenFullScreenViewer={handleOpenFullScreenViewer}
        onSignOut={handleSignOut} // Mantido para o botão de sair no ChordRecognizerCore
        newSongTitle={newSongTitle}
        onNewSongTitleChange={setNewSongTitle}
      />

      <ChordViewer
        open={isViewerOpen}
        onOpenChange={setIsViewerOpen}
        currentSong={currentViewerSong}
        viewerNavigableSongs={viewerNavigableSongs}
        currentViewerSongIndex={currentViewerSongIndex}
        onNextSong={handleNextViewerSong}
        onPreviousSong={handlePreviousViewerSong}
        onSearchTermChange={setViewerSearchTerm}
        searchTerm={viewerSearchTerm}
        searchResults={viewerNavigableSongs.filter(s => s.id !== activeViewerSongId)}
        onSelectViewerSong={handleSelectViewerSong}
        isRepertoireViewerActive={isRepertoireViewerActive}
        selectedRepertoireName={selectedRepertoire?.name || null}
        onContentChange={(newContent) => {
          if (currentViewerSong) {
            handleUpdateSongChords(currentViewerSong.id, newContent);
          }
        }}
        onSaveTransposition={async (songId, newContent) => {
          await handleUpdateSongChords(songId, newContent);
        }}
        onSongsRefetch={fetchSongs}
      />
    </div>
  );
};

export default ChordRecognizer;