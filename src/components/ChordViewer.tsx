"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ChevronLeft, ChevronRight, Save, X, Search, ZoomIn, ZoomOut, Edit, EllipsisVertical } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Song } from "@/types/song";
import { transposeChordLine } from "@/lib/chordUtils";
import { toast } from "sonner";

interface ChordViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSong: Song | null;
  viewerNavigableSongs: Song[];
  currentViewerSongIndex: number;
  onNextSong: () => void;
  onPreviousSong: () => void;
  onSearchTermChange: (term: string) => void;
  searchTerm: string;
  searchResults: Song[];
  onSelectViewerSong: (songId: string) => void;
  isRepertoireViewerActive: boolean;
  selectedRepertoireName: string | null;
  onContentChange: (newContent: string) => void;
  onSaveTransposition: (songId: string, newContent: string) => void;
}

const ChordViewer: React.FC<ChordViewerProps> = ({
  open,
  onOpenChange,
  currentSong,
  viewerNavigableSongs,
  currentViewerSongIndex,
  onNextSong,
  onPreviousSong,
  onSearchTermChange,
  searchTerm,
  searchResults,
  onSelectViewerSong,
  isRepertoireViewerActive,
  selectedRepertoireName,
  onContentChange,
  onSaveTransposition,
}) => {
  const [viewerTransposeDelta, setViewerTransposeDelta] = useState<number>(0);
  const [viewerFontSize, setViewerFontSize] = useState<number>(1.2);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedContent, setEditedContent] = useState<string>('');

  useEffect(() => {
    setViewerTransposeDelta(0);
    setViewerFontSize(1.2);
    setShowSearchResults(false);
    setIsEditing(false);
    setEditedContent('');
  }, [currentSong, open]);

  const getViewerContent = useCallback(() => {
    if (!currentSong) {
      if (!isRepertoireViewerActive && searchTerm.trim() !== '' && searchResults.length === 0) {
        return "Nenhuma música encontrada com este termo.";
      }
      if (!isRepertoireViewerActive && searchTerm.trim() === '') {
        return "Busque por uma música para começar.";
      }
      if (isRepertoireViewerActive && viewerNavigableSongs.length === 0) {
        return "Este repertório não possui músicas.";
      }
      return '';
    }

    let contentToDisplay = currentSong.extractedChords;

    if (contentToDisplay) {
      let lines = contentToDisplay.split('\n');
      lines = lines.map(line => transposeChordLine(line, viewerTransposeDelta));
      return lines.join('\n');
    }
    return '';
  }, [currentSong, viewerTransposeDelta, isRepertoireViewerActive, searchTerm, searchResults, viewerNavigableSongs]);

  const getViewerTitle = () => {
    if (!currentSong) {
      if (!isRepertoireViewerActive && searchTerm.trim() !== '' && searchResults.length === 0) {
        return "Nenhuma música encontrada";
      }
      return "Visualizador de Cifras";
    }

    if (isRepertoireViewerActive && selectedRepertoireName) {
      return `${selectedRepertoireName} - ${currentSong.title}`;
    }
    return currentSong.title;
  };

  const handleInternalSaveTransposition = () => {
    if (!currentSong || viewerTransposeDelta === 0) {
      toast.info("Nenhuma transposição para salvar ou nenhuma música selecionada.");
      return;
    }

    const currentTransposedContent = getViewerContent();
    onSaveTransposition(currentSong.id, currentTransposedContent);
    setViewerTransposeDelta(0);
    toast.success("Transposição salva com sucesso!");
  };

  const handleSaveEdit = () => {
    if (!currentSong || !editedContent.trim()) {
      toast.error("Não há conteúdo para salvar.");
      return;
    }
    onSaveTransposition(currentSong.id, editedContent);
    setIsEditing(false);
    setEditedContent('');
    setViewerTransposeDelta(0);
    toast.success("Edição salva com sucesso!");
  };

  const handleToggleEdit = () => {
    if (!currentSong) {
      toast.info("Selecione uma música para editar.");
      return;
    }
    if (!isEditing) {
      setEditedContent(getViewerContent());
    } else {
      setEditedContent('');
    }
    setIsEditing(prev => !prev);
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchTermChange(e.target.value);
    setShowSearchResults(true);
  };

  // Calculate the approximate width of the left control group for balancing
  // Search input (w-48) + 2 buttons (p-2 ~ 32px each) + 2 gaps (gap-2 ~ 8px each)
  // 192px + 32px + 32px + 16px = 272px
  const leftControlGroupWidth = "w-[272px]";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-full h-[90vh] flex flex-col p-0 sm:max-w-[90vw]">
        <DialogHeader className="p-4 border-b dark:border-gray-700 flex items-center justify-between relative">
          {/* Left side: Search input, Dropdown, Close button */}
          <div className={cn("flex items-center gap-2 relative z-40", leftControlGroupWidth)}>
            {!isRepertoireViewerActive ? (
              <div className="relative flex-1"> {/* flex-1 to take available space within leftControlGroupWidth */}
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400 z-10" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={handleSearchInputChange}
                  className="pl-9 w-full relative z-20"
                  disabled={isEditing}
                  onFocus={() => setShowSearchResults(true)}
                  onBlur={() => setTimeout(() => setShowSearchResults(false), 100)}
                />
                {showSearchResults && searchTerm.trim() !== '' && (
                  <ScrollArea className="absolute top-full left-0 w-full h-40 border rounded-md bg-background shadow-lg z-30">
                    <div className="p-2 space-y-1">
                      {searchResults.length > 0 ? (
                        searchResults.map((song) => (
                          <Button
                            key={song.id}
                            variant="ghost"
                            className={cn(
                              "w-full justify-start",
                              currentSong?.id === song.id && "bg-accent text-accent-foreground"
                            )}
                            onClick={() => {
                              onSelectViewerSong(song.id);
                              setShowSearchResults(false);
                            }}
                          >
                            {song.title}
                          </Button>
                        ))
                      ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400">Nenhuma música encontrada.</p>
                      )}
                    </div>
                  </ScrollArea>
                )}
              </div>
            ) : (
              <div className="flex-1"></div> // Placeholder to maintain flex-1 space if search is hidden
            )}

            {/* Dropdown Menu for other actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <EllipsisVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start"> {/* Align to start so it opens to the right */}
                <DropdownMenuItem onClick={handleToggleEdit} disabled={!currentSong}>
                  <Edit className="mr-2 h-4 w-4" /> {isEditing ? 'Cancelar Edição' : 'Editar'}
                </DropdownMenuItem>
                {isEditing ? (
                  <DropdownMenuItem onClick={handleSaveEdit} disabled={!currentSong || !editedContent.trim()}>
                    <Save className="mr-2 h-4 w-4" /> Salvar Edição
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={handleInternalSaveTransposition} disabled={!currentSong || viewerTransposeDelta === 0}>
                    <Save className="mr-2 h-4 w-4" /> Salvar Transposição
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setViewerTransposeDelta(prev => prev - 1)} disabled={!currentSong || isEditing}>
                  Transpor -1
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setViewerTransposeDelta(prev => prev + 1)} disabled={!currentSong || isEditing}>
                  Transpor +1
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setViewerFontSize(prev => Math.max(prev - 0.1, 0.8))} disabled={!currentSong}>
                  <ZoomOut className="mr-2 h-4 w-4" /> Diminuir Fonte
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setViewerFontSize(prev => Math.min(prev + 0.1, 2.5))} disabled={!currentSong}>
                  <ZoomIn className="mr-2 h-4 w-4" /> Aumentar Fonte
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Close Button */}
            <DialogClose asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>

          {/* Center: Title (absolutely positioned) */}
          <DialogTitle className="text-xl text-center flex-1 min-w-0 truncate absolute left-1/2 -translate-x-1/2">
            {getViewerTitle()}
          </DialogTitle>

          {/* Right side: Empty placeholder to balance the left side. */}
          <div className={leftControlGroupWidth}></div> {/* Fixed width to match left side for perfect balance */}
        </DialogHeader>

        <div className="flex-1 p-4 overflow-auto font-mono leading-relaxed">
          <Textarea
            value={isEditing ? editedContent : getViewerContent()}
            readOnly={!isEditing}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full h-full resize-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
            style={{ fontSize: `${viewerFontSize}rem` }}
            disabled={!currentSong}
          />
        </div>

        <div className="flex flex-wrap justify-center gap-2 p-4 border-t dark:border-gray-700">
          <Button
            onClick={onPreviousSong}
            disabled={!currentSong || viewerNavigableSongs.length <= 1 || isEditing}
            variant="outline"
            size="sm"
          >
            <ChevronLeft className="h-4 w-4" /> Anterior
          </Button>
          <Button
            onClick={onNextSong}
            disabled={!currentSong || viewerNavigableSongs.length <= 1 || isEditing}
            variant="outline"
            size="sm"
          >
            Próxima <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChordViewer;