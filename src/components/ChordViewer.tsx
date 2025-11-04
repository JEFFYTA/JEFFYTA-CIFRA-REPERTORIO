"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"; // Adicionado DropdownMenu
import { ChevronLeft, ChevronRight, Save, Minimize2, Search, ZoomIn, ZoomOut, Edit, EllipsisVertical } from 'lucide-react'; // Adicionado Edit e EllipsisVertical
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
  const [isEditing, setIsEditing] = useState<boolean>(false); // Novo estado para modo de edição
  const [editedContent, setEditedContent] = useState<string>(''); // Novo estado para o conteúdo editado

  useEffect(() => {
    // Reset transpose, font size, and editing state when a new song is loaded or viewer opens/closes
    setViewerTransposeDelta(0);
    setViewerFontSize(1.2);
    setShowSearchResults(false);
    setIsEditing(false); // Reset editing state
    setEditedContent(''); // Clear edited content
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
    setViewerTransposeDelta(0); // Reset internal delta after saving
    toast.success("Transposição salva com sucesso!");
  };

  const handleSaveEdit = () => {
    if (!currentSong || !editedContent.trim()) {
      toast.error("Não há conteúdo para salvar.");
      return;
    }
    onSaveTransposition(currentSong.id, editedContent); // Reutiliza a função de salvar
    setIsEditing(false); // Sai do modo de edição
    setEditedContent(''); // Limpa o conteúdo editado
    setViewerTransposeDelta(0); // Reseta a transposição, pois o conteúdo salvo é o novo original
    toast.success("Edição salva com sucesso!");
  };

  const handleToggleEdit = () => {
    if (!currentSong) {
      toast.info("Selecione uma música para editar.");
      return;
    }
    if (!isEditing) {
      // Entrando no modo de edição, inicializa com o conteúdo atual (já transposto, se houver)
      setEditedContent(getViewerContent());
    } else {
      // Saindo do modo de edição, descarta as alterações não salvas
      setEditedContent('');
    }
    setIsEditing(prev => !prev);
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchTermChange(e.target.value);
    setShowSearchResults(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-full h-[90vh] flex flex-col p-0 sm:max-w-[90vw]">
        <DialogHeader className="p-4 border-b dark:border-gray-700 flex items-center justify-between gap-2">
          {/* Search Input (conditional) */}
          {!isRepertoireViewerActive && (
            <div className="relative flex-grow max-w-[200px] sm:max-w-[unset]"> {/* Added flex-grow and max-width for better mobile layout */}
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={handleSearchInputChange}
                className="pl-9 w-full"
                disabled={isEditing}
              />
            </div>
          )}

          {/* Title (centered) */}
          <DialogTitle className="text-xl text-center flex-1 min-w-0 truncate"> {/* min-w-0 truncate for long titles */}
            {getViewerTitle()}
          </DialogTitle>

          {/* Dropdown Menu for other actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
              <Minimize2 className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>

        {/* Search Results (if any, moved from previous section) */}
        {!isRepertoireViewerActive && showSearchResults && searchTerm.trim() !== '' && searchResults.length > 0 && (
          <ScrollArea className="mt-0 h-40 border-b border-x rounded-b-md mx-4 -mt-2 z-10 bg-background relative"> {/* Adjusted margin and z-index */}
            <div className="p-2 space-y-1">
              {searchResults.map((song) => (
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
              ))}
            </div>
          </ScrollArea>
        )}
        {!isRepertoireViewerActive && showSearchResults && searchTerm.trim() !== '' && searchResults.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 mt-2">Nenhuma música encontrada.</p>
        )}

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
          {/* Navigation buttons remain exposed */}
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