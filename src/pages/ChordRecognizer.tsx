"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { transposeChordLine } from "@/lib/chordUtils";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Save, Trash2, Maximize2, Minimize2, Copy, PlusCircle, Music, ListMusic, Search, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Repertoire } from "@/types/repertoire";
import { Song } from "@/types/song";
import MySongsPanel from "@/components/MySongsPanel";
import MyRepertoiresPanel from "@/components/MyRepertoiresPanel";
import { useSongManagement } from "@/hooks/useSongManagement";
import { useRepertoireManagement } from "@/hooks/useRepertoireManagement";
import { supabase } from "@/integrations/supabase/client"; // Importar o cliente Supabase
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';


const ChordRecognizer = () => {
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false);
  const [viewerTransposeDelta, setViewerTransposeDelta] = useState<number>(0);
  const [viewerSearchTerm, setViewerSearchTerm] = useState<string>('');
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const [viewerFontSize, setViewerFontSize] = useState<number>(1.2);
  const [viewerEditedContent, setViewerEditedContent] = useState<string>('');

  const [isSongsPanelOpen, setIsSongsPanelOpen] = useState<boolean>(false);
  const [isRepertoiresPanelOpen, setIsRepertoiresPanelOpen] = useState<boolean>(false);

  const [isRepertoireViewerActive, setIsRepertoireViewerActive] = useState<boolean>(false);
  
  const [viewerNavigableSongs, setViewerNavigableSongs] = useState<Song[]>([]);
  const [currentViewerSongIndex, setCurrentViewerSongIndex] = useState<number>(0);
  const [activeViewerSongId, setActiveViewerSongId] = useState<string | null>(null);

  const [session, setSession] = useState<any>(null); // Estado para a sessão do usuário

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

  // Usando o hook useSongManagement
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
    handleUpdateSongChords, // Nova função para atualizar cifras
    loadingSongs,
  } = useSongManagement({
    initialInputText: '',
    onInputTextChange: (text) => { /* No-op, handled internally by hook */ }
  });

  // Usando o hook useRepertoireManagement
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
    const transposedLines = lines.map(line => transposeChordLine(line, delta));
    setOutputText(transposedLines.join('\n'));
    toast.success(`Cifras transpostas em ${delta > 0 ? '+' : ''}${delta} semitons.`);
  };

  const handleRestore = () => {
    if (originalOutputText) {
      setOutputText(originalOutputText);
      toast.info("Cifras restauradas para a versão original.");
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

  const handleSelectViewerSong = (songId: string) => {
    setActiveViewerSongId(songId);
    const index = viewerNavigableSongs.findIndex(s => s.id === songId);
    if (index !== -1) {
      setCurrentViewerSongIndex(index);
      setViewerEditedContent(viewerNavigableSongs[index].extractedChords);
    }
    setViewerTransposeDelta(0);
    setShowSearchResults(false);
  };

  const handleNextSong = () => {
    if (!activeViewerSongId || viewerNavigableSongs.length === 0) return;
    const nextIndex = (currentViewerSongIndex + 1) % viewerNavigableSongs.length;
    const nextSong = viewerNavigableSongs[nextIndex];
    setActiveViewerSongId(nextSong.id);
    setCurrentViewerSongIndex(nextIndex);
    setViewerTransposeDelta(0);
    setViewerEditedContent(nextSong.extractedChords);
  };

  const handlePreviousSong = () => {
    if (!activeViewerSongId || viewerNavigableSongs.length === 0) return;
    const prevIndex = (currentViewerSongIndex - 1 + viewerNavigableSongs.length) % viewerNavigableSongs.length;
    const prevSong = viewerNavigableSongs[prevIndex];
    setActiveViewerSongId(prevSong.id);
    setCurrentViewerSongIndex(prevIndex);
    setViewerTransposeDelta(0);
    setViewerEditedContent(prevSong.extractedChords);
  };

  const getViewerContent = () => {
    if (!activeViewerSongId) {
      if (!isRepertoireViewerActive && viewerSearchTerm.trim() !== '' && viewerNavigableSongs.length === 0) {
        return "Nenhuma música encontrada com este termo.";
      }
      if (!isRepertoireViewerActive && viewerSearchTerm.trim() === '') {
        return "Busque por uma música para começar.";
      }
      if (isRepertoireViewerActive && viewerNavigableSongs.length === 0) {
        return "Este repertório não possui músicas.";
      }
      return '';
    }

    let contentToDisplay = viewerEditedContent;

    if (contentToDisplay) {
      let lines = contentToDisplay.split('\n');
      lines = lines.map(line => transposeChordLine(line, viewerTransposeDelta));
      return lines.join('\n');
    }
    return '';
  };

  const getViewerTitle = () => {
    if (!activeViewerSongId) {
      if (!isRepertoireViewerActive && viewerSearchTerm.trim() !== '' && viewerNavigableSongs.length === 0) {
        return "Nenhuma música encontrada";
      }
      return "Visualizador de Cifras";
    }
    const currentSong = viewerNavigableSongs.find(s => s.id === activeViewerSongId);
    if (!currentSong) return "Visualizador de Cifras";

    if (isRepertoireViewerActive && selectedRepertoire) {
      return `${selectedRepertoire.name} - ${currentSong.title}`;
    }
    return currentSong.title;
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
    setViewerTransposeDelta(0);
    setViewerSearchTerm('');
    setShowSearchResults(false);
    setViewerFontSize(1.2);

    const repertoireSongs = rep.songIds
      .map(id => songs.find(s => s.id === id))
      .filter((s): s is Song => s !== undefined)
      .sort((a, b) => a.title.localeCompare(b.title));

    setViewerNavigableSongs(repertoireSongs);

    if (repertoireSongs.length > 0) {
      setActiveViewerSongId(repertoireSongs[0].id);
      setCurrentViewerSongIndex(0);
      setViewerEditedContent(repertoireSongs[0].extractedChords);
    } else {
      setActiveViewerSongId(null);
      setCurrentViewerSongIndex(0);
      setViewerEditedContent('');
    }

    setIsViewerOpen(true);
    toast.info(`Abrindo repertório "${rep.name}" em tela cheia.`);
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
    setIsRepertoireViewerActive(false);
    setViewerTransposeDelta(0);
    setViewerSearchTerm('');
    setViewerNavigableSongs([]);
    setCurrentViewerSongIndex(0);
    setActiveViewerSongId(null);
    setShowSearchResults(false);
    setViewerFontSize(1.2);
    setViewerEditedContent('');
  };

  const handleZoomIn = () => {
    setViewerFontSize(prev => Math.min(prev + 0.1, 2.5));
  };

  const handleZoomOut = () => {
    setViewerFontSize(prev => Math.max(prev - 0.1, 0.8));
  };

  const handleViewerContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setViewerEditedContent(newContent);

    if (activeViewerSongId) {
      handleUpdateSongChords(activeViewerSongId, newContent); // Usar a função do hook
    }
  };

  const handleSaveTransposition = () => {
    if (!activeViewerSongId || viewerTransposeDelta === 0) {
      toast.info("Nenhuma transposição para salvar ou nenhuma música selecionada.");
      return;
    }

    const currentTransposedContent = getViewerContent();
    setViewerEditedContent(currentTransposedContent);
    setViewerTransposeDelta(0);

    handleUpdateSongChords(activeViewerSongId, currentTransposedContent); // Usar a função do hook
    toast.success("Transposição salva com sucesso!");
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Card className="w-full max-w-md p-8 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Faça login para usar o Reconhecedor de Cifras</CardTitle>
          </CardHeader>
          <CardContent>
            <Auth
              supabaseClient={supabase}
              providers={[]}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: 'hsl(var(--primary))',
                      brandAccent: 'hsl(var(--primary-foreground))',
                    },
                  },
                },
              }}
              theme="light"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-6 p-4 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-50">
      <Card className="flex-1 flex flex-col shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Reconhecedor de Cifras</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 p-4">
          <div className="flex flex-wrap gap-2 mb-4 items-center">
            <label htmlFor="inputMusica" className="font-semibold text-lg">Entrada de Música</label>
            <Button onClick={handleClear} variant="destructive" className="ml-auto">Limpar</Button>
            <Button onClick={() => supabase.auth.signOut()} variant="outline">Sair</Button>
          </div>
          <Textarea
            id="inputMusica"
            placeholder="Cole aqui a música com título, seções e cifras..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 min-h-[300px] lg:min-h-[600px] font-mono text-base resize-y"
          />
        </CardContent>
      </Card>

      <Card className="flex-1 flex flex-col shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Cifras Organizadas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 p-4">
          <div className="flex flex-wrap gap-2 mb-4 items-center">
            <Button onClick={() => handleTranspose(1)} className="bg-green-600 hover:bg-green-700 text-white">Transpor +1</Button>
            <Button onClick={() => handleTranspose(-1)} className="bg-red-600 hover:bg-red-700 text-white">Transpor -1</Button>
            <Button onClick={handleRestore} className="bg-blue-600 hover:bg-blue-700 text-white">Restaurar</Button>
            <Button onClick={handleCopyToClipboard} disabled={!outputText.trim()} variant="outline">
              <Copy className="mr-2 h-4 w-4" /> Copiar
            </Button>
            <Dialog
              open={isViewerOpen}
              onOpenChange={(open) => {
                setIsViewerOpen(open);
                if (open) {
                  setIsRepertoireViewerActive(false); 
                  setViewerTransposeDelta(0);
                  setViewerSearchTerm(''); 
                  setViewerNavigableSongs([]); 
                  setCurrentViewerSongIndex(0); 
                  setActiveViewerSongId(null); 
                  setShowSearchResults(false);
                  setViewerFontSize(1.2);
                  setViewerEditedContent('');
                } else {
                  handleCloseViewer(); 
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="ml-auto"
                  disabled={songs.length === 0}
                >
                  <Maximize2 className="mr-2 h-4 w-4" /> Tela Cheia
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[90vw] h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-4 border-b dark:border-gray-700">
                  <DialogTitle className="text-xl text-center">
                    {getViewerTitle()}
                  </DialogTitle>
                </DialogHeader>
                <div className="p-4 border-b dark:border-gray-700">
                  {!isRepertoireViewerActive && (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <Input
                        placeholder="Buscar músicas na tela cheia..."
                        value={viewerSearchTerm}
                        onChange={(e) => {
                          setViewerSearchTerm(e.target.value);
                          setShowSearchResults(true);
                        }}
                        className="pl-9 w-full"
                      />
                    </div>
                  )}
                  {!isRepertoireViewerActive && showSearchResults && viewerSearchTerm.trim() !== '' && viewerNavigableSongs.length > 0 && (
                      <ScrollArea className="mt-2 h-40 border rounded-md">
                          <div className="p-2 space-y-1">
                              {viewerNavigableSongs.map((song) => (
                                  <Button
                                      key={song.id}
                                      variant="ghost"
                                      className={cn(
                                          "w-full justify-start",
                                          activeViewerSongId === song.id && "bg-accent text-accent-foreground"
                                      )}
                                      onClick={() => handleSelectViewerSong(song.id)}
                                  >
                                      {song.title}
                                  </Button>
                              ))}
                          </div>
                      </ScrollArea>
                  )}
                  {!isRepertoireViewerActive && showSearchResults && viewerSearchTerm.trim() !== '' && viewerNavigableSongs.length === 0 && (
                      <p className="text-center text-gray-500 dark:text-gray-400 mt-2">Nenhuma música encontrada.</p>
                  )}
                </div>
                <div className="flex-1 p-4 overflow-auto font-mono leading-relaxed">
                  <Textarea
                    value={getViewerContent()}
                    onChange={handleViewerContentChange}
                    className="w-full h-full resize-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                    style={{ fontSize: `${viewerFontSize}rem` }}
                    disabled={!activeViewerSongId}
                  />
                </div>
                <div className="flex flex-wrap justify-center gap-2 p-4 border-t dark:border-gray-700">
                  <div className="flex gap-2">
                    <Button onClick={() => setViewerTransposeDelta(prev => prev - 1)} variant="secondary" disabled={!activeViewerSongId}>Transpor -1</Button>
                    <Button onClick={() => setViewerTransposeDelta(prev => prev + 1)} variant="secondary" disabled={!activeViewerSongId}>Transpor +1</Button>
                    <Button
                      onClick={handleSaveTransposition}
                      variant="default"
                      disabled={!activeViewerSongId || viewerTransposeDelta === 0}
                    >
                      <Save className="mr-2 h-4 w-4" /> Salvar Transposição
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleZoomOut} variant="secondary" disabled={!activeViewerSongId}>
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button onClick={handleZoomIn} variant="secondary" disabled={!activeViewerSongId}>
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handlePreviousSong}
                      disabled={!activeViewerSongId || viewerNavigableSongs.length <= 1}
                      variant="outline"
                    >
                      <ChevronLeft className="h-4 w-4" /> Anterior
                    </Button>
                    <Button
                      onClick={handleNextSong}
                      disabled={!activeViewerSongId || viewerNavigableSongs.length <= 1}
                      variant="outline"
                    >
                      Próxima <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button onClick={handleCloseViewer} variant="ghost">
                    <Minimize2 className="mr-2 h-4 w-4" /> Fechar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Textarea
            id="output"
            value={outputText}
            readOnly
            className="flex-1 min-h-[300px] lg:min-h-[600px] font-mono text-base resize-y bg-gray-50 dark:bg-gray-800"
          />
        </CardContent>
      </Card>

      <div className="w-full lg:w-auto flex lg:flex-col gap-4 justify-center lg:justify-start">
        <Button onClick={() => setIsSongsPanelOpen(true)} className="w-full lg:w-auto" disabled={loadingSongs}>
          {loadingSongs ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Music className="mr-2 h-4 w-4" />} Minhas Músicas
        </Button>
        <Button onClick={() => setIsRepertoiresPanelOpen(true)} className="w-full lg:w-auto" disabled={loadingRepertoires}>
          {loadingRepertoires ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ListMusic className="mr-2 h-4 w-4" />} Meus Repertórios
        </Button>
      </div>

      <MySongsPanel
        open={isSongsPanelOpen}
        onOpenChange={setIsSongsPanelOpen}
        songs={songs}
        currentSongIndex={currentSongIndex !== null ? songs.findIndex(s => s.id === songs[currentSongIndex]?.id) : null}
        newSongTitle={newSongTitle}
        setNewSongTitle={setNewSongTitle}
        handleSaveSong={handleSaveSong}
        handleLoadSong={handleLoadSong}
        handleDeleteSong={handleDeleteSong}
        selectedRepertoireId={selectedRepertoireId}
        selectedRepertoire={selectedRepertoire}
        handleToggleSongInRepertoire={handleToggleSongInRepertoire}
      />

      <MyRepertoiresPanel
        open={isRepertoiresPanelOpen}
        onOpenChange={setIsRepertoiresPanelOpen}
        repertoires={repertoires}
        selectedRepertoireId={selectedRepertoireId}
        setSelectedRepertoireId={setSelectedRepertoireId}
        newRepertoireName={newRepertoireName}
        setNewRepertoireName={setNewRepertoireName}
        handleCreateRepertoire={handleCreateRepertoire}
        handleSelectRepertoire={handleSelectRepertoire}
        handleDeleteRepertoire={handleDeleteRepertoire}
        handleOpenRepertoireViewer={handleOpenRepertoireViewer}
      />
    </div>
  );
};

export default ChordRecognizer;