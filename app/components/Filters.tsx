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

export type SortKey = "request_date_desc" | "request_date_asc" | "priority";

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

export function Filters(props: FiltersProps) {
  return (
    <section className="rounded-[1.75rem] border border-border/80 bg-card/80 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-sm lg:p-5 xl:p-6">
      <div className="mb-4 xl:mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/85">
          Filtros
        </p>
        <h2 className="mt-1 text-sm text-muted-foreground">
          Refine a leitura do backlog sem sair da tela principal.
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-12 xl:gap-4">
        <div className="relative xl:col-span-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por solicitante ou tarefa..."
            value={props.search}
            onChange={(e) => props.onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={props.status}
          onValueChange={(value) =>
            props.onStatusChange(value as TaskStatus | typeof ALL)
          }
        >
          <SelectTrigger className="xl:col-span-2">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos os status</SelectItem>
            {TASK_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={props.assignee}
          onValueChange={(value) =>
            props.onAssigneeChange(value as TaskAssignee | typeof ALL)
          }
        >
          <SelectTrigger className="xl:col-span-2">
            <SelectValue placeholder={"Respons\u00e1vel"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{"Todos respons\u00e1veis"}</SelectItem>
            {TASK_ASSIGNEES.map((assignee) => (
              <SelectItem key={assignee} value={assignee}>
                {assignee}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={props.priority}
          onValueChange={(value) =>
            props.onPriorityChange(value as TaskPriority | typeof ALL)
          }
        >
          <SelectTrigger className="xl:col-span-2">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas prioridades</SelectItem>
            {TASK_PRIORITIES.map((priority) => (
              <SelectItem key={priority} value={priority}>
                {priority}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={props.sort}
          onValueChange={(value) => props.onSortChange(value as SortKey)}
        >
          <SelectTrigger className="xl:col-span-2">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="request_date_desc">Mais recentes</SelectItem>
            <SelectItem value="request_date_asc">Mais antigas</SelectItem>
            <SelectItem value="priority">{"Prioridade (Alta \u2192 Baixa)"}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </section>
  );
}
