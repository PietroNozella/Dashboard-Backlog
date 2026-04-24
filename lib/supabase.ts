import { createBrowserClient } from "@supabase/ssr";

// Cliente Supabase para uso no browser (Client Components)
// Reaproveitado em listeners do Realtime e em componentes interativos
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
