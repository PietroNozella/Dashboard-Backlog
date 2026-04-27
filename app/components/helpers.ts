import type { Task, TaskPriority, TaskStatus } from "@/types/task";

// Mapeia prioridade → variant do Badge para evitar switches espalhados na UI
export function priorityToBadgeVariant(
  priority: TaskPriority,
): "priorityHigh" | "priorityMedium" | "priorityLow" {
  if (priority === "Alta") return "priorityHigh";
  if (priority === "Média") return "priorityMedium";
  return "priorityLow";
}

// Mapeia status → variant do Badge
export function statusToBadgeVariant(
  status: TaskStatus,
):
  | "statusPending"
  | "statusInProgress"
  | "statusDone"
  | "statusCanceled" {
  if (status === "Pendente") return "statusPending";
  if (status === "Em Andamento") return "statusInProgress";
  if (status === "Concluído") return "statusDone";
  return "statusCanceled";
}

// Peso numérico para manter tarefas concluídas sempre no fim
export function statusWeight(status: TaskStatus): number {
  if (status === "Concluído") return 1;
  return 0;
}

// Peso numérico para ordenação por prioridade (Alta primeiro)
export function priorityWeight(priority: TaskPriority): number {
  if (priority === "Alta") return 0;
  if (priority === "Média") return 1;
  return 2;
}

function toTitleCase(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

export function getClientFromRequester(requester: string): string {
  const match = requester.match(/\(([^)]+)\)\s*$/);

  if (!match) return "Sem cliente";

  return toTitleCase(match[1]);
}

export interface TaskClientGroup {
  client: string;
  tasks: Task[];
}

export function groupTasksByClient(tasks: Task[]): TaskClientGroup[] {
  const groups = new Map<string, Task[]>();

  for (const task of tasks) {
    const client = getClientFromRequester(task.requester);
    const current = groups.get(client) ?? [];
    current.push(task);
    groups.set(client, current);
  }

  return [...groups.entries()]
    .map(([client, groupedTasks]) => ({
      client,
      tasks: groupedTasks,
    }))
    .sort((a, b) => {
      if (a.client === "Sem cliente") return 1;
      if (b.client === "Sem cliente") return -1;

      return a.client.localeCompare(b.client, "pt-BR");
    });
}
