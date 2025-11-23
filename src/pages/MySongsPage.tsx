"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { X, ArrowLeft } from 'lucide-react'; // Importar ArrowLeft
import { useSongManagement } from "@/hooks/useSongManagement";
import { useRepertoireManagement } from "@/hooks/useRepertoireManagement";
import MySongsContent from "@/components/MySongsContent";
import ChordViewer from "@/components/ChordViewer";
import { Song } from "@/types/song";
import { useNavigate } from 'react-router-dom';

const MySongsPage: React.FC = () => {
  const navigate = useNavigate();
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false);
  const [activeViewerSongId, setActiveViewerSongId] = useState<string | null>(null);
  const [viewerNavigableSongs, setViewerNavigableSongs] = useState<Song[]>([]);
  const [currentViewerSongIndex, setCurrentViewerSongIndex] = useState<number>(0);
  const [viewerSearchTerm, setViewerSearchTerm] = useState<string>('');

  const {
    songs,
    fetchSongs,
    handleLoadSong,
    handleDeleteSong,
    handleUpdateSongChords,
  } = useSongManagement();

  const {
    selectedRepertoireId,
    selectedRepertoire,
    handleToggleSongInRepertoire,
  } = useRepertoireManagement({ songs });

  const handleOpenViewer = useCallback((songId: string) => {
    const allSongsSorted = [...songs].sort((a, b) => a.title.localeCompare(b.title));
    setViewerNavigableSongs(allSongsSorted);
    const initialIndex = allSongsSorted.findIndex(s => s.id === songId);
    if (initialIndex !== -1) {
      setActiveViewerSongId(songId);
      setCurrentViewerSongIndex(initialIndex);
      setIsViewerOpen(true);
    } else {
      console.error("Música não encontrada para visualização:", songId);
    }
  }, [songs]);

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
    if (isViewerOpen) {
      const filteredSongs = [...songs].sort((a, b) => a.title.localeCompare(b.title));
      setViewerNavigableSongs(filteredSongs);
      if (activeViewerSongId && !filteredSongs.some(s => s.id === activeViewerSongId)) {
        setActiveViewerSongId(filteredSongs.length > 0 ? filteredSongs[0].id : null);
        setCurrentViewerSongIndex(0);
      } else if (activeViewerSongId) {
        setCurrentViewerSongIndex(filteredSongs.findIndex(s => s.id === activeViewerSongId));
      }
    }
  }, [songs, isViewerOpen, activeViewerSongId]);

  return (
    <Sheet open={true} onOpenChange={() => navigate('/')}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col h-full">
        <SheetHeader className="flex flex-row items-center justify-between p-4 border-b dark:border-gray-700">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <SheetTitle className="text-2xl text-center flex-1">Minhas Músicas</SheetTitle>
          <SheetClose asChild>
            <Button variant="ghost" size="sm" className="p-2">
              <X className="h-4 w-4" />
            </Button>
          </SheetClose>
        </SheetHeader>
        <MySongsContent
          songs={songs}
          currentSongId={null}
          handleLoadSong={(songId) => {
            handleLoadSong(songId);
            navigate('/recognizer');
          }}
          handleDeleteSong={handleDeleteSong}
          selectedRepertoireId={selectedRepertoireId}
          selectedRepertoire={selectedRepertoire}
          handleToggleSongInRepertoire={handleToggleSongInRepertoire}
          onOpenViewer={handleOpenViewer}
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
        isRepertoireViewerActive={false}
        selectedRepertoireName={null}
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
    </Sheet>
  );
};

export default MySongsPage;