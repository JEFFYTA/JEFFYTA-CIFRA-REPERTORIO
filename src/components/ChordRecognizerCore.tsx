"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Maximize2, Upload } from 'lucide-react'; // Adicionado Upload icon
import { toast } from "sonner"; // Importar toast

interface ChordRecognizerCoreProps {
  inputText: string;
  onInputTextChange: (text: string) => void;
  outputText: string;
  onOutputTextChange: (text: string) => void;
  onTranspose: (delta: number) => void;
  onRestore: () => void;
  onClear: () => void;
  onSaveOutput: () => void;
  onOpenFullScreenViewer: () => void;
  onSignOut: () => void;
  newSongTitle: string;
  onNewSongTitleChange: (title: string) => void;
  onImportFile: (file: File) => void; // Alterado: agora aceita o objeto File
}

const ChordRecognizerCore: React.FC<ChordRecognizerCoreProps> = ({
  inputText,
  onInputTextChange,
  outputText,
  onOutputTextChange,
  onTranspose,
  onRestore,
  onClear,
  onSaveOutput,
  onOpenFullScreenViewer,
  onSignOut,
  newSongTitle,
  onNewSongTitleChange,
  onImportFile,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImportFile(file); // Passa o objeto File completo
    }
    // Limpar o valor do input para permitir o upload do mesmo arquivo novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <Card className="flex-1 flex flex-col shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Reconhecedor de Cifras</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 p-4">
          <div className="flex flex-wrap gap-2 mb-4 items-center">
            <label htmlFor="inputMusica" className="font-semibold text-lg">Entrada de Música</label>
            <Button onClick={onClear} variant="destructive" className="ml-auto">Limpar</Button>
            <Button onClick={handleFileImportClick} variant="outline">
              <Upload className="mr-2 h-4 w-4" /> Importar Arquivo
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".txt,.rtf" // Aceitar arquivos de texto e RTF
            />
            <Button onClick={onSignOut} variant="outline">Sair</Button>
          </div>
          <Textarea
            id="inputMusica"
            placeholder="Cole aqui a música com título, seções e cifras..."
            value={inputText}
            onChange={(e) => onInputTextChange(e.target.value)}
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
            <Button onClick={() => onTranspose(1)} className="bg-green-600 hover:bg-green-700 text-white">Transpor +1</Button>
            <Button onClick={() => onTranspose(-1)} className="bg-red-600 hover:bg-red-700 text-white">Transpor -1</Button>
            <Button onClick={onRestore} className="bg-blue-600 hover:bg-blue-700 text-white">Restaurar</Button>
            <div className="flex-1 min-w-[150px]"> {/* Adicionado div para o input do título */}
              <Label htmlFor="newSongTitle" className="sr-only">Título da Música</Label>
              <Input
                id="newSongTitle"
                placeholder="Título da música"
                value={newSongTitle}
                onChange={(e) => onNewSongTitleChange(e.target.value)}
                className="w-full"
              />
            </div>
            <Button onClick={onSaveOutput} disabled={!outputText || outputText.trim() === '' || !newSongTitle.trim()}>
              <Save className="mr-2 h-4 w-4" /> Salvar
            </Button>
            <Button
              variant="outline"
              className="ml-auto"
              onClick={onOpenFullScreenViewer}
            >
              <Maximize2 className="mr-2 h-4 w-4" /> Tela Cheia
            </Button>
          </div>
          <Textarea
            id="output"
            value={outputText}
            onChange={(e) => onOutputTextChange(e.target.value)}
            className="flex-1 min-h-[300px] lg:min-h-[600px] font-mono text-base resize-y bg-gray-50 dark:bg-gray-800"
          />
        </CardContent>
      </Card>
    </>
  );
};

export default ChordRecognizerCore;