"use client";

import { MadeWithDyad } from "@/components/made-with-dyad";
import ChordRecognizer from "./ChordRecognizer"; // Import the new component

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <ChordRecognizer />
      <MadeWithDyad />
    </div>
  );
};

export default Index;