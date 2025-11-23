"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ChevronLeft, ChevronRight, Save, X, Search, ZoomIn, ZoomOut, EllipsisVertical } from 'lucide-react'; 
import { cn } from "@/lib/utils";
import { Song } from "@/types/song";
import { transposeChordLine } from "@/lib/chordUtils";
import { toast } from "sonner";
import StyledChordDisplay from './StyledChordDisplay'; // Import the StyledChordDisplay

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
  onSaveTransposition: (songId: string, newContent: string) => Promise<void>;
  onSongsRefetch: () => Promise<void>;
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
  onSongsRefetch,
}) => {
  const [viewerTransposeDelta, setViewerTransposeDelta] = useState<number>(0);
  const [viewerFontSize, setViewerFontSize] = useState<number>(1.2);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const [viewerContent, setViewerContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false); // State for edit mode

  // Efeito para redefinir configurações do visualizador quando ele abre/fecha
  useEffect(() => {
    console.log("ChordViewer: Redefinindo configurações do visualizador (transposição, tamanho da fonte, visibilidade dos resultados da busca).");
    setViewerTransposeDelta(0);
    setViewerFontSize(1.2);
    setShowSearchResults(false);
    setIsEditing(false); // Reset edit mode
  }, [open]);

  // Efeito para inicializar viewerContent quando uma NOVA música é carregada ou o conteúdo da música atual muda
  useEffect(() => {
    console.log("ChordViewer: Inicializando viewerContent para currentSong.id:", currentSong?.id, "e content change.");
    if (currentSong) {
      setViewerContent(currentSong.extractedChords || '');
    } else {
      setViewerContent('');
    }
  }, [currentSong?.id, currentSong?.extractedChords, open]);

  // Função para obter o conteúdo para exibição, aplicando transposição ao viewerContent
  const getDisplayedContent = useCallback(() => {
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

    // Aplica transposição ao conteúdo do Textarea
    if (viewerContent) {
      const lines = viewerContent.split('\n');
      const transposedLines = lines.map(line => transposeChordLine(line, viewerTransposeDelta));
      return transposedLines.join('\n');
    }
    return '';
  }, [currentSong, viewerTransposeDelta, viewerContent, isRepertoireViewerActive, searchTerm, searchResults, viewerNavigableSongs]);


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

  const handleSaveDirectEdit = async () => {
    if (!currentSong) {
      toast.error("Nenhuma música selecionada para salvar.");
      return;
    }
    console.log("ChordViewer: Tentando salvar edição direta para a música ID:", currentSong.id, "Conteúdo:", viewerContent);
    try {
      await onSaveTransposition(currentSong.id, viewerContent); // Salva o conteúdo do Textarea
      await onSongsRefetch(); // Recarrega as músicas após salvar
      toast.success("Música atualizada com sucesso!");
      setIsEditing(false); // Exit edit mode after saving
    } catch (error) {
      console.error("ChordViewer: Erro ao salvar edição direta:", error);
      toast.error("Erro ao salvar edição: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleSaveTransposedContent = async () => {
    if (!currentSong || viewerTransposeDelta === 0) {
      toast.info("Nenhuma transposição para salvar ou nenhuma música selecionada.");
      return;
    }

    const currentTransposedContent = getDisplayedContent(); // Este já tem a transposição aplicada
    console.log("ChordViewer: Tentando salvar conteúdo transposto para a música ID:", currentSong.id, "Conteúdo:", currentTransposedContent);
    try {
      await onSaveTransposition(currentSong.id, currentTransposedContent);
      await onSongsRefetch(); // Recarrega as músicas após salvar a transposição
      // Redefine o delta de transposição após salvar o conteúdo transposto
      setViewerTransposeDelta(0);
      toast.success("Transposição salva com sucesso!");
    } catch (error) {
      console.error("ChordViewer: Erro ao salvar transposição:", error);
      toast.error("Erro ao salvar transposição: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchTermChange(e.target.value);
    setShowSearchResults(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-full h-screen flex flex-col p-0 sm:max-w-[90vw] sm:h-[90vh]">
        <DialogHeader className="p-4 border-b dark:border-gray-700 flex items-center justify-between gap-2">
          {/* Grupo da esquerda: Input de busca (condicional), Botões de transposição, Dropdown, Título */}
          <div className="flex items-center gap-2 relative z-40">
            {!isRepertoireViewerActive && (
              <div className="relative w-48"> {/* Largura fixa para o input de busca */}
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400 z-10" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={handleSearchInputChange}
                  className="pl-9 w-full relative z-20"
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
            )}

            {/* Botões de transposição */}
            <Button onClick={() => setViewerTransposeDelta(prev => prev - 1)} disabled={!currentSong || isEditing} variant="outline" size="sm">
              -1
            </Button>
            <Button onClick={() => setViewerTransposeDelta(0)} disabled={!currentSong || viewerTransposeDelta === 0 || isEditing} variant="outline" size="sm">
              Reset
            </Button>
            <Button onClick={() => setViewerTransposeDelta(prev => prev + 1)} disabled={!currentSong || isEditing} variant="outline" size="sm">
              +1
            </Button>

            {/* Menu Dropdown para outras ações */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <EllipsisVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {/* Opção de salvar transposição */}
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={handleSaveTransposedContent} disabled={!currentSong || viewerTransposeDelta === 0 || isEditing}>
                  <Save className="mr-2 h-4 w-4" /> Salvar Transposição
                </DropdownMenuItem>
                <DropdownMenuSeparator />

                {/* Opções de tamanho da fonte */}
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={() => setViewerFontSize(prev => Math.max(prev - 0.1, 0.8))} disabled={!currentSong}>
                  <ZoomOut className="mr-2 h-4 w-4" /> Diminuir Fonte
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={() => setViewerFontSize(prev => Math.min(prev + 0.1, 2.5))} disabled={!currentSong}>
                  <ZoomIn className="mr-2 h-4 w-4" /> Aumentar Fonte
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Título da música - agora parte do grupo da esquerda */}
            <DialogTitle className="text-xl font-bold min-w-0 truncate">
              {getViewerTitle()}
            </DialogTitle>
          </div>

          {/* Botão de fechar */}
          <DialogClose asChild>
            <Button variant="ghost" size="sm" className="p-2 relative z-40">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>

        {isEditing ? (
          <Textarea
            value={viewerContent} // Use viewerContent for editing
            onChange={(e) => {
              setViewerContent(e.target.value);
              onContentChange(e.target.value); // Call prop to update parent state
            }}
            onBlur={handleSaveDirectEdit} // Save on blur
            className="flex-1 p-4 font-mono leading-relaxed resize-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
            style={{ fontSize: `${viewerFontSize}rem`, lineHeight: '1.5' }}
            autoFocus // Automatically focus when entering edit mode
          />
        ) : (
          <div 
            className="flex-1 p-4 cursor-text overflow-x-auto"
            onClick={() => currentSong && setIsEditing(true)} // Enter edit mode on click
          >
            <StyledChordDisplay
              content={getDisplayedContent()} // Use getDisplayedContent for formatted display
              fontSize={viewerFontSize}
            />
          </div>
        )}

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