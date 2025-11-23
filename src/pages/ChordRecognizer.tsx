"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Music, ListMusic, Loader2, ArrowLeft } from 'lucide-react';
import { Song } from "@/types/song";
import ChordRecognizerCore from "@/components/ChordRecognizerCore";
import ChordViewer from "@/components/ChordViewer";
import { useSongManagement } from "@/hooks/useSongManagement";
import { useRepertoireManagement } from "@/hooks/useRepertoireManagement";
import { supabase } from "@/integrations/supabase/client";
import { transposeChordLine } from "@/lib/chordUtils";
import { useNavigate } from 'react-router-dom';

const ChordRecognizer = () => {
  const navigate = useNavigate();
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
    setSongs,
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

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erro ao sair: " + error.message);
      console.error("Erro ao sair:", error);
    } else {
      toast.success("Você foi desconectado.");
      handleClear();
    }
  };

  const handleImportFile = (file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const fileContent = e.target?.result as string;
      
      // Verificar se o arquivo é um .txt
      if (file.name.toLowerCase().endsWith('.txt') || file.type === 'text/plain') {
        setInputText(fileContent);
        toast.success(`Arquivo "${file.name}" importado.`);
      } else {
        // Se não for .txt, exibir uma mensagem de erro e instrução
        toast.error(
          "Apenas arquivos de texto simples (.txt) são suportados para importação. " +
          "Por favor, converta seu arquivo RTF para TXT antes de importar (ex: abra no Bloco de Notas e salve como .txt)."
        );
        console.warn("Tentativa de importar arquivo não-TXT:", file.name, file.type);
      }
    };

    reader.onerror = () => {
      toast.error("Erro ao ler o arquivo.");
    };

    reader.readAsText(file);
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-50 p-4">
      <div className="flex items-center mb-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mr-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-bold flex-1 text-center lg:text-left">Reconhecedor de Cifras</h2>
      </div>
      <div className="flex-1 flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
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
          onSignOut={handleSignOut}
          newSongTitle={newSongTitle}
          onNewSongTitleChange={setNewSongTitle}
          onImportFile={handleImportFile}
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
    </div>
  );
};

export default ChordRecognizer;