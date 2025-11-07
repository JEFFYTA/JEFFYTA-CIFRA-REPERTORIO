"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CustomLoginFormProps {
  onSignIn: () => void;
}

const CustomLoginForm: React.FC<CustomLoginFormProps> = ({ onSignIn }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [isSigningUp, setIsSigningUp] = useState<boolean>(false);

  // Carregar e-mail salvo do localStorage ao montar o componente
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true); // Assume que "Lembrar-me" estava marcado se o e-mail foi salvo
    }
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningIn(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error("Erro ao fazer login: " + error.message);
      console.error("Erro ao fazer login:", error);
    } else {
      toast.success("Login realizado com sucesso!");
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      onSignIn();
    }
    setIsSigningIn(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningUp(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      toast.error("Erro ao registrar: " + error.message);
      console.error("Erro ao registrar:", error);
    } else {
      toast.success("Registro realizado com sucesso! Verifique seu e-mail para confirmar.");
    }
    setIsSigningUp(false);
  };

  const handleRememberMeChange = (checked: boolean) => {
    setRememberMe(checked);
    if (!checked) {
      localStorage.removeItem('rememberedEmail'); // Limpar e-mail se o usuário desmarcar "Lembrar-me"
    }
  };

  return (
    <Card className="w-full max-w-md p-6 shadow-lg">
      <CardHeader className="flex flex-col items-center">
        <img 
          src="/butterfly-logo.jpg" // Caminho atualizado para .jpg
          alt="Logo Borboleta" 
          className="w-24 h-24 object-contain mb-4"
        />
        <CardTitle className="text-3xl font-bold text-center mb-6">Bem-vindo ao Cifra Fácil!</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember-me"
              checked={rememberMe}
              onCheckedChange={handleRememberMeChange}
            />
            <Label htmlFor="remember-me">Lembrar-me</Label>
          </div>
          <Button type="submit" className="w-full" disabled={isSigningIn}>
            {isSigningIn ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          Não tem uma conta?{' '}
          <Button variant="link" onClick={handleSignUp} disabled={isSigningUp}>
            {isSigningUp ? 'Registrando...' : 'Registrar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomLoginForm;