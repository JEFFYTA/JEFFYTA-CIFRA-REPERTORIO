export interface Song {
  id: string;
  user_id: string; // Adicionado para RLS
  title: string;
  originalContent: string;
  extractedChords: string;
  created_at: string; // Adicionado para ordenação e persistência
}