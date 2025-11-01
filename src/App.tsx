import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ChordRecognizer from "./pages/ChordRecognizer";
import NotFound from "./pages/NotFound";
import { Toaster } from "@/components/ui/sonner";
// Removendo a importação incorreta de SessionContextProvider
import { supabase } from "@/integrations/supabase/client";

const App = () => (
  <Router>
    {/* Removendo o uso incorreto de SessionContextProvider */}
    <Routes>
      <Route path="/" element={<ChordRecognizer />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    <Toaster />
  </Router>
);

export default App;