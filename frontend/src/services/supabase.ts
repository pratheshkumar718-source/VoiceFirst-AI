// Supabase Service Integration
// Allows direct read/write to Supabase when environment keys are supplied.

export const supabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL || '',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  isConfigured: Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY),
};

export const getSupabaseClient = async () => {
  if (!supabaseConfig.isConfigured) {
    return null;
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    return createClient(supabaseConfig.url, supabaseConfig.anonKey);
  } catch (err) {
    console.warn('Failed to load Supabase JS SDK:', err);
    return null;
  }
};

