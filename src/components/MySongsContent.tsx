"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
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
import { Play, Trash2, FileText } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Song } from "@/types/song";
import { Repertoire } from "@/types/repertoire";

interface MySongsContentProps {
  songs: Song[];
  currentSongId: string | null;
  handleLoadSong: (songId: string) => void;
  handleDeleteSong: (songId: string) => void;
  selectedRepertoireId: string | null;
  selectedRepertoire: Repertoire | null;
  handleToggleSongInRepertoire: (songId: string, isChecked: boolean) => void;
  onOpenViewer: (songId: string) => void;
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
  const sortedSongs = [...songs].sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div className="flex flex-col flex-1 p-4">
      <ScrollArea className="flex-1 border rounded-md p-2">
        {sortedSongs.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">Nenhuma música salva ainda.</p>
        ) : (
          <div className="space-y-2">
            {sortedSongs.map((song) => {
              const isInSelectedRepertoire = selectedRepertoireId && selectedRepertoire?.songIds.includes(song.id);
              return (
                <div
                  key={song.id}
                  className={cn(
                    "flex items-center gap-2 p-2 border rounded-md bg-white dark:bg-gray-700 shadow-sm",
                    currentSongId === song.id && "bg-blue-50 dark:bg-blue-900 border-blue-500 ring-2 ring-blue-500"
                  )}
                >
                  {/* Botões de ação à esquerda */}
                  <div className="flex gap-1 items-center flex-none">
                    <Button
                      onClick={() => onOpenViewer(song.id)}
                      variant="ghost"
                      size="sm"
                      className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                      title="Visualizar"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleLoadSong(song.id)}
                      variant="ghost"
                      size="sm"
                      className="p-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                      title="Carregar no Reconhecedor"
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    {selectedRepertoireId && (
                      <div className="flex items-center space-x-1" title={isInSelectedRepertoire ? "Remover do repertório" : "Adicionar ao repertório"}>
                        <Switch
                          id={`song-${song.id}-repertoire-toggle`}
                          checked={isInSelectedRepertoire}
                          onCheckedChange={(checked) => handleToggleSongInRepertoire(song.id, checked)}
                        />
                        <Label htmlFor={`song-${song.id}-repertoire-toggle`} className="sr-only">
                          {isInSelectedRepertoire ? "Remover do repertório" : "Adicionar ao repertório"}
                        </Label>
                      </div>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                          title="Excluir música"
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
                  {/* Título da música */}
                  <span className="font-medium truncate flex-auto min-w-0">{song.title}</span>
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