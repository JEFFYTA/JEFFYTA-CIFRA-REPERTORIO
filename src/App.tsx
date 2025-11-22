"use client";

import React, { useState, useEffect, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import ChordRecognizer from "./pages/ChordRecognizer";
import NotFound from "./pages/NotFound";
import HomePage from "./pages/HomePage"; // Nova página inicial
import MySongsPage from "./pages/MySongsPage"; // Nova página de músicas
import RepertoiresPage from "./pages/RepertoiresPage"; // Nova página de repertórios
import CustomLoginForm from "./components/CustomLoginForm";
import LoadingSpinner from "./components/LoadingSpinner"; // Componente de carregamento
import { supabase } from "./integrations/supabase/client";
import { Sparkles } from 'lucide-react';

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState<boolean>(true);
  const navigate = useNavigate(); // Usar useNavigate para redirecionamentos

  const getSession = useCallback(async () => {
    setLoadingSession(true);
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    setLoadingSession(false);
  }, []);

  useEffect(() => {
    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoadingSession(false);
      // Redirecionar para a home ou login com base no estado da sessão
      if (session && window.location.pathname === '/') {
        navigate('/'); // Redireciona para a HomePage se estiver logado e na raiz
      } else if (!session && window.location.pathname !== '/') {
        navigate('/'); // Redireciona para o login se deslogar e não estiver na raiz
      }
    });

    return () => subscription.unsubscribe();
  }, [getSession, navigate]);

  if (loadingSession) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-50">
      <header className="w-full p-4 bg-white dark:bg-gray-800 shadow-md flex items-center justify-center lg:justify-start">
        <img 
          src="/butterfly-logo.jpg" // Adicionado o logo da borboleta aqui
          alt="Logo Borboleta" 
          className="w-8 h-8 object-contain mr-2" // Ajuste o tamanho conforme necessário
        />
        <h1 className="text-2xl font-bold text-purple-600">CIFRA-REPERTORIO</h1>
      </header>
      <main className="flex-1 flex flex-col">
        <Routes>
          {session ? (
            <>
              <Route path="/" element={<HomePage />} />
              <Route path="/recognizer" element={<ChordRecognizer />} />
              <Route path="/my-songs" element={<MySongsPage />} />
              <Route path="/my-repertoires" element={<RepertoiresPage />} />
            </>
          ) : (
            <Route path="/" element={<CustomLoginForm onSignIn={getSession} />} />
          )}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
};

// Wrapper para usar useNavigate fora do componente App
const AppWrapper = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;