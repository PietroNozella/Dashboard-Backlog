"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

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
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-border/70 bg-[linear-gradient(135deg,rgba(8,22,36,0.92),rgba(18,42,39,0.88))] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.28)]">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <span className="inline-flex w-fit items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/90">
              Painel operacional
            </span>

            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                Backlog de Tarefas
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Visualize demandas por cliente com leitura mais clara para
                priorização, andamento e alinhamento entre times.
              </p>
            </div>
          </div>

          <Button onClick={handleNewTask} className="min-w-[160px]">
            <Plus className="mr-2 h-4 w-4" />
            Nova tarefa
          </Button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-background/35 px-4 py-3 backdrop-blur-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Visíveis
            </p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {visibleTasks.length}
            </p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-background/35 px-4 py-3 backdrop-blur-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Total
            </p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {tasks.length}
            </p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-background/35 px-4 py-3 backdrop-blur-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Organização
            </p>
            <p className="mt-1 text-sm text-foreground">
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

      {visibleTaskGroups.length === 0 ? (
        <TaskTable tasks={visibleTasks} onRowClick={handleEditTask} />
      ) : (
        <div className="space-y-4">
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
                className="overflow-hidden rounded-[1.75rem] border border-border/80 bg-card/80 shadow-[0_20px_60px_rgba(0,0,0,0.2)] backdrop-blur-sm"
              >
                <div className="flex flex-col gap-3 border-b border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/85">
                      Cliente
                    </p>
                    <h2 className="text-lg font-semibold text-foreground">
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
                  <div className="flex items-center justify-between gap-3 border-t border-border/70 bg-background/35 px-5 py-3">
                    <p className="text-xs text-muted-foreground">
                      Mostrando {pageStart + 1}-
                      {Math.min(pageStart + PAGE_SIZE, group.tasks.length)} de{" "}
                      {group.tasks.length}
                    </p>

                    <div className="flex items-center gap-2">
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
                        Página {currentPage} de {totalPages}
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
                        Próxima
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
