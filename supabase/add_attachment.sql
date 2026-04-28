-- =====================================================================
-- Adiciona suporte a anexos PDF na tabela tasks
-- Execute no SQL Editor do Supabase
-- =====================================================================

-- Coluna que armazena a URL publica do PDF no Storage
alter table public.tasks
  add column if not exists attachment_url text;

-- Coluna que armazena o nome original do PDF para exibicao
alter table public.tasks
  add column if not exists attachment_name text;

-- =====================================================================
-- Bucket publico para armazenar os PDFs
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('task-attachments', 'task-attachments', true)
on conflict (id) do nothing;

-- Policy: leitura publica (qualquer um pode ver o PDF pelo link)
drop policy if exists "attachments_select" on storage.objects;
create policy "attachments_select"
  on storage.objects for select
  using (bucket_id = 'task-attachments');

-- Policy: upload liberado para anon (ajuste quando tiver auth)
drop policy if exists "attachments_insert" on storage.objects;
create policy "attachments_insert"
  on storage.objects for insert
  with check (bucket_id = 'task-attachments');

-- Policy: delete liberado para anon
drop policy if exists "attachments_delete" on storage.objects;
create policy "attachments_delete"
  on storage.objects for delete
  using (bucket_id = 'task-attachments');
