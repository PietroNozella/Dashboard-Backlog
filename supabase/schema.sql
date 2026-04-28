-- =====================================================================
-- Schema do Dashboard de Backlog
-- Execute este arquivo inteiro no SQL Editor do Supabase.
-- =====================================================================

-- Extensao necessaria para gerar UUIDs
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------
-- ENUMs do dominio
-- Definem os valores validos para status, prioridade e responsavel.
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

  -- Nivel de prioridade (impacta a ordenacao visual)
  priority task_priority not null default 'Média',

  -- Quem solicitou (cliente ou stakeholder)
  requester text not null,

  -- Quando a solicitacao chegou
  request_date date not null default current_date,

  -- Titulo curto da tarefa
  title text not null,

  -- Descricao detalhada
  description text,

  -- Responsavel pela execucao (Dev ou Comercial)
  assignee task_assignee not null default 'Dev',

  -- Data em que o trabalho comecou de fato
  start_date date,

  -- Data de conclusao
  completion_date date,

  -- Observacoes livres (notas internas)
  notes text,

  -- Anexo PDF salvo no Storage
  attachment_url text,
  attachment_name text,

  -- Auditoria
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Indices auxiliares para acelerar filtros e ordenacoes comuns
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
-- Realtime: habilita notificacoes de INSERT/UPDATE/DELETE
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table public.tasks;

-- ---------------------------------------------------------------------
-- Row Level Security
-- Por enquanto liberamos tudo para a chave anon (uso interno).
-- Quando adicionar autenticacao, restrinja por auth.uid().
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
