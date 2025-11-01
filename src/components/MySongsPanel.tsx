"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Save, Trash2, Search } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Repertoire } from "@/types/repertoire";
import { Song } from "@/types/song"; // Importar o tipo Song

interface MySongsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  songs: Song[];
  currentSongIndex: number | null;
  newSongTitle: string;
  setNewSongTitle: (title: string) => void;
  handleSaveSong: () => void;
  handleLoadSong: (id: string) => void; // Alterado para receber ID
  handleDeleteSong: (id: string) => void;
  selectedRepertoireId: string | null;
  selectedRepertoire: Repertoire | null;
  handleToggleSongInRepertoire: (songId: string, isChecked: boolean) => void;
}

const MySongsPanel: React.FC<MySongsPanelProps> = ({
  open,
  onOpenChange,
  songs,
  currentSongIndex,
  newSongTitle,
  setNewSongTitle,
  handleSaveSong,
  handleLoadSong,
  handleDeleteSong,
  selectedRepertoireId,
  selectedRepertoire,
  handleToggleSongInRepertoire,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredSongs = songs.filter(song =>
    song.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="text-2xl text-center">Minhas Músicas</SheetTitle>
          {selectedRepertoire && (
            <p className="text-center text-sm text-purple-600 dark:text-purple-400 font-medium">
              Repertório selecionado: {selectedRepertoire.name}
            </p>
          )}
        </SheetHeader>
        <div className="flex flex-col flex-1 p-4">
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Título da música"
              value={newSongTitle}
              onChange={(e) => setNewSongTitle(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSaveSong} disabled={!newSongTitle.trim()}>
              <Save className="mr-2 h-4 w-4" /> Salvar
            </Button>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              placeholder="Buscar músicas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="flex-1 border rounded-md p-2">
            {filteredSongs.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400">
                {searchTerm ? "Nenhuma música encontrada." : "Nenhuma música salva ainda."}
              </p>
            ) : (
              <div className="space-y-2">
                {filteredSongs.map((song, index) => (
                  <div
                    key={song.id}
                    className={cn(
                      "flex items-center justify-between p-2 border rounded-md bg-white dark:bg-gray-700 shadow-sm",
                      currentSongIndex !== null && songs[currentSongIndex]?.id === song.id && "bg-blue-50 dark:bg-blue-900 border-blue-500 ring-2 ring-blue-500"
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
                        onClick={() => handleLoadSong(song.id)} // Passar o ID da música
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
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MySongsPanel;