import { createClient } from "@/lib/supabase-server";
import type { Task } from "@/types/task";

import { TasksDashboard } from "./components/TasksDashboard";

// PÃ¡gina principal â€” Server Component
// Faz a primeira busca no servidor (SSR) e entrega para o client component
export default async function HomePage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("request_date", { ascending: false });

  // Em caso de erro de conexÃ£o/credenciais, mostra mensagem amigÃ¡vel
  if (error) {
    return (
      <main className="mx-auto w-full max-w-[1700px] px-4 py-10 sm:px-6 lg:px-8 xl:px-10 2xl:px-14 md:py-14">
        <div className="rounded-3xl border border-destructive/60 bg-destructive/10 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <h2 className="font-semibold text-destructive">
            Erro ao carregar tarefas
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Verifique se as variÃ¡veis de ambiente do Supabase estÃ£o configuradas
            e se o schema foi aplicado.
          </p>
        </div>
      </main>
    );
  }

  const tasks = (data ?? []) as Task[];

  return (
    <main className="mx-auto w-full max-w-[1700px] px-4 py-8 sm:px-6 lg:px-8 xl:px-10 2xl:px-14 md:py-12 xl:py-14">
      <TasksDashboard initialTasks={tasks} />
    </main>
  );
}
