
import { createClient } from '@supabase/supabase-js';

// ==============================================================================
// ⚙️ CONFIGURAÇÃO DE SEGURANÇA
// ==============================================================================
// Apenas Variáveis de Ambiente são aceitas.
// Nunca commite chaves reais no código fonte.
// ==============================================================================

// Using 'as any' to avoid TypeScript error if 'vite-env.d.ts' is missing
const ENV_URL = (import.meta as any).env?.VITE_SUPABASE_URL;
const ENV_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

// Não logamos erro no console para evitar poluição visual, 
// a UI do App.tsx tratará a falta de configuração.
export const supabase = (ENV_URL && ENV_KEY) 
  ? createClient(ENV_URL, ENV_KEY) 
  : null;

export const isSupabaseConfigured = () => {
    return !!supabase;
};



