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
import { extrairCifras, transposeChordLine } from "@/lib/chordUtils";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Save, Trash2, Maximize2, Minimize2, Copy } from 'lucide-react';
import { cn } from "@/lib/utils"; // Import cn for conditional class names

interface Song {
  id: string;
  title: string;
  originalContent: string; // The raw input content
  extractedChords: string; // The processed chords
}

const ChordRecognizer = () => {
  const [inputText, setInputText] = useState<string>('');
  const [outputText, setOutputText] = useState<string>('');
  const [originalOutputText, setOriginalOutputText] = useState<string>(''); // For restore functionality
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState<number | null>(null);
  const [newSongTitle, setNewSongTitle] = useState<string>('');
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false);
  const [viewerTransposeDelta, setViewerTransposeDelta] = useState<number>(0);

  // Load songs from localStorage on initial render
  useEffect(() => {
    const storedSongs = localStorage.getItem('chordRecognizerSongs');
    if (storedSongs) {
      setSongs(JSON.parse(storedSongs));
    }
  }, []);

  // Save songs to localStorage whenever the songs state changes
  useEffect(() => {
    localStorage.setItem('chordRecognizerSongs', JSON.stringify(songs));
  }, [songs]);

  // Process input text to extract chords
  const processInput = useCallback((text: string) => {
    const extracted = extrairCifras(text);
    setOutputText(extracted);
    setOriginalOutputText(extracted); // Set original for restore
  }, []);

  // Handle input changes
  useEffect(() => {
    processInput(inputText);
  }, [inputText, processInput]);

  const handleClear = () => {
    setInputText('');
    setOutputText('');
    setOriginalOutputText('');
    setNewSongTitle('');
    setCurrentSongIndex(null);
    toast.info("Input e output limpos.");
  };

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

  const handleSaveSong = () => {
    if (!inputText.trim() || !outputText.trim()) {
      toast.error("Não há música para salvar. Por favor, cole o conteúdo primeiro.");
      return;
    }
    if (!newSongTitle.trim()) {
      toast.error("Por favor, insira um título para a música.");
      return;
    }

    const newSong: Song = {
      id: Date.now().toString(),
      title: newSongTitle.trim(),
      originalContent: inputText,
      extractedChords: outputText,
    };
    setSongs(prev => [...prev, newSong]);
    setNewSongTitle('');
    toast.success(`Música "${newSong.title}" salva com sucesso!`);
  };

  const handleLoadSong = (index: number) => {
    const songToLoad = songs[index];
    if (songToLoad) {
      setInputText(songToLoad.originalContent);
      // The useEffect for inputText will handle setting outputText and originalOutputText
      setCurrentSongIndex(index);
      setNewSongTitle(songToLoad.title); // Pre-fill title for editing/resaving
      toast.info(`Música "${songToLoad.title}" carregada.`);
    }
  };

  const handleDeleteSong = (id: string) => {
    setSongs(prev => prev.filter(song => song.id !== id));
    if (currentSongIndex !== null && songs[currentSongIndex]?.id === id) {
      handleClear(); // Clear if the deleted song was currently loaded
    }
    toast.success("Música excluída.");
  };

  const handleNextSong = () => {
    if (songs.length === 0) return;
    const nextIndex = (currentSongIndex === null || currentSongIndex === songs.length - 1)
      ? 0
      : currentSongIndex + 1;
    handleLoadSong(nextIndex);
    setViewerTransposeDelta(0); // Reset transpose when changing songs in viewer
  };

  const handlePreviousSong = () => {
    if (songs.length === 0) return;
    const prevIndex = (currentSongIndex === null || currentSongIndex === 0)
      ? songs.length - 1
      : currentSongIndex - 1;
    handleLoadSong(prevIndex);
    setViewerTransposeDelta(0); // Reset transpose when changing songs in viewer
  };

  const getViewerContent = () => {
    if (currentSongIndex !== null && songs[currentSongIndex]) {
      const lines = songs[currentSongIndex].extractedChords.split('\n');
      const transposedLines = lines.map(line => transposeChordLine(line, viewerTransposeDelta));
      return transposedLines.join('\n');
    }
    return outputText; // Fallback to current output if no song is selected
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

  return (
    <div className="min-h-screen flex flex-col lg:flex-row gap-6 p-4 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-50">
      <Card className="flex-1 flex flex-col shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Reconhecedor de Cifras</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 p-4">
          <div className="flex flex-wrap gap-2 mb-4 items-center">
            <label htmlFor="inputMusica" className="font-semibold text-lg">Entrada de Música</label>
            <Button onClick={handleClear} variant="destructive" className="ml-auto">Limpar</Button>
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
            <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="ml-auto"
                  disabled={!outputText}
                  onClick={() => {
                    if (currentSongIndex === null && outputText) {
                      // If no song is loaded but there's output, create a temporary "current" song for viewer
                      const tempSong: Song = {
                        id: 'temp',
                        title: 'Música Atual',
                        originalContent: inputText,
                        extractedChords: outputText,
                      };
                      setSongs(prev => {
                        const newSongs = prev.filter(s => s.id !== 'temp'); // Remove old temp if exists
                        return [...newSongs, tempSong];
                      });
                      setCurrentSongIndex(songs.length); // Set index to the newly added temp song
                    }
                    setViewerTransposeDelta(0); // Reset transpose when opening viewer
                  }}
                >
                  <Maximize2 className="mr-2 h-4 w-4" /> Tela Cheia
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[90vw] h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-4 border-b dark:border-gray-700">
                  <DialogTitle className="text-xl text-center">
                    {currentSongIndex !== null && songs[currentSongIndex] ? songs[currentSongIndex].title : "Cifras em Tela Cheia"}
                  </DialogTitle>
                </DialogHeader>
                <div className="flex-1 p-4 overflow-auto font-mono text-lg leading-relaxed">
                  <pre className="whitespace-pre-wrap">{getViewerContent()}</pre>
                </div>
                <div className="flex justify-between p-4 border-t dark:border-gray-700">
                  <div className="flex gap-2">
                    <Button onClick={() => setViewerTransposeDelta(prev => prev - 1)} variant="secondary">Transpor -1</Button>
                    <Button onClick={() => setViewerTransposeDelta(prev => prev + 1)} variant="secondary">Transpor +1</Button>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handlePreviousSong} disabled={songs.length <= 1} variant="outline">
                      <ChevronLeft className="h-4 w-4" /> Anterior
                    </Button>
                    <Button onClick={handleNextSong} disabled={songs.length <= 1} variant="outline">
                      Próxima <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button onClick={() => setIsViewerOpen(false)} variant="ghost">
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

      <Card className="w-full lg:w-80 flex flex-col shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-center">Minhas Músicas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 p-4">
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Título da música"
              value={newSongTitle}
              onChange={(e) => setNewSongTitle(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSaveSong} disabled={!inputText.trim() || !newSongTitle.trim()}>
              <Save className="mr-2 h-4 w-4" /> Salvar
            </Button>
          </div>
          <ScrollArea className="flex-1 border rounded-md p-2">
            {songs.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400">Nenhuma música salva ainda.</p>
            ) : (
              <div className="space-y-2">
                {songs.map((song, index) => (
                  <div
                    key={song.id}
                    className={cn(
                      "flex items-center justify-between p-2 border rounded-md bg-white dark:bg-gray-700 shadow-sm",
                      currentSongIndex === index && "bg-blue-50 dark:bg-blue-900 border-blue-500 ring-2 ring-blue-500" // Highlight class
                    )}
                  >
                    <span className="font-medium truncate">{song.title}</span>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => handleLoadSong(index)}
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                      >
                        Carregar
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. Isso excluirá permanentemente a música "{song.title}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteSong(song.id)}>
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
      <MadeWithDyad />
    </div>
  );
};

export default ChordRecognizer;