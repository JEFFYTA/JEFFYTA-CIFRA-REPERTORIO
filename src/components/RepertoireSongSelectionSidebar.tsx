"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Search, X } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Repertoire } from "@/types/repertoire";
import { Song } from "@/types/song";

interface RepertoireSongSelectionSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allSongs: Song[];
  selectedRepertoire: Repertoire | null;
  handleToggleSongInRepertoire: (songId: string, isChecked: boolean) => void;
}

const RepertoireSongSelectionSidebar: React.FC<RepertoireSongSelectionSidebarProps> = ({
  open,
  onOpenChange,
  allSongs,
  selectedRepertoire,
  handleToggleSongInRepertoire,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);

  useEffect(() => {
    const lowerCaseSearch = searchTerm.toLowerCase();
    const sortedSongs = [...allSongs].sort((a, b) => a.title.localeCompare(b.title));
    const filtered = sortedSongs.filter(song =>
      song.title.toLowerCase().includes(lowerCaseSearch)
    );
    setFilteredSongs(filtered);
  }, [searchTerm, allSongs]);

  const repertoireName = selectedRepertoire?.name || "Repertório";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader className="flex flex-row items-center justify-between p-4 border-b dark:border-gray-700">
          <SheetTitle className="text-2xl text-center flex-1">Músicas para "{repertoireName}"</SheetTitle>
          <SheetClose asChild>
            <Button variant="ghost" size="sm" className="p-2">
              <X className="h-4 w-4" />
            </Button>
          </SheetClose>
        </SheetHeader>
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
                {searchTerm ? "Nenhuma música encontrada." : "Nenhuma música disponível."}
              </p>
            ) : (
              <div className="space-y-2">
                {filteredSongs.map((song) => {
                  const isInRepertoire = selectedRepertoire?.songIds.includes(song.id);
                  return (
                    <div
                      key={song.id}
                      className="flex items-center justify-between p-2 border rounded-md bg-white dark:bg-gray-700 shadow-sm"
                    >
                      {/* Contêiner do switch: flex-none para não encolher */}
                      <div className="flex items-center space-x-2 flex-none mr-2">
                        <Switch
                          id={`song-${song.id}-repertoire-toggle`}
                          checked={isInRepertoire}
                          onCheckedChange={(checked) => handleToggleSongInRepertoire(song.id, checked)}
                        />
                        <Label htmlFor={`song-${song.id}-repertoire-toggle`} className="sr-only">
                          {isInRepertoire ? "Remover do repertório" : "Adicionar ao repertório"}
                        </Label>
                      </div>
                      {/* Título da música: flex-auto para permitir encolher e truncar */}
                      <span className="font-medium truncate flex-auto min-w-0">{song.title}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default RepertoireSongSelectionSidebar;