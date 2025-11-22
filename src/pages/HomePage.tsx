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
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4 bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-lg p-6 shadow-lg text-center">
        <CardHeader>
          <CardTitle className="text-3xl font-bold mb-6">Escolha uma opção</CardTitle>
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
            className="w-full h-12 text-lg mt-6"
          >
            <LogOut className="mr-3 h-5 w-5" /> Sair
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default HomePage;