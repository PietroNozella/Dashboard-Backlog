"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase";
import type { Task } from "@/types/task";

import { ALL, Filters, type SortKey } from "./Filters";
import { TaskModal } from "./TaskModal";
import { TaskTable } from "./TaskTable";
import {
  groupTasksByClient,
  priorityWeight,
  statusWeight,
} from "./helpers";

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

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
                className="overflow-hidden rounded-2xl border bg-card shadow-sm"
              >
                <div className="flex flex-col gap-2 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-base font-semibold">{group.client}</h2>
                  </div>
                  <span className="inline-flex w-fit items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
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
                  <div className="flex items-center justify-between gap-3 border-t px-5 py-3">
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

                      <span className="text-xs text-muted-foreground">
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
