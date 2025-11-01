import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ChordRecognizer from "./pages/ChordRecognizer";
import NotFound from "./pages/NotFound";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { SessionContextProvider } from '@supabase/auth-ui-react'; // Importando SessionContextProvider

const App = () => (
  <SessionContextProvider supabaseClient={supabase}> {/* Envolvendo o Router com SessionContextProvider */}
    <Router>
      <Routes>
        <Route path="/" element={<ChordRecognizer />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </Router>
  </SessionContextProvider>
);

export default App;