"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, ListMusic, Guitar, LogOut } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const HomePage: React.FC = () => {
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erro ao sair: " + error.message);
      console.error("Erro ao sair:", error);
    } else {
      toast.success("Você foi desconectado.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 p-4
                    bg-gradient-to-br from-purple-50 to-blue-50
                    dark:from-gray-900 dark:to-gray-950">
      <div className="text-center mb-8">
        {/* <h2 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100 mb-2">
          Olá! O que vamos tocar hoje?
        </h2> */}
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Escolha uma opção para começar a gerenciar suas cifras e repertórios.
        </p>
      </div>
      <Card className="w-full max-w-lg p-6 shadow-lg text-center bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-50">Escolha uma opção</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link to="/recognizer" className="w-full">
            <Button className="w-full h-16 text-lg bg-blue-600 hover:bg-blue-700 text-white">
              <Guitar className="mr-3 h-6 w-6" /> Reconhecedor de Cifras
            </Button>
          </Link>
          <Link to="/my-songs" className="w-full">
            <Button className="w-full h-16 text-lg bg-green-600 hover:bg-green-700 text-white">
              <Music className="mr-3 h-6 w-6" /> Minhas Músicas
            </Button>
          </Link>
          <Link to="/my-repertoires" className="w-full">
            <Button className="w-full h-16 text-lg bg-purple-600 hover:bg-purple-700 text-white">
              <ListMusic className="mr-3 h-6 w-6" /> Meus Repertórios
            </Button>
          </Link>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full h-12 text-lg mt-6 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <LogOut className="mr-3 h-5 w-5" /> Sair
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default HomePage;