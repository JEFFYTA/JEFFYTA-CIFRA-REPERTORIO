"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
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
import { Trash2, Search, Play } from 'lucide-react'; // Adicionado Play
import { cn } from "@/lib/utils";
import { Repertoire } from "@/types/repertoire";
import { Song } from "@/types/song";

interface MySongsContentProps {
  songs: Song[];
  currentSongId: string | null; // Alterado de currentSongIndex para currentSongId
  handleLoadSong: (id: string) => void;
  handleDeleteSong: (id: string) => void;
  selectedRepertoireId: string | null;
  selectedRepertoire: Repertoire | null;
  handleToggleSongInRepertoire: (songId: string, isChecked: boolean) => void;
  onOpenViewer: (songId: string) => void; // Novo prop para abrir o viewer
}

const MySongsContent: React.FC<MySongsContentProps> = ({
  songs,
  currentSongId,
  handleLoadSong,
  handleDeleteSong,
  selectedRepertoireId,
  selectedRepertoire,
  handleToggleSongInRepertoire,
  onOpenViewer,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredSongs = songs.filter(song =>
    song.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col flex-1 p-4">
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
            {filteredSongs.map((song) => {
              const isInRepertoire = selectedRepertoire?.songIds.includes(song.id);
              return (
                <div
                  key={song.id}
                  className={cn(
                    "flex items-center justify-between p-2 border rounded-md bg-white dark:bg-gray-700 shadow-sm",
                    currentSongId === song.id && "bg-blue-50 dark:bg-blue-900 border-blue-500 ring-2 ring-blue-500"
                  )}
                >
                  <span className="font-medium truncate flex-grow mr-2">{song.title}</span>
                  <div className="flex gap-1 items-center flex-shrink-0 min-w-[100px]">
                    {selectedRepertoireId && (
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`song-${song.id}-repertoire-toggle`}
                          checked={isInRepertoire}
                          onCheckedChange={(checked) => handleToggleSongInRepertoire(song.id, checked)}
                        />
                        <Label htmlFor={`song-${song.id}-repertoire-toggle`} className="sr-only">
                          {isInRepertoire ? "Remover do repertório" : "Adicionar ao repertório"}
                        </Label>
                      </div>
                    )}
                    <Button
                      onClick={() => onOpenViewer(song.id)} // Usar onOpenViewer
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                      title="Visualizar"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    {/* Botão "Carregar" removido */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                          title="Excluir"
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
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default MySongsContent;