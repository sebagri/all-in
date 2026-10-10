import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // chiamato da un Server Component: il middleware aggiorna la sessione
          }
        },
      },
    },
  );
}

export type Ruolo = "titolare" | "ufficio" | "operaio";

export async function utenteCorrente() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profilo } = await supabase.from("profili").select("nome, ruolo").eq("id", user.id).single();
  return { id: user.id, email: user.email, nome: profilo?.nome ?? "", ruolo: (profilo?.ruolo ?? "operaio") as Ruolo };
}
