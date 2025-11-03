import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { Toaster } from "sonner"; // Importar Toaster

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
    <Toaster richColors />
  </React.StrictMode>
);