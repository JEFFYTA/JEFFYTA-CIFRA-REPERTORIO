import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ChordRecognizer from "./pages/ChordRecognizer";
import NotFound from "./pages/NotFound";
import { Toaster } from "@/components/ui/sonner"; // Importar o Toaster do sonner

const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<ChordRecognizer />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    <Toaster /> {/* Adicionar o Toaster aqui para que as notificações funcionem em todo o app */}
  </Router>
);

export default App;