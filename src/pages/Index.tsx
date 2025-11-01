"use client";

import { MadeWithDyad } from "@/components/made-with-dyad";
// O ChordRecognizer agora será renderizado via roteamento em App.tsx

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
      <h1 className="text-4xl font-bold">Bem-vindo!</h1>
      <p className="mt-4 text-lg">Navegue para a funcionalidade principal.</p>
      <MadeWithDyad />
    </div>
  );
};

export default Index;