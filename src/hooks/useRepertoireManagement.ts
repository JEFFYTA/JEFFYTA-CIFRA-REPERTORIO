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
      setRepertoires([]);
      setLoadingRepertoires(false);
      return;
    }

    const { data, error } = await supabase
      .from('repertoires')
      .select('*')
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Erro ao carregar repertórios: " + error.message);
      console.error("Erro ao carregar repertórios:", error);
    } else {
      // Mapear song_ids do Supabase para songIds para o tipo do frontend
      const mappedRepertoires = (data || []).map(rep => ({
        ...rep,
        songIds: rep.song_ids || [], // Garante que é um array, mesmo se for null/undefined
      }));
      setRepertoires(mappedRepertoires);
    }
    setLoadingRepertoires(false);
  }, []);

  useEffect(() => {
    fetchRepertoires();
    // Adicionar um listener para mudanças de autenticação para recarregar os repertórios
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
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

    const { data, error } = await supabase
      .from('repertoires')
      .insert([newRepData])
      .select();

    if (error) {
      toast.error("Erro ao criar repertório: " + error.message);
      console.error("Erro ao criar repertório:", error);
    } else if (data && data.length > 0) {
      // Mapear o repertório recém-criado para o formato do frontend
      const createdRepertoire = {
        ...data[0],
        songIds: data[0].song_ids || [],
      };
      setRepertoires(prev => [...prev, createdRepertoire]);
      setNewRepertoireName('');
      toast.success(`Repertório "${createdRepertoire.name}" criado!`);
    }
  };

  const handleSelectRepertoire = (id: string | null) => {
    setSelectedRepertoireId(id);
    if (id) {
      const selectedRep = repertoires.find(rep => rep.id === id);
      toast.info(`Repertório "${selectedRep?.name}" selecionado.`);
    } else {
      toast.info("Nenhum repertório selecionado.");
    }
  };

  const handleDeleteRepertoire = async (id: string) => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      toast.error("Você precisa estar logado para excluir repertórios.");
      return;
    }

    const { error } = await supabase
      .from('repertoires')
      .delete()
      .eq('id', id)
      .eq('user_id', user.user.id);

    if (error) {
      toast.error("Erro ao excluir repertório: " + error.message);
      console.error("Erro ao excluir repertório:", error);
    } else {
      setRepertoires(prev => prev.filter(rep => rep.id !== id));
      if (selectedRepertoireId === id) {
        setSelectedRepertoireId(null);
      }
      toast.success("Repertório excluído.");
    }
  };

  const handleToggleSongInRepertoire = async (songId: string, isChecked: boolean) => {
    if (!selectedRepertoireId) return;

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      toast.error("Você precisa estar logado para modificar repertórios.");
      return;
    }

    const currentRepertoire = repertoires.find(rep => rep.id === selectedRepertoireId);
    if (!currentRepertoire) return;

    const newSongIds = isChecked
      ? [...new Set([...currentRepertoire.songIds, songId])]
      : currentRepertoire.songIds.filter(id => id !== songId);

    const { error } = await supabase
      .from('repertoires')
      .update({ song_ids: newSongIds, updated_at: new Date().toISOString() })
      .eq('id', selectedRepertoireId)
      .eq('user_id', user.user.id);

    if (error) {
      toast.error("Erro ao atualizar repertório: " + error.message);
      console.error("Erro ao atualizar repertório:", error);
    } else {
      setRepertoires(prev => prev.map(rep => {
        if (rep.id === selectedRepertoireId) {
          return { ...rep, songIds: newSongIds };
        }
        return rep;
      }));

      const songTitle = songs.find(s => s.id === songId)?.title || "Música";
      const repertoireName = currentRepertoire.name;
      if (isChecked) {
        toast.success(`"${songTitle}" adicionada ao repertório "${repertoireName}".`);
      } else {
        toast.info(`"${songTitle}" removida do repertório "${repertoireName}".`);
      }
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
  };
};