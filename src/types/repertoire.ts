export interface Repertoire {
  id: string;
  user_id: string; // Adicionado para RLS
  name: string;
  songIds: string[]; // Array de IDs de músicas
  created_at: string; // Adicionado para ordenação e persistência
  updated_at: string; // Adicionado para timestamp de atualização
}