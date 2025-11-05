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
import CustomLoginForm from "@/components/CustomLoginForm";
import { useSongManagement } from "@/hooks/useSongManagement";
import { useRepertoireManagement } from "@/hooks/useRepertoireManagement";
import { supabase } from "@/integrations/supabase/client";
import { transposeChordLine } from "@/lib/chordUtils";

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
  const [loadingSession, setLoadingSession] = useState<boolean>(true);

  const getSession = useCallback(async () => {
    setLoadingSession(true);
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    setLoadingSession(false);
  }, []);

  useEffect(() => {
    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoadingSession(false);
    });

    return () => subscription.unsubscribe();
  }, [getSession]);

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
    initialInputText: ''
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

  // NOVO: Manipulador para quando o outputText é alterado diretamente
  const handleOutputTextChange = (newText: string) => {
    setOutputText(newText);
    setOriginalOutputText(newText); // Atualiza o originalOutputText para que o restore funcione com a edição direta
  };

  const prepareViewerSongs = useCallback((search: string, isRepertoireMode: boolean) => {
    let baseSongsList: Song[] = [];
    if (isRepertoireMode && selectedRepertoire) {
      console.log("Viewer: prepareViewerSongs - Repertoire Mode Active.");
      console.log("Viewer: prepareViewerSongs - selectedRepertoire:", selectedRepertoire);
      console.log("Viewer: prepareViewerSongs - selectedRepertoire.songIds:", selectedRepertoire.songIds);
      console.log("Viewer: prepareViewerSongs - Current 'songs' state (IDs and Titles):", songs.map(s => ({ id: s.id, title: s.title })));

      baseSongsList = selectedRepertoire.songIds
        .map(id => {
          const foundSong = songs.find(s => s.id === id);
          console.log(`Viewer: prepareViewerSongs - Looking for song ID ${id}, found: ${foundSong ? foundSong.title : 'NOT FOUND'}`);
          return foundSong;
        })
        .filter((s): s is Song => s !== undefined);
      console.log("Viewer: prepareViewerSongs - baseSongsList (after map and filter):", baseSongsList.map(s => ({ id: s.id, title: s.title })));
    } else {
      console.log("Viewer: prepareViewerSongs - All Songs Mode Active.");
      baseSongsList = songs;
    }

    const lowerCaseSearch = search.toLowerCase();
    let filtered = baseSongsList.filter(song =>
      song.title.toLowerCase().startsWith(lowerCaseSearch) ||
      song.extractedChords.toLowerCase().includes(lowerCaseSearch)
    );

    filtered.sort((a, b) => a.title.localeCompare(b.title));
    console.log("Viewer: prepareViewerSongs - Final filtered and sorted songs:", filtered.map(s => ({ id: s.id, title: s.title })));
    return filtered;
  }, [songs, selectedRepertoire]);

  // Este useEffect é responsável por atualizar a lista de músicas navegáveis
  useEffect(() => {
    if (isViewerOpen) {
      const filteredSongs = prepareViewerSongs(viewerSearchTerm, isRepertoireViewerActive);
      setViewerNavigableSongs(filteredSongs);
      console.log("Viewer: useEffect (update viewerNavigableSongs) - viewerNavigableSongs set to:", filteredSongs);
    }
  }, [viewerSearchTerm, isViewerOpen, isRepertoireViewerActive, prepareViewerSongs]);

  // NOVO useEffect para sincronizar a música ativa e o índice
  useEffect(() => {
    console.log("Viewer: useEffect (sync activeViewerSongId) triggered. isViewerOpen:", isViewerOpen, "viewerNavigableSongs.length:", viewerNavigableSongs.length, "activeViewerSongId (before):", activeViewerSongId);
    if (isViewerOpen && viewerNavigableSongs.length > 0) {
      const currentActiveSongIndexInNewList = viewerNavigableSongs.findIndex(s => s.id === activeViewerSongId);

      if (currentActiveSongIndexInNewList !== -1) {
        // Se a música ativa anterior ainda estiver na nova lista, mantenha-a ativa e atualize seu índice
        setCurrentViewerSongIndex(currentActiveSongIndexInNewList);
        console.log("Viewer: Active song found in new list. activeViewerSongId:", activeViewerSongId, "currentViewerSongIndex:", currentActiveSongIndexInNewList);
      } else {
        // Caso contrário, defina a primeira música da nova lista como ativa
        setActiveViewerSongId(viewerNavigableSongs[0].id);
        setCurrentViewerSongIndex(0);
        console.log("Viewer: Active song NOT found, setting to first song. activeViewerSongId:", viewerNavigableSongs[0].id, "currentViewerSongIndex: 0");
      }
    } else if (isViewerOpen && viewerNavigableSongs.length === 0) {
      // Se o visualizador estiver aberto, mas não houver músicas navegáveis, limpe a música ativa
      setActiveViewerSongId(null);
      setCurrentViewerSongIndex(0);
      console.log("Viewer: open but no navigable songs. activeViewerSongId: null, currentViewerSongIndex: 0");
    } else if (!isViewerOpen) {
      // Quando o visualizador fecha, redefina a música ativa e o índice
      setActiveViewerSongId(null);
      setCurrentViewerSongIndex(0);
      console.log("Viewer: closed. activeViewerSongId: null, currentViewerSongIndex: 0");
    }
  }, [viewerNavigableSongs, isViewerOpen, activeViewerSongId]); // Adicionado activeViewerSongId como dependência

  const handleOpenFullScreenViewer = () => {
    console.log("Viewer: handleOpenFullScreenViewer called.");
    setIsRepertoireViewerActive(false);
    setViewerSearchTerm('');

    const allSongsSorted = [...songs].sort((a, b) => a.title.localeCompare(b.title));
    setViewerNavigableSongs(allSongsSorted); // Define a lista de músicas navegáveis
    
    if (allSongsSorted.length > 0) {
      setActiveViewerSongId(allSongsSorted[0].id); // Define a primeira música como ativa
      setCurrentViewerSongIndex(0);
    } else {
      setActiveViewerSongId(null);
      setCurrentViewerSongIndex(0);
    }
    setIsViewerOpen(true);
  };

  const handleOpenRepertoireViewer = () => {
    console.log("Viewer: handleOpenRepertoireViewer called.");
    if (!selectedRepertoireId) {
      toast.error("Nenhum repertório selecionado.");
      console.log("Viewer: No repertoire selected.");
      return;
    }
    const rep = repertoires.find(r => r.id === selectedRepertoireId);
    if (!rep || rep.songIds.length === 0) {
      toast.error("O repertório selecionado não possui músicas.");
      console.log("Viewer: Selected repertoire has no songs or not found.");
      return;
    }

    setIsRepertoireViewerActive(true);
    setViewerSearchTerm(''); // Limpa a busca para a visualização do repertório

    const repertoireSongs = rep.songIds
      .map(id => songs.find(s => s.id === id))
      .filter((s): s is Song => s !== undefined)
      .sort((a, b) => a.title.localeCompare(b.title)); // Garante ordem consistente

    setViewerNavigableSongs(repertoireSongs); // Define a lista de músicas navegáveis

    if (repertoireSongs.length > 0) {
      setActiveViewerSongId(repertoireSongs[0].id); // Define a primeira música do repertório como ativa
      setCurrentViewerSongIndex(0);
    } else {
      setActiveViewerSongId(null);
      setCurrentViewerSongIndex(0);
    }

    setIsViewerOpen(true);
    toast.info(`Abrindo repertório "${rep.name}" em tela cheia.`);
  };

  const handleSelectViewerSong = (songId: string) => {
    console.log("Viewer: handleSelectViewerSong called with ID:", songId);
    setActiveViewerSongId(songId);
    const index = viewerNavigableSongs.findIndex(s => s.id === songId);
    if (index !== -1) {
      setCurrentViewerSongIndex(index);
    }
  };

  const handleNextViewerSong = () => {
    console.log("Viewer: handleNextViewerSong called. activeViewerSongId:", activeViewerSongId, "currentViewerSongIndex:", currentViewerSongIndex, "viewerNavigableSongs.length:", viewerNavigableSongs.length);
    if (!activeViewerSongId || viewerNavigableSongs.length === 0) return;
    const nextIndex = (currentViewerSongIndex + 1) % viewerNavigableSongs.length;
    const nextSong = viewerNavigableSongs[nextIndex];
    setActiveViewerSongId(nextSong.id);
    setCurrentViewerSongIndex(nextIndex);
    console.log("Viewer: Next song set to ID:", nextSong.id, "Index:", nextIndex);
  };

  const handlePreviousViewerSong = () => {
    console.log("Viewer: handlePreviousViewerSong called. activeViewerSongId:", activeViewerSongId, "currentViewerSongIndex:", currentViewerSongIndex, "viewerNavigableSongs.length:", viewerNavigableSongs.length);
    if (!activeViewerSongId || viewerNavigableSongs.length === 0) return;
    const prevIndex = (currentViewerSongIndex - 1 + viewerNavigableSongs.length) % viewerNavigableSongs.length;
    const prevSong = viewerNavigableSongs[prevIndex];
    setActiveViewerSongId(prevSong.id);
    setCurrentViewerSongIndex(prevIndex);
    console.log("Viewer: Previous song set to ID:", prevSong.id, "Index:", prevIndex);
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
      setSession(null);
      handleClear();
    }
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <CustomLoginForm onSignIn={getSession} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-50">
      <div className="flex-1 flex flex-col p-4 space-y-4 lg:space-y-0 lg:space-x-4 lg:flex-row">
        <ChordRecognizerCore
          inputText={inputText}
          onInputTextChange={setInputText}
          outputText={outputText}
          onOutputTextChange={handleOutputTextChange} // Passando o novo manipulador
          onTranspose={handleTranspose}
          onRestore={handleRestore}
          onClear={handleClear}
          onSaveOutput={handleSaveOutput}
          onOpenFullScreenViewer={handleOpenFullScreenViewer}
          onSignOut={handleSignOut}
        />
      </div>

      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
        <Button
          onClick={() => setIsSongsPanelOpen(true)}
          className="w-14 h-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center"
          title="Minhas Músicas"
        >
          {loadingSongs ? <Loader2 className="h-6 w-6 animate-spin" /> : <Music className="h-6 w-6" />}
        </Button>
        <Button
          onClick={() => setIsRepertoiresPanelOpen(true)}
          className="w-14 h-14 rounded-full shadow-lg bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center"
          title="Meus Repertórios"
        >
          {loadingRepertoires ? <Loader2 className="h-6 w-6 animate-spin" /> : <ListMusic className="h-6 w-6" />}
        </Button>
      </div>

      <MySongsPanel
        open={isSongsPanelOpen}
        onOpenChange={setIsSongsPanelOpen}
        songs={songs}
        currentSongIndex={currentSongIndex}
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
        setSelectedRepertoireId={handleSelectRepertoire}
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
        searchResults={viewerNavigableSongs.filter(s => s.id !== activeViewerSongId)}
        onSelectViewerSong={handleSelectViewerSong}
        isRepertoireViewerActive={isRepertoireViewerActive}
        selectedRepertoireName={selectedRepertoire?.name || null}
        onContentChange={(newContent) => {
          if (currentViewerSong) {
            handleUpdateSongChords(currentViewerSong.id, newContent);
          }
        }}
        onSaveTransposition={(songId, newContent) => {
          handleUpdateSongChords(songId, newContent);
          toast.success("Transposição salva com sucesso!");
        }}
      />
    </div>
  );
};

export default ChordRecognizer;