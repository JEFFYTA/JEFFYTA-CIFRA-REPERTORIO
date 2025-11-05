"use client";

import { useState, useEffect, useCallback } from 'react';
import { toast } from "sonner";
import { extrairCifras, extractSongTitle } from "@/lib/chordUtils";
import { supabase } from "@/integrations/supabase/client"; // Importar o cliente Supabase
import { Song } from "@/types/song"; // Importar o tipo Song

interface UseSongManagementProps {
  initialInputText?: string; // Tornar opcional
}

export const useSongManagement = ({ initialInputText = '' }: UseSongManagementProps = {}) => {
  const [inputText, setInputText] = useState<string>(initialInputText);
  const [outputText, setOutputText] = useState<string>('');
  const [originalOutputText, setOriginalOutputText] = useState<string>('');
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState<number | null>(null);
  const [newSongTitle, setNewSongTitle] = useState<string>('');
  const [loadingSongs, setLoadingSongs] = useState<boolean>(true);

  const fetchSongs = useCallback(async () => {
    setLoadingSongs(true);
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      setSongs([]);
      setLoadingSongs(false);
      return;
    }

    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Erro ao carregar músicas: " + error.message);
      console.error("Erro ao carregar músicas:", error);
    } else {
      // Mapear as propriedades snake_case do Supabase para camelCase
      const mappedSongs = (data || []).map(song => ({
        id: song.id,
        user_id: song.user_id,
        title: song.title,
        originalContent: song.original_content,
        extractedChords: song.extracted_chords,
        created_at: song.created_at,
      }));
      setSongs(mappedSongs);
    }
    setLoadingSongs(false);
  }, []);

  useEffect(() => {
    fetchSongs();
    // Adicionar um listener para mudanças de autenticação para recarregar as músicas
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        fetchSongs();
      }
    });
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchSongs]);

  const processInput = useCallback((text: string) => {
    const extracted = extrairCifras(text);
    setOutputText(extracted);
    setOriginalOutputText(extracted);
  }, []);

  useEffect(() => {
    processInput(inputText);
    const detectedTitle = extractSongTitle(inputText);
    if (detectedTitle) {
      setNewSongTitle(detectedTitle);
    } else {
      setNewSongTitle('');
    }
    // onInputTextChange(inputText); // Removido
  }, [inputText, processInput]); // Removido onInputTextChange da dependência

  const handleClear = () => {
    setInputText('');
    setOutputText('');
    setOriginalOutputText('');
    setNewSongTitle('');
    setCurrentSongIndex(null);
    toast.info("Input e output limpos.");
  };

  const handleSaveSong = async () => {
    // Apenas outputText é estritamente necessário para salvar as cifras
    if (!outputText.trim()) {
      toast.error("Não há música para salvar. Por favor, cole o conteúdo primeiro.");
      return;
    }
    if (!newSongTitle.trim()) {
      toast.error("Por favor, insira um título para a música.");
      return;
    }

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      toast.error("Você precisa estar logado para salvar músicas.");
      return;
    }

    const newSongData = {
      user_id: user.user.id,
      title: newSongTitle.trim(),
      original_content: inputText, // Salva o inputText, mesmo que esteja vazio
      extracted_chords: outputText,
    };

    const { data, error } = await supabase
      .from('songs')
      .insert([newSongData])
      .select();

    if (error) {
      toast.error("Erro ao salvar música: " + error.message);
      console.error("Erro ao salvar música:", error);
    } else if (data && data.length > 0) {
      // Mapear a música recém-criada para o formato do frontend
      const createdSong = {
        id: data[0].id,
        user_id: data[0].user_id,
        title: data[0].title,
        originalContent: data[0].original_content,
        extractedChords: data[0].extracted_chords,
        created_at: data[0].created_at,
      };
      setSongs(prev => [...prev, createdSong]);
      setNewSongTitle('');
      toast.success(`Música "${createdSong.title}" salva com sucesso!`);
    }
  };

  const handleLoadSong = (id: string) => {
    const songToLoad = songs.find(song => song.id === id);
    if (songToLoad) {
      setInputText(songToLoad.originalContent);
      setCurrentSongIndex(songs.findIndex(s => s.id === id));
      setNewSongTitle(songToLoad.title);
      setOutputText(songToLoad.extractedChords);
      setOriginalOutputText(songToLoad.extractedChords);
      toast.info(`Música "${songToLoad.title}" carregada.`);
    }
  };

  const handleDeleteSong = async (id: string) => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      toast.error("Você precisa estar logado para excluir músicas.");
      return;
    }

    const { error } = await supabase
      .from('songs')
      .delete()
      .eq('id', id)
      .eq('user_id', user.user.id); // Garantir que o usuário só pode excluir suas próprias músicas

    if (error) {
      toast.error("Erro ao excluir música: " + error.message);
      console.error("Erro ao excluir música:", error);
    } else {
      setSongs(prev => prev.filter(song => song.id !== id));
      if (currentSongIndex !== null && songs[currentSongIndex]?.id === id) {
        handleClear();
      }
      toast.success("Música excluída.");
    }
  };

  const handleUpdateSongChords = async (songId: string, newChords: string) => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      toast.error("Você precisa estar logado para atualizar músicas.");
      return;
    }

    const { error } = await supabase
      .from('songs')
      .update({ extracted_chords: newChords, updated_at: new Date().toISOString() })
      .eq('id', songId)
      .eq('user_id', user.user.id);

    if (error) {
      console.error("Erro ao atualizar cifras da música:", error);
      // toast.error("Erro ao salvar alterações na música."); // Não exibir toast a cada keystroke
    } else {
      setSongs(prev => prev.map(song =>
        song.id === songId ? { ...song, extractedChords: newChords } : song
      ));
    }
  };

  return {
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
  };
};