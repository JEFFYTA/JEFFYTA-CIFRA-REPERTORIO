"use client";

import { useState, useEffect, useCallback } from 'react';
import { toast } from "sonner";
import { Repertoire } from "@/types/repertoire";
import { Song } from "@/types/song";
import { supabase } from "@/integrations/supabase/client"; // Importar o cliente Supabase

interface UseRepertoireManagementProps {
  songs: Song[];
}

export const useRepertoireManagement = ({ songs }: UseRepertoireManagementProps) => {
  const [repertoires, setRepertoires] = useState<Repertoire[]>([]);
  const [selectedRepertoireId, setSelectedRepertoireId] = useState<string | null>(null);
  const [newRepertoireName, setNewRepertoireName] = useState<string>('');
  const [loadingRepertoires, setLoadingRepertoires] = useState<boolean>(true);

  const selectedRepertoire = selectedRepertoireId
    ? repertoires.find(rep => rep.id === selectedRepertoireId)
    : null;

  const fetchRepertoires = useCallback(async () => {
    setLoadingRepertoires(true);
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      console.log("[useRepertoireManagement] No user session found, clearing repertoires.");
      setRepertoires([]);
      setLoadingRepertoires(false);
      return;
    }
    console.log("[useRepertoireManagement] Fetching repertoires for user:", user.user.id);

    const { data, error } = await supabase
      .from('repertoires')
      .select('*')
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Erro ao carregar repertórios: " + error.message);
      console.error("[useRepertoireManagement] Erro ao carregar repertórios:", error);
    } else {
      const mappedRepertoires = (data || []).map(rep => ({
        ...rep,
        songIds: rep.song_ids || [],
      }));
      setRepertoires(mappedRepertoires);
      console.log("[useRepertoireManagement] Repertoires fetched successfully:", mappedRepertoires);
    }
    setLoadingRepertoires(false);
  }, []);

  useEffect(() => {
    fetchRepertoires();
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[useRepertoireManagement] Auth state change event:", event);
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        fetchRepertoires();
      }
    });
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchRepertoires]);

  const handleCreateRepertoire = async () => {
    if (!newRepertoireName.trim()) {
      toast.error("Por favor, insira um nome para o repertório.");
      return;
    }

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      toast.error("Você precisa estar logado para criar repertórios.");
      return;
    }

    const newRepData = {
      user_id: user.user.id,
      name: newRepertoireName.trim(),
      song_ids: [],
    };
    console.log("[useRepertoireManagement] Attempting to create repertoire:", newRepData);

    const { data, error } = await supabase
      .from('repertoires')
      .insert([newRepData])
      .select();

    if (error) {
      toast.error("Erro ao criar repertório: " + error.message);
      console.error("[useRepertoireManagement] Erro ao criar repertório:", error);
    } else if (data && data.length > 0) {
      const createdRepertoire = {
        ...data[0],
        songIds: data[0].song_ids || [],
      };
      setRepertoires(prev => [...prev, createdRepertoire]);
      setNewRepertoireName('');
      toast.success(`Repertório "${createdRepertoire.name}" criado!`);
      console.log("[useRepertoireManagement] Repertoire created successfully:", createdRepertoire);
    }
  };

  const handleSelectRepertoire = (id: string | null) => {
    setSelectedRepertoireId(id);
    if (id) {
      const selectedRep = repertoires.find(rep => rep.id === id);
      toast.info(`Repertório "${selectedRep?.name}" selecionado.`);
      console.log("[useRepertoireManagement] Repertoire selected:", selectedRep?.name, "ID:", id);
    } else {
      toast.info("Nenhum repertório selecionado.");
      console.log("[useRepertoireManagement] No repertoire selected.");
    }
  };

  const handleDeleteRepertoire = async (id: string) => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      toast.error("Você precisa estar logado para excluir repertórios.");
      return;
    }
    console.log("[useRepertoireManagement] Attempting to delete repertoire ID:", id, "for user:", user.user.id);

    const { error } = await supabase
      .from('repertoires')
      .delete()
      .eq('id', id)
      .eq('user_id', user.user.id);

    if (error) {
      toast.error("Erro ao excluir repertório: " + error.message);
      console.error("[useRepertoireManagement] Erro ao excluir repertório:", error);
    } else {
      setRepertoires(prev => prev.filter(rep => rep.id !== id));
      if (selectedRepertoireId === id) {
        setSelectedRepertoireId(null);
      }
      toast.success("Repertório excluído.");
      console.log("[useRepertoireManagement] Repertoire deleted successfully:", id);
    }
  };

  const handleToggleSongInRepertoire = async (songId: string, isChecked: boolean) => {
    console.log("[handleToggleSongInRepertoire] called:", { songId, isChecked, selectedRepertoireId });
    if (!selectedRepertoireId) {
      toast.error("Por favor, selecione um repertório primeiro.");
      console.warn("[handleToggleSongInRepertoire] No repertoire selected when trying to toggle song.");
      return;
    }

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      toast.error("Você precisa estar logado para modificar repertórios.");
      console.warn("[handleToggleSongInRepertoire] User not logged in when trying to toggle song in repertoire.");
      return;
    }

    const currentRepertoire = repertoires.find(rep => rep.id === selectedRepertoireId);
    if (!currentRepertoire) {
      console.error("[handleToggleSongInRepertoire] Selected repertoire not found in state:", selectedRepertoireId);
      toast.error("Repertório selecionado não encontrado.");
      return;
    }

    const newSongIds = isChecked
      ? [...new Set([...currentRepertoire.songIds, songId])]
      : currentRepertoire.songIds.filter(id => id !== songId);

    console.log("[handleToggleSongInRepertoire] Current repertoire songIds:", currentRepertoire.songIds);
    console.log("[handleToggleSongInRepertoire] New song IDs to update:", newSongIds);

    const { error } = await supabase
      .from('repertoires')
      .update({ song_ids: newSongIds, updated_at: new Date().toISOString() })
      .eq('id', selectedRepertoireId)
      .eq('user_id', user.user.id);

    if (error) {
      toast.error("Erro ao atualizar repertório: " + error.message);
      console.error("[handleToggleSongInRepertoire] Erro ao atualizar repertório no Supabase:", error);
    } else {
      // Refetch repertoires to ensure the count is updated from the database
      await fetchRepertoires(); 

      // As mensagens de toast foram removidas conforme solicitado.
      // const songTitle = songs.find(s => s.id === songId)?.title || "Música";
      // const repertoireName = currentRepertoire.name;
      // if (isChecked) {
      //   toast.success(`"${songTitle}" adicionada ao repertório "${repertoireName}".`);
      // } else {
      //   toast.info(`"${songTitle}" removida do repertório "${repertoireName}".`);
      // }
      console.log("[handleToggleSongInRepertoire] Repertoire updated successfully in Supabase and local state. New songIds:", newSongIds);
    }
  };

  return {
    repertoires,
    setRepertoires,
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
    fetchRepertoires, // Expondo fetchRepertoires para uso externo, se necessário
  };
};