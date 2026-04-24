"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TASK_ASSIGNEES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskAssignee,
  type TaskPriority,
  type TaskStatus,
} from "@/types/task";

// Tipo de ordenação suportada (espelhado em TasksDashboard)
export type SortKey = "request_date_desc" | "request_date_asc" | "priority";

// Valor "all" representa "sem filtro" — usado para evitar string vazia no Select
export const ALL = "all" as const;

interface FiltersProps {
  search: string;
  status: TaskStatus | typeof ALL;
  assignee: TaskAssignee | typeof ALL;
  priority: TaskPriority | typeof ALL;
  sort: SortKey;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: TaskStatus | typeof ALL) => void;
  onAssigneeChange: (value: TaskAssignee | typeof ALL) => void;
  onPriorityChange: (value: TaskPriority | typeof ALL) => void;
  onSortChange: (value: SortKey) => void;
}

// Barra de filtros + busca + ordenação
// Componente puramente "controlado": apenas dispara callbacks no parent
export function Filters(props: FiltersProps) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
      {/* Campo de busca por solicitante ou título */}
      <div className="relative lg:col-span-2">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por solicitante ou tarefa..."
          value={props.search}
          onChange={(e) => props.onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filtro de Status */}
      <Select
        value={props.status}
        onValueChange={(v) => props.onStatusChange(v as TaskStatus | typeof ALL)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos os status</SelectItem>
          {TASK_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Filtro de Responsável */}
      <Select
        value={props.assignee}
        onValueChange={(v) =>
          props.onAssigneeChange(v as TaskAssignee | typeof ALL)
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Responsável" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos responsáveis</SelectItem>
          {TASK_ASSIGNEES.map((a) => (
            <SelectItem key={a} value={a}>
              {a}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Filtro de Prioridade */}
      <Select
        value={props.priority}
        onValueChange={(v) =>
          props.onPriorityChange(v as TaskPriority | typeof ALL)
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Prioridade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todas prioridades</SelectItem>
          {TASK_PRIORITIES.map((p) => (
            <SelectItem key={p} value={p}>
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Ordenação */}
      <Select
        value={props.sort}
        onValueChange={(v) => props.onSortChange(v as SortKey)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Ordenar por" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="request_date_desc">Mais recentes</SelectItem>
          <SelectItem value="request_date_asc">Mais antigas</SelectItem>
          <SelectItem value="priority">Prioridade (Alta → Baixa)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
