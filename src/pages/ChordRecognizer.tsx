"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Music, ListMusic, Loader2 } from 'lucide-react';
import { Song } from "@/types/song";
import MySongsPanel from "@/components/MySongsPanel";
import MyRepertoiresPanel from "@/components/MyRepertoiresPanel";
import ChordRecognizerCore from "@/components/ChordRecognizerCore";
import ChordViewer from "@/components/ChordViewer";
import { useSongManagement } from "@/hooks/useSongManagement";
import { useRepertoireManagement } from "@/hooks/useRepertoireManagement";
import { supabase } from "@/integrations/supabase/client";
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';


const ChordRecognizer = () => {
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false);
  const [isSongsPanelOpen, setIsSongsPanelOpen] = useState<boolean>(false);
  const [isRepertoiresPanelOpen, setIsRepertoiresPanelOpen] = useState<boolean>(false);

  const [isRepertoireViewerActive, setIsRepertoireViewerActive] = useState<boolean>(false);
  const [viewerSearchTerm, setViewerSearchTerm] = useState<string>('');
  const [viewerNavigableSongs, setViewerNavigableSongs] = useState<Song[]>([]);
  const [currentViewerSongIndex, setCurrentViewerSongIndex] = useState<number>(0);
  const [activeViewerSongId, setActiveViewerSongId] = useState<string | null>(null);

  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

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
  } = useSongManagement({
    initialInputText: '',
    onInputTextChange: (text) => { /* No-op, handled internally by hook */ }
  });

  const {
    repertoires,
    selectedRepertoireId,
    setSelectedRepertoireId,
    newRepertoireName,
    setNewRepertoireName,
    selectedRepertoire,
    handleCreateRepertoire,
    handleSelectRepertoire,
    handleDeleteRepertoire,
    handleToggleSongInRepertoire,
    loadingRepertoires,
  } = useRepertoireManagement({ songs });

  const handleTranspose = (delta: number) => {
    if (!outputText) return;
    const lines = outputText.split('\n');
    const { transposeChordLine } = require("@/lib/chordUtils"); // Import dynamically to avoid circular dependency if chordUtils uses outputText
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

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(outputText);
      toast.success("Cifras copiadas para a área de transferência!");
    } catch (err) {
      console.error("Failed to copy text: ", err);
      toast.error("Falha ao copiar cifras.");
    }
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
    setViewerNavigableSongs(filtered);
  }, [songs, selectedRepertoire]);

  useEffect(() => {
    if (isViewerOpen) {
      prepareViewerSongs(viewerSearchTerm, isRepertoireViewerActive);
    }
  }, [viewerSearchTerm, isViewerOpen, isRepertoireViewerActive, prepareViewerSongs]);

  const handleOpenFullScreenViewer = () => {
    setIsRepertoireViewerActive(false); // Default to all songs view
    setViewerSearchTerm('');
    prepareViewerSongs('', false); // Load all songs initially
    if (songs.length > 0) {
      setActiveViewerSongId(songs[0].id);
      setCurrentViewerSongIndex(0);
    } else {
      setActiveViewerSongId(null);
      setCurrentViewerSongIndex(0);
    }
    setIsViewerOpen(true);
  };

  const handleOpenRepertoireViewer = () => {
    if (!selectedRepertoireId) {
      toast.error("Nenhum repertório selecionado.");
      return;
    }
    const rep = repertoires.find(r => r.id === selectedRepertoireId);
    if (!rep || rep.songIds.length === 0) {
      toast.error("O repertório selecionado não possui músicas.");
      return;
    }

    setIsRepertoireViewerActive(true);
    setViewerSearchTerm(''); // Clear search for repertoire view
    prepareViewerSongs('', true); // Load repertoire songs

    const repertoireSongs = rep.songIds
      .map(id => songs.find(s => s.id === id))
      .filter((s): s is Song => s !== undefined)
      .sort((a, b) => a.title.localeCompare(b.title));

    if (repertoireSongs.length > 0) {
      setActiveViewerSongId(repertoireSongs[0].id);
      setCurrentViewerSongIndex(0);
    } else {
      setActiveViewerSongId(null);
      setCurrentViewerSongIndex(0);
    }

    setIsViewerOpen(true);
    toast.info(`Abrindo repertório "${rep.name}" em tela cheia.`);
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

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Card className="w-full max-w-md p-8 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Faça login para usar o Reconhecedor de Cifras</CardTitle>
          </CardHeader>
          <CardContent>
            <Auth
              supabaseClient={supabase}
              providers={[]}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: 'hsl(var(--primary))',
                      brandAccent: 'hsl(var(--primary-foreground))',
                    },
                  },
                },
              }}
              theme="light"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-6 p-4 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-50">
      <ChordRecognizerCore
        inputText={inputText}
        onInputTextChange={setInputText}
        outputText={outputText}
        onTranspose={handleTranspose}
        onRestore={handleRestore}
        onClear={handleClear}
        onCopyToClipboard={handleCopyToClipboard}
        onOpenFullScreenViewer={handleOpenFullScreenViewer}
        onSignOut={() => supabase.auth.signOut()}
      />

      <div className="w-full lg:w-auto flex lg:flex-col gap-4 justify-center lg:justify-start">
        <Button onClick={() => setIsSongsPanelOpen(true)} className="w-full lg:w-auto" disabled={loadingSongs}>
          {loadingSongs ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Music className="mr-2 h-4 w-4" />} Minhas Músicas
        </Button>
        <Button onClick={() => setIsRepertoiresPanelOpen(true)} className="w-full lg:w-auto" disabled={loadingRepertoires}>
          {loadingRepertoires ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ListMusic className="mr-2 h-4 w-4" />} Meus Repertórios
        </Button>
      </div>

      <MySongsPanel
        open={isSongsPanelOpen}
        onOpenChange={setIsSongsPanelOpen}
        songs={songs}
        currentSongIndex={currentSongIndex !== null ? songs.findIndex(s => s.id === songs[currentSongIndex]?.id) : null}
        newSongTitle={newSongTitle}
        setNewSongTitle={setNewSongTitle}
        handleSaveSong={handleSaveSong}
        handleLoadSong={handleLoadSong}
        handleDeleteSong={handleDeleteSong}
        selectedRepertoireId={selectedRepertoireId}
        selectedRepertoire={selectedRepertoire}
        handleToggleSongInRepertoire={handleToggleSongInRepertoire}
      />

      <MyRepertoiresPanel
        open={isRepertoiresPanelOpen}
        onOpenChange={setIsRepertoiresPanelOpen}
        repertoires={repertoires}
        selectedRepertoireId={selectedRepertoireId}
        setSelectedRepertoireId={setSelectedRepertoireId}
        newRepertoireName={newRepertoireName}
        setNewRepertoireName={setNewRepertoireName}
        handleCreateRepertoire={handleCreateRepertoire}
        handleSelectRepertoire={handleSelectRepertoire}
        handleDeleteRepertoire={handleDeleteRepertoire}
        handleOpenRepertoireViewer={handleOpenRepertoireViewer}
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
        searchResults={viewerNavigableSongs.filter(song =>
          song.title.toLowerCase().startsWith(viewerSearchTerm.toLowerCase())
        )}
        onSelectViewerSong={handleSelectViewerSong}
        isRepertoireViewerActive={isRepertoireViewerActive}
        selectedRepertoireName={selectedRepertoire?.name || null}
        onContentChange={(newContent) => {
          if (currentViewerSong) {
            // Update the content in the local state for immediate display
            const updatedSongs = viewerNavigableSongs.map(s =>
              s.id === currentViewerSong.id ? { ...s, extractedChords: newContent } : s
            );
            setViewerNavigableSongs(updatedSongs);
            // Also update the main songs list
            setSongs(prevSongs => prevSongs.map(s =>
              s.id === currentViewerSong.id ? { ...s, extractedChords: newContent } : s
            ));
            handleUpdateSongChords(currentViewerSong.id, newContent);
          }
        }}
        onSaveTransposition={handleUpdateSongChords}
      />
    </div>
  );
};

export default ChordRecognizer;