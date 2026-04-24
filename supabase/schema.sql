-- =====================================================================
-- Schema do Dashboard de Backlog
-- Execute este arquivo inteiro no SQL Editor do Supabase.
-- =====================================================================

-- Extensão necessária para gerar UUIDs
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------
-- ENUMs do domínio
-- Definem os valores válidos para status, prioridade e responsável.
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'task_status') then
    create type task_status as enum ('Pendente', 'Em Andamento', 'Concluído', 'Cancelado');
  end if;

  if not exists (select 1 from pg_type where typname = 'task_priority') then
    create type task_priority as enum ('Alta', 'Média', 'Baixa');
  end if;

  if not exists (select 1 from pg_type where typname = 'task_assignee') then
    create type task_assignee as enum ('Dev', 'Comercial');
  end if;
end$$;

-- ---------------------------------------------------------------------
-- Tabela principal: tasks
-- ---------------------------------------------------------------------
create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),

  -- Status atual da tarefa no fluxo de trabalho
  status task_status not null default 'Pendente',

  -- Nível de prioridade (impacta a ordenação visual)
  priority task_priority not null default 'Média',

  -- Quem solicitou (cliente ou stakeholder)
  requester text not null,

  -- Quando a solicitação chegou
  request_date date not null default current_date,

  -- Título curto da tarefa
  title text not null,

  -- Descrição detalhada
  description text,

  -- Responsável pela execução (Dev ou Comercial)
  assignee task_assignee not null default 'Dev',

  -- Data em que o trabalho começou de fato
  start_date date,

  -- Data de conclusão
  completion_date date,

  -- Observações livres (notas internas)
  notes text,

  -- Auditoria
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Índices auxiliares para acelerar filtros e ordenações comuns
-- ---------------------------------------------------------------------
create index if not exists idx_tasks_status on public.tasks (status);
create index if not exists idx_tasks_priority on public.tasks (priority);
create index if not exists idx_tasks_assignee on public.tasks (assignee);
create index if not exists idx_tasks_request_date on public.tasks (request_date desc);

-- ---------------------------------------------------------------------
-- Trigger para manter updated_at atualizado automaticamente
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_tasks_updated_at on public.tasks;
create trigger trg_tasks_updated_at
  before update on public.tasks
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------
-- Realtime: habilita notificações de INSERT/UPDATE/DELETE
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table public.tasks;

-- ---------------------------------------------------------------------
-- Row Level Security
-- Por enquanto liberamos tudo para a chave anon (uso interno).
-- Quando adicionar autenticação, restrinja por auth.uid().
-- ---------------------------------------------------------------------
alter table public.tasks enable row level security;

drop policy if exists "tasks_select_all" on public.tasks;
create policy "tasks_select_all"
  on public.tasks for select
  using (true);

drop policy if exists "tasks_insert_all" on public.tasks;
create policy "tasks_insert_all"
  on public.tasks for insert
  with check (true);

drop policy if exists "tasks_update_all" on public.tasks;
create policy "tasks_update_all"
  on public.tasks for update
  using (true) with check (true);

drop policy if exists "tasks_delete_all" on public.tasks;
create policy "tasks_delete_all"
  on public.tasks for delete
  using (true);
