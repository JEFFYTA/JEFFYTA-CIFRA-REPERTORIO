import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rkfyjigmfujvsqzxajlu.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrZnlqaWdtZnVqdnNxenhhamx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMTM1OTksImV4cCI6MjA3NzU4OTU5OX0.xgRhojYCQa3YXBCJpRUO1MoiVuie2fG1wK3Q3LCMQ8Y';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const invokeBatchImportSongs = async (songs: { title: string; originalContent: string; extractedChords: string; }[]) => {
  const { data, error } = await supabase.functions.invoke('batch-import-songs', {
    body: { songs },
  });

  if (error) {
    throw new Error(error.message);
  }
  return data;
};