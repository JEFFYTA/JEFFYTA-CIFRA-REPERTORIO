"use client";

import { MadeWithDyad } from "@/components/made-with-dyad";
// import ChordRecognizer from "./ChordRecognizer"; // Temporariamente removido para depuração

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-100">
      <h1 className="text-4xl font-bold">Olá Dyad!</h1>
      <p className="mt-4 text-lg">Se você vir isso, o aplicativo está funcionando!</p>
      <MadeWithDyad />
    </div>
  );
};

export default Index;