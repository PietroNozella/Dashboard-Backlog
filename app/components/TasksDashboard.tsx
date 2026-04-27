"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase";
import type { Task } from "@/types/task";

import { ALL, Filters, type SortKey } from "./Filters";
import { TaskModal } from "./TaskModal";
import { TaskTable } from "./TaskTable";
import { groupTasksByClient, priorityWeight } from "./helpers";

interface TasksDashboardProps {
  initialTasks: Task[];
}

// Container principal do dashboard
// Mantém estado local (filtros, busca, modal) e sincroniza com Realtime
export function TasksDashboard({ initialTasks }: TasksDashboardProps) {
  // Lista de tarefas — começa do server e é atualizada via Realtime
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  // Estado dos filtros
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<typeof ALL | Task["status"]>(
    ALL,
  );
  const [assigneeFilter, setAssigneeFilter] = useState<
    typeof ALL | Task["assignee"]
  >(ALL);
  const [priorityFilter, setPriorityFilter] = useState<
    typeof ALL | Task["priority"]
  >(ALL);
  const [sort, setSort] = useState<SortKey>("request_date_desc");

  // Estado do modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Sincroniza props quando o server revalidar (ex.: depois de uma Server Action)
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  // ------------------------------------------------------------------
  // Supabase Realtime: aplica INSERT/UPDATE/DELETE no estado local
  // ------------------------------------------------------------------
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("tasks-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newTask = payload.new as Task;
            // Evita duplicar se a Server Action já adicionou via revalidate
            setTasks((prev) =>
              prev.some((t) => t.id === newTask.id) ? prev : [newTask, ...prev],
            );
          }

          if (payload.eventType === "UPDATE") {
            const updated = payload.new as Task;
            setTasks((prev) =>
              prev.map((t) => (t.id === updated.id ? updated : t)),
            );
          }

          if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as { id: string }).id;
            setTasks((prev) => prev.filter((t) => t.id !== deletedId));
          }
        },
      )
      .subscribe();

    // Cleanup — desinscreve o canal ao desmontar
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ------------------------------------------------------------------
  // Filtragem + busca + ordenação (memoizado para evitar reprocessamento)
  // ------------------------------------------------------------------
  const visibleTasks = useMemo(() => {
    const term = search.trim().toLowerCase();

    const filtered = tasks.filter((t) => {
      if (statusFilter !== ALL && t.status !== statusFilter) return false;
      if (assigneeFilter !== ALL && t.assignee !== assigneeFilter) return false;
      if (priorityFilter !== ALL && t.priority !== priorityFilter) return false;

      if (term) {
        const haystack = `${t.requester} ${t.title}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }

      return true;
    });

    // Ordenação
    const sorted = [...filtered];
    if (sort === "request_date_desc") {
      sorted.sort((a, b) => b.request_date.localeCompare(a.request_date));
    } else if (sort === "request_date_asc") {
      sorted.sort((a, b) => a.request_date.localeCompare(b.request_date));
    } else if (sort === "priority") {
      sorted.sort(
        (a, b) => priorityWeight(a.priority) - priorityWeight(b.priority),
      );
    }

    return sorted;
  }, [tasks, search, statusFilter, assigneeFilter, priorityFilter, sort]);

  const visibleTaskGroups = useMemo(
    () => groupTasksByClient(visibleTasks),
    [visibleTasks],
  );

  // Abre modal em modo "criar"
  function handleNewTask() {
    setEditingTask(null);
    setModalOpen(true);
  }

  // Abre modal em modo "editar"
  function handleEditTask(task: Task) {
    setEditingTask(task);
    setModalOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Header com título e botão de criar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Backlog de Tarefas
          </h1>
          <p className="text-sm text-muted-foreground">
            {visibleTasks.length} de {tasks.length}{" "}
            {tasks.length === 1 ? "tarefa" : "tarefas"}
          </p>
          <p className="text-sm text-muted-foreground">
            Organizado em caixas por cliente para evitar mistura entre contas.
          </p>
        </div>

        <Button onClick={handleNewTask}>
          <Plus className="mr-2 h-4 w-4" />
          Nova tarefa
        </Button>
      </div>

      {/* Barra de filtros */}
      <Filters
        search={search}
        status={statusFilter}
        assignee={assigneeFilter}
        priority={priorityFilter}
        sort={sort}
        onSearchChange={setSearch}
        onStatusChange={setStatusFilter}
        onAssigneeChange={setAssigneeFilter}
        onPriorityChange={setPriorityFilter}
        onSortChange={setSort}
      />

      {/* Tarefas agrupadas por cliente */}
      {visibleTaskGroups.length === 0 ? (
        <TaskTable tasks={visibleTasks} onRowClick={handleEditTask} />
      ) : (
        <div className="space-y-4">
          {visibleTaskGroups.map((group) => (
            <section
              key={group.client}
              className="overflow-hidden rounded-2xl border bg-card shadow-sm"
            >
              <div className="flex flex-col gap-2 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold">{group.client}</h2>
                  <p className="text-sm text-muted-foreground">
                    Caixa de backlog desse cliente
                  </p>
                </div>
                <span className="inline-flex w-fit items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                  {group.tasks.length}{" "}
                  {group.tasks.length === 1 ? "tarefa" : "tarefas"}
                </span>
              </div>
              <TaskTable
                tasks={group.tasks}
                onRowClick={handleEditTask}
                variant="embedded"
              />
            </section>
          ))}
        </div>
      )}

      {/* Modal de criar/editar */}
      <TaskModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        task={editingTask}
      />
    </div>
  );
}
