"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { X, ArrowLeft } from 'lucide-react';
import { useRepertoireManagement } from "@/hooks/useRepertoireManagement";
import { useSongManagement } from "@/hooks/useSongManagement";
import MyRepertoiresContent from "@/components/MyRepertoiresContent";
import ChordViewer from "@/components/ChordViewer";
import RepertoireSongSelectionSidebar from "@/components/RepertoireSongSelectionSidebar"; // Importar o novo componente
import { Song } from "@/types/song";
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';

const RepertoiresPage: React.FC = () => {
  const navigate = useNavigate();
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false);
  const [activeViewerSongId, setActiveViewerSongId] = useState<string | null>(null);
  const [viewerNavigableSongs, setViewerNavigableSongs] = useState<Song[]>([]);
  const [currentViewerSongIndex, setCurrentViewerSongIndex] = useState<number>(0);
  const [viewerSearchTerm, setViewerSearchTerm] = useState<string>('');
  const [isSongSelectionSidebarOpen, setIsSongSelectionSidebarOpen] = useState<boolean>(false); // Novo estado

  const {
    songs,
    fetchSongs,
    handleUpdateSongChords,
  } = useSongManagement();

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
    handleToggleSongInRepertoire, // Adicionado para passar ao sidebar
    loadingRepertoires,
  } = useRepertoireManagement({ songs });

  const handleOpenRepertoireViewer = useCallback(() => {
    if (!selectedRepertoireId) {
      toast.error("Nenhum repertório selecionado.");
      return;
    }
    const rep = repertoires.find(r => r.id === selectedRepertoireId);
    if (!rep || rep.songIds.length === 0) {
      toast.error("O repertório selecionado não possui músicas.");
      return;
    }

    const repertoireSongs = rep.songIds
      .map(id => songs.find(s => s.id === id))
      .filter((s): s is Song => s !== undefined);
      // .sort((a, b) => a.title.localeCompare(b.title)); // REMOVIDO: para manter a ordem de seleção

    setViewerNavigableSongs(repertoireSongs);
    setViewerSearchTerm('');

    if (repertoireSongs.length > 0) {
      setActiveViewerSongId(repertoireSongs[0].id);
      setCurrentViewerSongIndex(0);
    } else {
      setActiveViewerSongId(null);
      setCurrentViewerSongIndex(0);
    }

    setIsViewerOpen(true);
    toast.info(`Abrindo repertório "${rep.name}" em tela cheia.`);
  }, [selectedRepertoireId, repertoires, songs]);

  const handleOpenSongSelectionSidebar = useCallback(() => {
    if (!selectedRepertoireId) {
      toast.error("Por favor, selecione um repertório primeiro.");
      return;
    }
    setIsSongSelectionSidebarOpen(true);
  }, [selectedRepertoireId]);

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

  const handleSelectViewerSong = (songId: string) => {
    setActiveViewerSongId(songId);
    const index = viewerNavigableSongs.findIndex(s => s.id === songId);
    if (index !== -1) {
      setCurrentViewerSongIndex(index);
    }
  };

  const currentViewerSong = activeViewerSongId
    ? viewerNavigableSongs.find(s => s.id === activeViewerSongId)
    : null;

  useEffect(() => {
    if (isViewerOpen && selectedRepertoire) {
      const repertoireSongs = selectedRepertoire.songIds
        .map(id => songs.find(s => s.id === id))
        .filter((s): s is Song => s !== undefined);
        // .sort((a, b) => a.title.localeCompare(b.title)); // REMOVIDO: para manter a ordem de seleção
      setViewerNavigableSongs(repertoireSongs);

      if (activeViewerSongId && !repertoireSongs.some(s => s.id === activeViewerSongId)) {
        setActiveViewerSongId(repertoireSongs.length > 0 ? repertoireSongs[0].id : null);
        setCurrentViewerSongIndex(0);
      } else if (activeViewerSongId) {
        setCurrentViewerSongIndex(repertoireSongs.findIndex(s => s.id === activeViewerSongId));
      }
    }
  }, [selectedRepertoire, songs, isViewerOpen, activeViewerSongId]);

  return (
    <Sheet open={true} onOpenChange={() => navigate('/')}>
      <SheetContent side="right" className="w-full max-w-full sm:max-w-md flex flex-col h-full">
        <SheetHeader className="flex flex-row items-center justify-between p-4 border-b dark:border-gray-700">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <SheetTitle className="text-2xl text-center flex-1">Meus Repertórios</SheetTitle>
          <SheetClose asChild>
            <Button variant="ghost" size="sm" className="p-2">
              <X className="h-4 w-4" />
            </Button>
          </SheetClose>
        </SheetHeader>
        <MyRepertoiresContent
          repertoires={repertoires}
          selectedRepertoireId={selectedRepertoireId}
          setSelectedRepertoireId={setSelectedRepertoireId}
          newRepertoireName={newRepertoireName}
          setNewRepertoireName={setNewRepertoireName}
          handleCreateRepertoire={handleCreateRepertoire}
          handleSelectRepertoire={handleSelectRepertoire}
          handleDeleteRepertoire={handleDeleteRepertoire}
          handleOpenRepertoireViewer={handleOpenRepertoireViewer}
          onOpenSongSelectionSidebar={handleOpenSongSelectionSidebar} // Passar a nova função
        />
      </SheetContent>

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
        isRepertoireViewerActive={true}
        selectedRepertoireName={selectedRepertoire?.name || null}
        onContentChange={(newContent) => { // Reintroduzido
          if (currentViewerSong) {
            handleUpdateSongChords(currentViewerSong.id, newContent);
          }
        }}
        onSaveTransposition={async (songId, newContent) => {
          await handleUpdateSongChords(songId, newContent);
        }}
        onSongsRefetch={fetchSongs}
      />

      {/* Novo Sidebar para seleção de músicas */}
      <RepertoireSongSelectionSidebar
        open={isSongSelectionSidebarOpen}
        onOpenChange={setIsSongSelectionSidebarOpen}
        allSongs={songs}
        selectedRepertoire={selectedRepertoire}
        handleToggleSongInRepertoire={handleToggleSongInRepertoire}
      />
    </Sheet>
  );
};

export default RepertoiresPage;