"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Maximize2, Upload, FolderOpen } from 'lucide-react'; // Adicionado FolderOpen icon
import { toast } from "sonner"; // Importar toast
import { extrairCifras, extractSongTitle } from "@/lib/chordUtils"; // Importar funções de utilidade

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
  onImportChordsDirectly: (fileContent: string) => void;
  onImportFolder: (songs: { title: string; originalContent: string; extractedChords: string; }[]) => Promise<any>; // Nova prop
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
  onImportChordsDirectly,
  onImportFolder, // Usar a nova prop
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const folderInputRef = React.useRef<HTMLInputElement>(null); // Nova ref para input de pasta

  const handleFileImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFolderImportClick = () => {
    folderInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileContent = e.target?.result as string;
        if (file.name.toLowerCase().endsWith('.txt') || file.type === 'text/plain') {
          onImportChordsDirectly(fileContent);
          toast.success(`Arquivo "${file.name}" importado para Cifras Organizadas.`);
        } else {
          toast.error(
            "Apenas arquivos de texto simples (.txt) são suportados para importação. " +
            "Por favor, converta seu arquivo RTF para TXT antes de importar (ex: abra no Bloco de Notas e salve como .txt)."
          );
          console.warn("Tentativa de importar arquivo não-TXT:", file.name, file.type);
        }
      };
      reader.onerror = () => {
        toast.error("Erro ao ler o arquivo.");
      };
      reader.readAsText(file);
    }
    // Limpar o valor do input para permitir o upload do mesmo arquivo novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFolderChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      toast.info("Nenhum arquivo selecionado na pasta.");
      return;
    }

    const songsToProcess: { title: string; originalContent: string; extractedChords: string; }[] = [];
    let processedCount = 0;
    let failedCount = 0;

    const processingToastId = toast.loading(`Processando ${files.length} arquivos da pasta...`);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.name.toLowerCase().endsWith('.txt') || file.type === 'text/plain') {
        try {
          const fileContent = await file.text();
          const title = extractSongTitle(fileContent) || file.name.replace(/\.txt$/, '').trim();
          const extractedChords = extrairCifras(fileContent);

          songsToProcess.push({
            title: title,
            originalContent: fileContent,
            extractedChords: extractedChords,
          });
          processedCount++;
        } catch (error) {
          console.error(`Erro ao ler ou processar o arquivo ${file.name}:`, error);
          failedCount++;
        }
      } else {
        console.warn(`Arquivo ignorado (não é .txt): ${file.name}`);
        failedCount++;
      }
    }

    toast.dismiss(processingToastId);

    if (songsToProcess.length > 0) {
      try {
        await onImportFolder(songsToProcess);
        toast.success(`Importação da pasta concluída. ${songsToProcess.length} músicas importadas.`);
      } catch (error) {
        toast.error("Falha na importação em lote da pasta.");
        console.error("Erro ao importar pasta:", error);
      }
    } else {
      toast.info("Nenhuma música válida encontrada na pasta para importação.");
    }

    if (failedCount > 0) {
      toast.warning(`${failedCount} arquivos foram ignorados (não eram .txt ou houve erro de leitura).`);
    }

    // Limpar o valor do input para permitir o upload da mesma pasta novamente
    if (folderInputRef.current) {
      folderInputRef.current.value = '';
    }
  };

  return (
    <>
      <Card className="flex-1 flex flex-col shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Entrada de Música</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 p-4">
          <div className="flex flex-wrap gap-2 mb-4 items-center">
            <label htmlFor="inputMusica" className="font-semibold text-lg">Conteúdo Original</label>
            <Button onClick={onClear} variant="destructive" className="ml-auto">Limpar</Button>
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
            <Button onClick={handleFileImportClick} variant="outline">
              <Upload className="mr-2 h-4 w-4" /> Importar Arquivo
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".txt" // Aceitar apenas arquivos de texto
            />
            <Button onClick={handleFolderImportClick} variant="outline"> {/* Novo botão */}
              <FolderOpen className="mr-2 h-4 w-4" /> Importar Pasta
            </Button>
            <input
              type="file"
              ref={folderInputRef}
              onChange={handleFolderChange}
              className="hidden"
              // @ts-ignore
              webkitdirectory="" // Atributo para selecionar pasta
              directory="" // Atributo para selecionar pasta (compatibilidade)
              multiple // Permitir múltiplos arquivos dentro da pasta
              accept=".txt" // Aceitar apenas arquivos de texto
            />
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