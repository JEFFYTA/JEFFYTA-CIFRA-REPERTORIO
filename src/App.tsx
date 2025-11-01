import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ChordRecognizer from "./pages/ChordRecognizer";
import NotFound from "./pages/NotFound";
import { Toaster } from "@/components/ui/sonner";
import { SessionContextProvider } from '@supabase/auth-ui-react';
import { supabase } from "@/integrations/supabase/client";

const App = () => (
  <Router>
    <SessionContextProvider supabaseClient={supabase}>
      <Routes>
        <Route path="/" element={<ChordRecognizer />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </SessionContextProvider>
  </Router>
);

export default App;