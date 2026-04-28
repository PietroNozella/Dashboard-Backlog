"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase-server";
import type { TaskInput } from "@/types/task";

interface UploadedAttachment {
  url: string;
  name: string;
}

// =====================================================================
// Server Actions de CRUD para a tabela `tasks`
// =====================================================================

// Garante que strings vazias virem null no banco
function normalize(input: TaskInput): TaskInput {
  return {
    ...input,
    description: input.description?.trim() || null,
    notes: input.notes?.trim() || null,
    start_date: input.start_date || null,
    completion_date: input.completion_date || null,
    attachment_url: input.attachment_url || null,
    attachment_name: input.attachment_name?.trim() || null,
  };
}

// ---------------------------------------------------------------------
// UPLOAD - recebe FormData com o arquivo PDF e devolve URL + nome original
// Chamada separada do create/update para manter as actions coesas
// ---------------------------------------------------------------------
export async function uploadAttachment(
  formData: FormData,
): Promise<UploadedAttachment> {
  const supabase = await createClient();
  const file = formData.get("file") as File;

  if (!file || file.size === 0) throw new Error("Nenhum arquivo recebido.");
  if (file.type !== "application/pdf") throw new Error("Apenas PDFs são aceitos.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Tamanho máximo: 10 MB.");

  // Nome unico para evitar colisao de arquivos no bucket
  const ext = "pdf";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from("task-attachments")
    .upload(filename, file, { contentType: "application/pdf", upsert: false });

  if (error) throw new Error(`Erro no upload: ${error.message}`);

  // Monta a URL publica do objeto recem-enviado
  const { data } = supabase.storage
    .from("task-attachments")
    .getPublicUrl(filename);

  return {
    url: data.publicUrl,
    name: file.name,
  };
}

// ---------------------------------------------------------------------
// DELETE do arquivo anterior no Storage (chamado antes de trocar o PDF)
// ---------------------------------------------------------------------
export async function deleteAttachment(url: string): Promise<void> {
  const supabase = await createClient();

  // Extrai o nome do arquivo a partir da URL publica
  const filename = url.split("/task-attachments/").at(-1);
  if (!filename) return;

  await supabase.storage.from("task-attachments").remove([filename]);
}

// ---------------------------------------------------------------------
// CREATE
// ---------------------------------------------------------------------
export async function createTask(input: TaskInput) {
  const supabase = await createClient();

  const { error } = await supabase.from("tasks").insert(normalize(input));

  if (error) throw new Error(`Erro ao criar tarefa: ${error.message}`);

  revalidatePath("/");
}

// ---------------------------------------------------------------------
// UPDATE
// ---------------------------------------------------------------------
export async function updateTask(id: string, input: TaskInput) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("tasks")
    .update(normalize(input))
    .eq("id", id);

  if (error) throw new Error(`Erro ao atualizar tarefa: ${error.message}`);

  revalidatePath("/");
}

// ---------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------
export async function deleteTask(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("tasks").delete().eq("id", id);

  if (error) throw new Error(`Erro ao deletar tarefa: ${error.message}`);

  revalidatePath("/");
}
