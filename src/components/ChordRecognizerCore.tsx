"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Maximize2 } from 'lucide-react';

interface ChordRecognizerCoreProps {
  inputText: string;
  onInputTextChange: (text: string) => void;
  outputText: string;
  onOutputTextChange: (text: string) => void; // Prop para mudanças no outputText
  onTranspose: (delta: number) => void;
  onRestore: () => void;
  onClear: () => void;
  onSaveOutput: () => void;
  onOpenFullScreenViewer: () => void;
  onSignOut: () => void;
}

const ChordRecognizerCore: React.FC<ChordRecognizerCoreProps> = ({
  inputText,
  onInputTextChange,
  outputText,
  onOutputTextChange, // Usar o prop
  onTranspose,
  onRestore,
  onClear,
  onSaveOutput,
  onOpenFullScreenViewer,
  onSignOut,
}) => {
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
            <Button onClick={onSaveOutput} disabled={!outputText || outputText.trim() === ''} variant="outline">
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