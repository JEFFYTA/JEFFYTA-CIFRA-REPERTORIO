import { defineConfig, loadEnv } from "vite"; // Importar loadEnv
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => { // Receber 'mode' para carregar variáveis de ambiente
  const env = loadEnv(mode, process.cwd(), 'VITE_'); // Carregar variáveis de ambiente com prefixo VITE_

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [dyadComponentTagger(), react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      // Expor variáveis de ambiente para o código do cliente
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
    },
  };
});