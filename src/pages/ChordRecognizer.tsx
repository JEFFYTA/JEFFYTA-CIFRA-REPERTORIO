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
import { Switch } from "@/components/ui/switch"; // Importar o Switch
import { Label } from "@/components/ui/label"; // Importar o Label
import { extrairCifras, transposeChordLine } from "@/lib/chordUtils";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Save, Trash2, Maximize2, Minimize2, Copy, PlusCircle } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Repertoire } from "@/types/repertoire"; // Importar o novo tipo Repertoire

interface Song {
  id: string;
  title: string;
  originalContent: string; // The raw input content
  extractedChords: string; // The processed chords
}

const ChordRecognizer = () => {
  const [inputText, setInputText] = useState<string>('');
  const [outputText, setOutputText] = useState<string>('');
  const [originalOutputText, setOriginalOutputText] = useState<string>('');
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState<number | null>(null);
  const [newSongTitle, setNewSongTitle] = useState<string>('');
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false);
  const [viewerTransposeDelta, setViewerTransposeDelta] = useState<number>(0);

  // New state for repertoires
  const [repertoires, setRepertoires] = useState<Repertoire[]>([]);
  const [selectedRepertoireId, setSelectedRepertoireId] = useState<string | null>(null);
  const [newRepertoireName, setNewRepertoireName] = useState<string>('');

  // Load songs and repertoires from localStorage on initial render
  useEffect(() => {
    const storedSongs = localStorage.getItem('chordRecognizerSongs');
    if (storedSongs) {
      setSongs(JSON.parse(storedSongs));
    }
    const storedRepertoires = localStorage.getItem('chordRecognizerRepertoires');
    if (storedRepertoires) {
      setRepertoires(JSON.parse(storedRepertoires));
    }
  }, []);

  // Save songs to localStorage whenever the songs state changes
  useEffect(() => {
    localStorage.setItem('chordRecognizerSongs', JSON.stringify(songs));
  }, [songs]);

  // Save repertoires to localStorage whenever the repertoires state changes
  useEffect(() => {
    localStorage.setItem('chordRecognizerRepertoires', JSON.stringify(repertoires));
  }, [repertoires]);

  // Process input text to extract chords
  const processInput = useCallback((text: string) => {
    const extracted = extrairCifras(text);
    setOutputText(extracted);
    setOriginalOutputText(extracted);
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
      setCurrentSongIndex(index);
      setNewSongTitle(songToLoad.title);
      toast.info(`Música "${songToLoad.title}" carregada.`);
    }
  };

  const handleDeleteSong = (id: string) => {
    setSongs(prev => prev.filter(song => song.id !== id));
    // Also remove song from any repertoires it might be in
    setRepertoires(prev => prev.map(rep => ({
      ...rep,
      songIds: rep.songIds.filter(songId => songId !== id)
    })));

    if (currentSongIndex !== null && songs[currentSongIndex]?.id === id) {
      handleClear();
    }
    toast.success("Música excluída.");
  };

  const handleNextSong = () => {
    if (songs.length === 0) return;
    const nextIndex = (currentSongIndex === null || currentSongIndex === songs.length - 1)
      ? 0
      : currentSongIndex + 1;
    handleLoadSong(nextIndex);
    setViewerTransposeDelta(0);
  };

  const handlePreviousSong = () => {
    if (songs.length === 0) return;
    const prevIndex = (currentSongIndex === null || currentSongIndex === 0)
      ? songs.length - 1
      : currentSongIndex - 1;
    handleLoadSong(prevIndex);
    setViewerTransposeDelta(0);
  };

  const getViewerContent = () => {
    if (currentSongIndex !== null && songs[currentSongIndex]) {
      const lines = songs[currentSongIndex].extractedChords.split('\n');
      const transposedLines = lines.map(line => transposeChordLine(line, viewerTransposeDelta));
      return transposedLines.join('\n');
    }
    return outputText;
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

  // Repertoire functions
  const handleCreateRepertoire = () => {
    if (!newRepertoireName.trim()) {
      toast.error("Por favor, insira um nome para o repertório.");
      return;
    }
    const newRep: Repertoire = {
      id: Date.now().toString(),
      name: newRepertoireName.trim(),
      songIds: [],
    };
    setRepertoires(prev => [...prev, newRep]);
    setNewRepertoireName('');
    toast.success(`Repertório "${newRep.name}" criado!`);
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

  const handleDeleteRepertoire = (id: string) => {
    setRepertoires(prev => prev.filter(rep => rep.id !== id));
    if (selectedRepertoireId === id) {
      setSelectedRepertoireId(null);
    }
    toast.success("Repertório excluído.");
  };

  const handleToggleSongInRepertoire = (songId: string, isChecked: boolean) => {
    if (!selectedRepertoireId) return;

    setRepertoires(prev => prev.map(rep => {
      if (rep.id === selectedRepertoireId) {
        const newSongIds = isChecked
          ? [...new Set([...rep.songIds, songId])] // Add if checked, ensure unique
          : rep.songIds.filter(id => id !== songId); // Remove if unchecked
        return { ...rep, songIds: newSongIds };
      }
      return rep;
    }));

    const songTitle = songs.find(s => s.id === songId)?.title || "Música";
    const repertoireName = repertoires.find(rep => rep.id === selectedRepertoireId)?.name || "repertório";
    if (isChecked) {
      toast.success(`"${songTitle}" adicionada ao repertório "${repertoireName}".`);
    } else {
      toast.info(`"${songTitle}" removida do repertório "${repertoireName}".`);
    }
  };

  const selectedRepertoire = selectedRepertoireId
    ? repertoires.find(rep => rep.id === selectedRepertoireId)
    : null;

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
                      const tempSong: Song = {
                        id: 'temp',
                        title: 'Música Atual',
                        originalContent: inputText,
                        extractedChords: outputText,
                      };
                      setSongs(prev => {
                        const newSongs = prev.filter(s => s.id !== 'temp');
                        return [...newSongs, tempSong];
                      });
                      setCurrentSongIndex(songs.length);
                    }
                    setViewerTransposeDelta(0);
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

      <div className="w-full lg:w-80 flex flex-col gap-6">
        <Card className="flex flex-col shadow-lg">
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
                        currentSongIndex === index && "bg-blue-50 dark:bg-blue-900 border-blue-500 ring-2 ring-blue-500"
                      )}
                    >
                      <span className="font-medium truncate">{song.title}</span>
                      <div className="flex gap-1 items-center">
                        {selectedRepertoireId && (
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`song-${song.id}-repertoire-toggle`}
                              checked={selectedRepertoire?.songIds.includes(song.id)}
                              onCheckedChange={(checked) => handleToggleSongInRepertoire(song.id, checked)}
                            />
                            <Label htmlFor={`song-${song.id}-repertoire-toggle`} className="sr-only">
                              {selectedRepertoire?.songIds.includes(song.id) ? "Remover do repertório" : "Adicionar ao repertório"}
                            </Label>
                          </div>
                        )}
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
                                Esta ação não pode ser desfeita. Isso excluirá permanentemente a música "{song.title}" de todas as listas e repertórios.
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

        <Card className="flex flex-col shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-center">Meus Repertórios</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 p-4">
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Nome do repertório"
                value={newRepertoireName}
                onChange={(e) => setNewRepertoireName(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleCreateRepertoire} disabled={!newRepertoireName.trim()}>
                <PlusCircle className="mr-2 h-4 w-4" /> Criar
              </Button>
            </div>
            <ScrollArea className="flex-1 border rounded-md p-2">
              {repertoires.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400">Nenhum repertório salvo ainda.</p>
              ) : (
                <div className="space-y-2">
                  {repertoires.map((rep) => (
                    <div
                      key={rep.id}
                      className={cn(
                        "flex items-center justify-between p-2 border rounded-md bg-white dark:bg-gray-700 shadow-sm",
                        selectedRepertoireId === rep.id && "bg-purple-50 dark:bg-purple-900 border-purple-500 ring-2 ring-purple-500"
                      )}
                    >
                      <span className="font-medium truncate">{rep.name} ({rep.songIds.length})</span>
                      <div className="flex gap-1">
                        <Button
                          onClick={() => handleSelectRepertoire(rep.id)}
                          variant="ghost"
                          size="sm"
                          className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200"
                        >
                          Selecionar
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
                                Esta ação não pode ser desfeita. Isso excluirá permanentemente o repertório "{rep.name}". As músicas dentro dele não serão excluídas.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteRepertoire(rep.id)}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                  {selectedRepertoireId && (
                    <Button
                      onClick={() => handleSelectRepertoire(null)}
                      variant="outline"
                      className="w-full mt-4"
                    >
                      Desselecionar Repertório
                    </Button>
                  )}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChordRecognizer;