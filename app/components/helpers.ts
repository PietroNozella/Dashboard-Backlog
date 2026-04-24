import type { TaskPriority, TaskStatus } from "@/types/task";

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

// Peso numérico para ordenação por prioridade (Alta primeiro)
export function priorityWeight(priority: TaskPriority): number {
  if (priority === "Alta") return 0;
  if (priority === "Média") return 1;
  return 2;
}
