"use client";

import React from 'react';
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
import { PlusCircle, Trash2, Play, LibraryBig } from 'lucide-react'; // Adicionado LibraryBig
import { cn } from "@/lib/utils";
import { Repertoire } from "@/types/repertoire";

interface MyRepertoiresContentProps {
  repertoires: Repertoire[];
  selectedRepertoireId: string | null;
  setSelectedRepertoireId: (id: string | null) => void;
  newRepertoireName: string;
  setNewRepertoireName: (name: string) => void;
  handleCreateRepertoire: () => void;
  handleSelectRepertoire: (id: string | null) => void;
  handleDeleteRepertoire: (id: string) => void;
  handleOpenRepertoireViewer: () => void;
  onOpenSongSelectionSidebar: () => void; // Nova prop
}

const MyRepertoiresContent: React.FC<MyRepertoiresContentProps> = ({
  repertoires,
  selectedRepertoireId,
  setSelectedRepertoireId,
  newRepertoireName,
  setNewRepertoireName,
  handleCreateRepertoire,
  handleSelectRepertoire,
  handleDeleteRepertoire,
  handleOpenRepertoireViewer,
  onOpenSongSelectionSidebar, // Usar a nova prop
}) => {
  return (
    <div className="flex flex-col flex-1 p-4">
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Nome do repertório"
          value={newRepertoireName}
          onChange={(e) => setNewRepertoireName(e.target.value)}
          className="flex-1"
        />
        <Button onClick={handleCreateRepertoire} disabled={!newRepertoireName.trim()} size="sm">
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
              <>
                <Button
                  onClick={() => handleSelectRepertoire(null)}
                  variant="outline"
                  className="w-full mt-4"
                  size="sm"
                >
                  Desselecionar Repertório
                </Button>
                <Button
                  onClick={onOpenSongSelectionSidebar} // Novo botão para abrir o sidebar de seleção de músicas
                  disabled={!selectedRepertoireId}
                  className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  <LibraryBig className="mr-2 h-4 w-4" /> Adicionar/Remover Músicas
                </Button>
                <Button
                  onClick={handleOpenRepertoireViewer}
                  disabled={!selectedRepertoireId || repertoires.find(r => r.id === selectedRepertoireId)?.songIds.length === 0}
                  className="w-full mt-2 bg-purple-600 hover:bg-purple-700 text-white"
                  size="sm"
                >
                  <Play className="mr-2 h-4 w-4" /> Abrir Repertório
                </Button>
              </>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default MyRepertoiresContent;