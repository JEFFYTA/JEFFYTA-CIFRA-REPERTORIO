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
import { transposeChordLine } from "@/lib/chordUtils";

const ChordRecognizer = () => {
  // Mantendo os hooks e estados, mas o retorno será simplificado para depuração
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

  // Retorno simplificado para depuração
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-50">
      <h1 className="text-4xl font-bold">Olá Mundo! Preview Teste.</h1>
    </div>
  );
};

export default ChordRecognizer;