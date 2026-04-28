"use client";

import { Paperclip } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateBR } from "@/lib/utils";
import type { Task } from "@/types/task";

import { priorityToBadgeVariant, statusToBadgeVariant } from "./helpers";

interface TaskTableProps {
  tasks: Task[];
  onRowClick: (task: Task) => void;
  variant?: "default" | "embedded";
}

export function TaskTable({
  tasks,
  onRowClick,
  variant = "default",
}: TaskTableProps) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-border/80 bg-card/70 p-12 text-center shadow-[0_16px_40px_rgba(0,0,0,0.16)]">
        <p className="text-sm text-muted-foreground">
          Nenhuma tarefa encontrada. Crie a primeira tarefa para começar.
        </p>
      </div>
    );
  }

  const table = (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[120px]">Status</TableHead>
          <TableHead className="w-[100px]">Prioridade</TableHead>
          <TableHead>Solicitante</TableHead>
          <TableHead className="w-[120px]">Solicitação</TableHead>
          <TableHead>Tarefa</TableHead>
          <TableHead className="w-[110px]">Responsável</TableHead>
          <TableHead className="w-[110px]">Início</TableHead>
          <TableHead className="w-[110px]">Conclusão</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => (
          <TableRow
            key={task.id}
            onClick={() => onRowClick(task)}
            className="group cursor-pointer"
          >
            <TableCell>
              <Badge variant={statusToBadgeVariant(task.status)}>
                {task.status}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={priorityToBadgeVariant(task.priority)}>
                {task.priority}
              </Badge>
            </TableCell>
            <TableCell className="font-medium text-foreground">
              {task.requester}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDateBR(task.request_date)}
            </TableCell>
            <TableCell className="max-w-[300px]">
              <span className="flex items-center gap-1.5 truncate font-medium text-foreground transition-colors group-hover:text-primary-foreground">
                {task.title}
                {task.attachment_url && (
                  <span title="Tem anexo PDF">
                    <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </span>
                )}
              </span>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {task.assignee}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDateBR(task.start_date)}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDateBR(task.completion_date)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  if (variant === "embedded") {
    return table;
  }

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-border/80 bg-card/75 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
      {table}
    </div>
  );
}
