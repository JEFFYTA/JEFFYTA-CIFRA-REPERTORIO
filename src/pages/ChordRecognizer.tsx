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
  const [loadingSession, setLoadingSession] = useState<boolean>(true); // Novo estado para carregamento da sessão

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
      setLoadingSession(false); // Garante que o loading seja falso após a mudança de estado de autenticação
    });

    return () => subscription.unsubscribe();
  }, [getSession]);

  // Chamar os hooks incondicionalmente no nível superior do componente
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
    setIsRepertoireViewerActive(false); // Default para visualização de todas as músicas
    setViewerSearchTerm('');
    prepareViewerSongs('', false); // Carrega todas as músicas inicialmente
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
    setViewerSearchTerm(''); // Limpa a busca para a visualização do repertório
    prepareViewerSongs('', true); // Carrega as músicas do repertório

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

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erro ao sair: " + error.message);
      console.error("Erro ao sair:", error);
    } else {
      toast.success("Você foi desconectado.");
      setSession(null); // Limpa o estado da sessão
      handleClear(); // Limpa os dados locais das músicas
    }
  };

  // Exibir um spinner de carregamento enquanto a sessão está sendo buscada
  if (loadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    );
  }

  // Se não houver sessão, exibir o formulário de login
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <CustomLoginForm onSignIn={getSession} />
      </div>
    );
  }

  // Se houver sessão, exibir o aplicativo principal
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-50">
      <div className="flex-1 flex flex-col p-4 space-y-4 lg:space-y-0 lg:space-x-4 lg:flex-row">
        <ChordRecognizerCore
          inputText={inputText}
          onInputTextChange={setInputText}
          outputText={outputText}
          onTranspose={handleTranspose}
          onRestore={handleRestore}
          onClear={handleClear}
          onCopyToClipboard={handleCopyToClipboard}
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