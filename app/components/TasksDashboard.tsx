"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase";
import type { Task } from "@/types/task";

import { ALL, Filters, type SortKey } from "./Filters";
import {
  groupTasksByClient,
  priorityWeight,
  statusWeight,
} from "./helpers";
import { TaskModal } from "./TaskModal";
import { TaskTable } from "./TaskTable";

interface TasksDashboardProps {
  initialTasks: Task[];
}

const PAGE_SIZE = 5;

export function TasksDashboard({ initialTasks }: TasksDashboardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
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
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [clientPages, setClientPages] = useState<Record<string, number>>({});

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

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
            setTasks((prev) =>
              prev.some((task) => task.id === newTask.id)
                ? prev
                : [newTask, ...prev],
            );
          }

          if (payload.eventType === "UPDATE") {
            const updatedTask = payload.new as Task;
            setTasks((prev) =>
              prev.map((task) =>
                task.id === updatedTask.id ? updatedTask : task,
              ),
            );
          }

          if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as { id: string }).id;
            setTasks((prev) => prev.filter((task) => task.id !== deletedId));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const visibleTasks = useMemo(() => {
    const term = search.trim().toLowerCase();

    const filtered = tasks.filter((task) => {
      if (statusFilter !== ALL && task.status !== statusFilter) return false;
      if (assigneeFilter !== ALL && task.assignee !== assigneeFilter) {
        return false;
      }
      if (priorityFilter !== ALL && task.priority !== priorityFilter) {
        return false;
      }

      if (term) {
        const haystack = `${task.requester} ${task.title}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }

      return true;
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      const statusDiff = statusWeight(a.status) - statusWeight(b.status);
      if (statusDiff !== 0) return statusDiff;

      if (sort === "request_date_desc") {
        return b.request_date.localeCompare(a.request_date);
      }

      if (sort === "request_date_asc") {
        return a.request_date.localeCompare(b.request_date);
      }

      if (sort === "priority") {
        return priorityWeight(a.priority) - priorityWeight(b.priority);
      }

      return 0;
    });

    return sorted;
  }, [tasks, search, statusFilter, assigneeFilter, priorityFilter, sort]);

  const flaggedTasks = useMemo(
    () => visibleTasks.filter((task) => task.flagged),
    [visibleTasks],
  );

  const visibleTaskGroups = useMemo(
    () => groupTasksByClient(visibleTasks),
    [visibleTasks],
  );

  function handleNewTask() {
    setEditingTask(null);
    setModalOpen(true);
  }

  function handleEditTask(task: Task) {
    setEditingTask(task);
    setModalOpen(true);
  }

  function setClientPage(client: string, page: number) {
    setClientPages((prev) => ({
      ...prev,
      [client]: page,
    }));
  }

  return (
    <div className="space-y-8 xl:space-y-10">
      <section className="overflow-hidden rounded-[2rem] border border-[rgba(44,90,60,0.55)] bg-[#122a1e] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.45)] lg:p-8 xl:p-10 2xl:p-12">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between xl:gap-10">
          <div className="space-y-3 xl:max-w-4xl">
            <span className="inline-flex w-fit items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/90">
              Painel operacional
            </span>

            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl xl:text-[2.75rem]">
                Backlog de Tarefas
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground xl:text-[15px] xl:leading-7">
                Visualize demandas por cliente com leitura mais clara para
                {"prioriza\u00e7\u00e3o, andamento e alinhamento entre times."}
              </p>
            </div>
          </div>

          <Button
            onClick={handleNewTask}
            className="min-w-[160px] self-start xl:min-w-[190px] xl:self-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova tarefa
          </Button>
        </div>

        <div className="mt-8 grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(0,1.4fr)] xl:gap-4">
          <div className="rounded-2xl border border-[rgba(44,90,60,0.4)] bg-[rgba(8,28,20,0.6)] px-4 py-4 xl:px-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/70">
              {"Vis\u00edveis"}
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground xl:text-[2rem]">
              {visibleTasks.length}
            </p>
          </div>

          <div className="rounded-2xl border border-[rgba(44,90,60,0.4)] bg-[rgba(8,28,20,0.6)] px-4 py-4 xl:px-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/70">
              Total
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground xl:text-[2rem]">
              {tasks.length}
            </p>
          </div>

          <div className="rounded-2xl border border-[rgba(44,90,60,0.4)] bg-[rgba(8,28,20,0.6)] px-4 py-4 xl:px-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/70">
              {"Organiza\u00e7\u00e3o"}
            </p>
            <p className="mt-2 max-w-xl text-sm leading-6 text-foreground">
              Caixas por cliente para evitar mistura entre contas.
            </p>
          </div>
        </div>
      </section>

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

      {flaggedTasks.length > 0 && (
        <section className="overflow-hidden rounded-[1.75rem] border border-amber-500/25 bg-card shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="flex flex-col gap-3 border-b border-amber-500/15 bg-[rgba(251,191,36,0.03)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between xl:px-6 xl:py-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-400/70">
                  Requer atenção
                </p>
                <h2 className="text-base font-semibold text-foreground xl:text-lg">
                  {flaggedTasks.length === 1
                    ? "1 tarefa marcada com aviso"
                    : `${flaggedTasks.length} tarefas marcadas com aviso`}
                </h2>
              </div>
            </div>
          </div>
          <TaskTable
            tasks={flaggedTasks}
            onRowClick={handleEditTask}
            variant="embedded"
          />
        </section>
      )}

      {visibleTaskGroups.length === 0 ? (
        <TaskTable tasks={visibleTasks} onRowClick={handleEditTask} />
      ) : (
        <div className="space-y-5 xl:space-y-6">
          {visibleTaskGroups.map((group) => {
            const totalPages = Math.max(
              1,
              Math.ceil(group.tasks.length / PAGE_SIZE),
            );
            const currentPage = Math.min(
              clientPages[group.client] ?? 1,
              totalPages,
            );
            const pageStart = (currentPage - 1) * PAGE_SIZE;
            const pageTasks = group.tasks.slice(
              pageStart,
              pageStart + PAGE_SIZE,
            );
            const hasPagination = group.tasks.length > PAGE_SIZE;

            return (
              <section
                key={group.client}
                className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-card shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
              >
                <div className="flex flex-col gap-3 border-b border-border/70 bg-[rgba(255,255,255,0.02)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between xl:px-6 xl:py-5">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/85">
                      Cliente
                    </p>
                    <h2 className="text-lg font-semibold text-foreground xl:text-xl">
                      {group.client}
                    </h2>
                  </div>

                  <span className="inline-flex w-fit items-center rounded-full border border-border/70 bg-background/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                    {group.tasks.length}{" "}
                    {group.tasks.length === 1 ? "tarefa" : "tarefas"}
                  </span>
                </div>

                <TaskTable
                  tasks={pageTasks}
                  onRowClick={handleEditTask}
                  variant="embedded"
                />

                {hasPagination && (
                  <div className="flex flex-col gap-3 border-t border-border/70 bg-muted/60 px-5 py-3 sm:flex-row sm:items-center sm:justify-between xl:px-6">
                    <p className="text-xs text-muted-foreground">
                      Mostrando {pageStart + 1}-
                      {Math.min(pageStart + PAGE_SIZE, group.tasks.length)} de{" "}
                      {group.tasks.length}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setClientPage(group.client, currentPage - 1)
                        }
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Anterior
                      </Button>

                      <span className="rounded-full border border-border/70 bg-background/60 px-3 py-1 text-xs text-muted-foreground">
                        {"P\u00e1gina "}{currentPage} de {totalPages}
                      </span>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setClientPage(group.client, currentPage + 1)
                        }
                        disabled={currentPage === totalPages}
                      >
                        {"Pr\u00f3xima"}
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      <TaskModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        task={editingTask}
      />
    </div>
  );
}
