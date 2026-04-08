export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export function getWarungLoginUrl() {
  if (!supabaseUrl) {
    return '';
  }

  return `${supabaseUrl}/functions/v1/warung-login`;
}

export function hasSupabaseEnv() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}
