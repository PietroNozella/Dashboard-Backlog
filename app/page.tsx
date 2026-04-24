import { createClient } from "@/lib/supabase-server";
import type { Task } from "@/types/task";

import { TasksDashboard } from "./components/TasksDashboard";

// Página principal — Server Component
// Faz a primeira busca no servidor (SSR) e entrega para o client component
export default async function HomePage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("request_date", { ascending: false });

  // Em caso de erro de conexão/credenciais, mostra mensagem amigável
  if (error) {
    return (
      <main className="container py-10">
        <div className="rounded-md border border-destructive bg-destructive/10 p-6">
          <h2 className="font-semibold text-destructive">
            Erro ao carregar tarefas
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Verifique se as variáveis de ambiente do Supabase estão configuradas
            e se o schema foi aplicado.
          </p>
        </div>
      </main>
    );
  }

  const tasks = (data ?? []) as Task[];

  return (
    <main className="container py-8">
      <TasksDashboard initialTasks={tasks} />
    </main>
  );
}
