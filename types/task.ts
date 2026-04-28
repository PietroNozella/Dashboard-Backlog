// Tipos do dominio "Task" - espelham os ENUMs e colunas da tabela no Supabase

export type TaskStatus = "Pendente" | "Em Andamento" | "Concluído" | "Cancelado";
export type TaskPriority = "Alta" | "Média" | "Baixa";
export type TaskAssignee = "Dev" | "Comercial";

// Listas para popular dropdowns e filtros sem repetir os literais
export const TASK_STATUSES: TaskStatus[] = [
  "Pendente",
  "Em Andamento",
  "Concluído",
  "Cancelado",
];

export const TASK_PRIORITIES: TaskPriority[] = ["Alta", "Média", "Baixa"];

export const TASK_ASSIGNEES: TaskAssignee[] = ["Dev", "Comercial"];

// Formato exato como vem do banco (snake_case nas datas/auditoria)
export interface Task {
  id: string;
  status: TaskStatus;
  priority: TaskPriority;
  requester: string;
  request_date: string; // ISO date (yyyy-mm-dd)
  title: string;
  description: string | null;
  assignee: TaskAssignee;
  start_date: string | null;
  completion_date: string | null;
  notes: string | null;
  attachment_url: string | null; // URL publica do PDF no Supabase Storage
  attachment_name: string | null; // Nome original do PDF para exibicao
  created_at: string;
  updated_at: string;
}

// Payload usado para criar/editar (subset editavel da tabela)
export interface TaskInput {
  status: TaskStatus;
  priority: TaskPriority;
  requester: string;
  request_date: string;
  title: string;
  description: string | null;
  assignee: TaskAssignee;
  start_date: string | null;
  completion_date: string | null;
  notes: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
}
