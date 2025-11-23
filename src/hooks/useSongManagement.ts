"use client";

import { useState, useEffect, useCallback } from 'react';
import { toast } from "sonner";
import { extrairCifras, extractSongTitle } from "@/lib/chordUtils";
import { supabase, invokeBatchImportSongs } from "@/integrations/supabase/client"; // Importar o cliente Supabase e a nova função
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
        updated_at: song.updated_at, // Adicionado: Mapear a nova coluna
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
    // Este efeito processa inputText em outputText
    processInput(inputText);
  }, [inputText, processInput]);

  useEffect(() => {
    // Este efeito extrai o título
    let detectedTitle = '';
    if (inputText.trim()) {
      // Se houver texto de entrada, priorize a extração do título a partir dele
      detectedTitle = extractSongTitle(inputText);
    } else if (outputText.trim()) {
      // Se o texto de entrada estiver vazio, mas o texto de saída tiver conteúdo (ex: colagem direta),
      // tente extrair o título do texto de saída.
      detectedTitle = extractSongTitle(outputText);
    }

    if (detectedTitle) {
      setNewSongTitle(detectedTitle);
    } else {
      setNewSongTitle('');
    }
  }, [inputText, outputText]); // Depende de inputText e outputText

  const handleClear = () => {
    setInputText('');
    setOutputText('');
    setOriginalOutputText('');
    setNewSongTitle('');
    setCurrentSongIndex(null);
    toast.info("Input e output limpos.");
  };

  const handleSaveSong = async () => {
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

    // Determine if we are updating an existing song or creating a new one
    const existingSongId = currentSongIndex !== null ? songs[currentSongIndex]?.id : null;

    if (existingSongId) {
      // Update existing song
      const { error, data: updatedData } = await supabase
        .from('songs')
        .update({
          title: newSongTitle.trim(),
          original_content: inputText,
          extracted_chords: outputText,
          updated_at: new Date().toISOString(), // Atualizar explicitamente o timestamp
        })
        .eq('id', existingSongId)
        .eq('user_id', user.user.id)
        .select(); // Selecionar para obter os dados atualizados, incluindo updated_at

      if (error) {
        toast.error("Erro ao atualizar música: " + error.message);
        console.error("Erro ao atualizar música:", error);
      } else if (updatedData && updatedData.length > 0) {
        // Atualizar estado local imediatamente
        setSongs(prev => prev.map(song =>
          song.id === existingSongId
            ? {
                ...song,
                title: updatedData[0].title,
                originalContent: updatedData[0].original_content,
                extractedChords: updatedData[0].extracted_chords,
                updated_at: updatedData[0].updated_at,
              }
            : song
        ));
        toast.success(`Música "${newSongTitle}" atualizada com sucesso!`);
      }
    } else {
      // Insert new song
      const newSongData = {
        user_id: user.user.id,
        title: newSongTitle.trim(),
        original_content: inputText,
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
        const createdSong = {
          id: data[0].id,
          user_id: data[0].user_id,
          title: data[0].title,
          originalContent: data[0].original_content,
          extractedChords: data[0].extracted_chords,
          created_at: data[0].created_at,
          updated_at: data[0].updated_at, // Adicionado: Mapear a nova coluna
        };
        setSongs(prev => [...prev, createdSong]);
        setNewSongTitle('');
        setInputText(''); // Clear input after saving new song
        setOutputText(''); // Clear output after saving new song
        setOriginalOutputText(''); // Clear original output
        setCurrentSongIndex(null); // No song is currently loaded
        toast.success(`Música "${createdSong.title}" salva com sucesso!`);
      }
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

    const { error, data: updatedData } = await supabase
      .from('songs')
      .update({ extracted_chords: newChords, updated_at: new Date().toISOString() }) // Atualizar explicitamente o timestamp
      .eq('id', songId)
      .eq('user_id', user.user.id)
      .select(); // Selecionar para obter os dados atualizados, incluindo updated_at

    if (error) {
      console.error("Erro ao atualizar cifras da música:", error);
      toast.error("Erro ao salvar alterações na música: " + error.message);
      return;
    }

    // Atualizar estado local imediatamente após o sucesso no banco de dados
    if (updatedData && updatedData.length > 0) {
      const updatedSong = updatedData[0];
      setSongs(prev => prev.map(song =>
        song.id === songId
          ? {
              ...song,
              extractedChords: updatedSong.extracted_chords,
              updated_at: updatedSong.updated_at, // Atualizar timestamp local
            }
          : song
      ));
      // Removido: toast.success("Alterações salvas automaticamente!"); // Feedback para o usuário
    }
  };

  const handleBatchSaveSongs = async (songsToSave: { title: string; originalContent: string; extractedChords: string; }[]) => {
    if (songsToSave.length === 0) {
      toast.info("Nenhuma música para importar.");
      return;
    }

    const loadingToastId = toast.loading(`Importando ${songsToSave.length} músicas...`);

    try {
      const { message, importedSongs } = await invokeBatchImportSongs(songsToSave);
      toast.success(message, { id: loadingToastId });
      fetchSongs(); // Recarregar todas as músicas após a importação em lote
      return importedSongs;
    } catch (error) {
      toast.error("Erro ao importar músicas em lote: " + (error instanceof Error ? error.message : String(error)), { id: loadingToastId });
      console.error("Erro ao importar músicas em lote:", error);
      throw error;
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
    fetchSongs, // Expondo fetchSongs
    handleBatchSaveSongs, // Expondo a nova função
  };
};