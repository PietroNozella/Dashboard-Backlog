"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { FileText, Trash2, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import {
  createTask,
  deleteAttachment,
  deleteTask,
  updateTask,
  uploadAttachment,
} from "@/app/actions/tasks";
import {
  TASK_ASSIGNEES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type Task,
  type TaskAssignee,
  type TaskInput,
  type TaskPriority,
  type TaskStatus,
} from "@/types/task";

interface TaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
}

function buildInitialState(task: Task | null): TaskInput {
  if (task) {
    return {
      status: task.status,
      priority: task.priority,
      requester: task.requester,
      request_date: task.request_date,
      title: task.title,
      description: task.description,
      assignee: task.assignee,
      start_date: task.start_date,
      completion_date: task.completion_date,
      notes: task.notes,
      attachment_url: task.attachment_url,
      attachment_name: task.attachment_name,
    };
  }

  return {
    status: "Pendente",
    priority: "Média",
    requester: "",
    request_date: new Date().toISOString().slice(0, 10),
    title: "",
    description: "",
    assignee: "Dev",
    start_date: "",
    completion_date: "",
    notes: "",
    attachment_url: null,
    attachment_name: null,
  };
}

export function TaskModal({ open, onOpenChange, task }: TaskModalProps) {
  const [form, setForm] = useState<TaskInput>(() => buildInitialState(task));
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setForm(buildInitialState(task));
      setError(null);
      setPendingFile(null);
    }
  }, [open, task]);

  const isEditing = task !== null;

  function updateField<K extends keyof TaskInput>(key: K, value: TaskInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Apenas arquivos PDF são aceitos.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Tamanho máximo: 10 MB.");
      return;
    }

    setError(null);
    setPendingFile(file);
  }

  async function handleRemoveAttachment() {
    if (pendingFile) {
      setPendingFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (form.attachment_url) {
      setIsUploading(true);
      try {
        await deleteAttachment(form.attachment_url);
        updateField("attachment_url", null);
        updateField("attachment_name", null);
      } catch {
        setError("Erro ao remover anexo.");
      } finally {
        setIsUploading(false);
      }
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.title.trim() || !form.requester.trim()) {
      setError("Solicitante e Tarefa são obrigatórios.");
      return;
    }

    startTransition(async () => {
      try {
        let attachmentUrl = form.attachment_url;
        let attachmentName = form.attachment_name;

        if (pendingFile) {
          setIsUploading(true);
          const fd = new FormData();
          fd.append("file", pendingFile);

          const uploadedAttachment = await uploadAttachment(fd);
          attachmentUrl = uploadedAttachment.url;
          attachmentName = uploadedAttachment.name;

          setIsUploading(false);
        }

        const finalInput: TaskInput = {
          ...form,
          attachment_url: attachmentUrl,
          attachment_name: attachmentName,
        };

        if (isEditing && task) {
          await updateTask(task.id, finalInput);
        } else {
          await createTask(finalInput);
        }

        onOpenChange(false);
      } catch (err) {
        setIsUploading(false);
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      }
    });
  }

  function handleDelete() {
    if (!task) return;
    if (!confirm("Tem certeza que deseja deletar esta tarefa?")) return;

    startTransition(async () => {
      try {
        if (task.attachment_url) await deleteAttachment(task.attachment_url);
        await deleteTask(task.id);
        onOpenChange(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      }
    });
  }

  const attachmentLabel =
    pendingFile?.name ??
    form.attachment_name ??
    (form.attachment_url
      ? decodeURIComponent(form.attachment_url.split("/").at(-1) ?? "anexo.pdf")
      : null);

  const hasAttachment = pendingFile !== null || form.attachment_url !== null;
  const busy = isPending || isUploading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar tarefa" : "Nova tarefa"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize os campos abaixo e salve as alterações."
              : "Preencha as informações da tarefa."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => updateField("status", v as TaskStatus)}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="priority">Prioridade</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => updateField("priority", v as TaskPriority)}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="assignee">Responsável</Label>
              <Select
                value={form.assignee}
                onValueChange={(v) => updateField("assignee", v as TaskAssignee)}
              >
                <SelectTrigger id="assignee">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_ASSIGNEES.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="requester">Solicitante *</Label>
              <Input
                id="requester"
                value={form.requester}
                onChange={(e) => updateField("requester", e.target.value)}
                placeholder="Ex.: Willian(altivuz)"
                required
              />
              <p className="text-xs text-muted-foreground">
                Use o formato Nome(cliente) para separar automaticamente as caixas
                por cliente.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="request_date">Data da Solicitação</Label>
              <Input
                id="request_date"
                type="date"
                value={form.request_date}
                onChange={(e) => updateField("request_date", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="title">Tarefa *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="Título curto da tarefa"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={form.description ?? ""}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Detalhes da tarefa..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="start_date">Data de Início</Label>
              <Input
                id="start_date"
                type="date"
                value={form.start_date ?? ""}
                onChange={(e) => updateField("start_date", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="completion_date">Data de Conclusão</Label>
              <Input
                id="completion_date"
                type="date"
                value={form.completion_date ?? ""}
                onChange={(e) => updateField("completion_date", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={form.notes ?? ""}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Notas internas..."
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Anexo (PDF)</Label>

            {hasAttachment ? (
              <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate text-sm">{attachmentLabel}</span>

                {form.attachment_url && !pendingFile && (
                  <a
                    href={form.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary underline-offset-2 hover:underline"
                  >
                    Abrir
                  </a>
                )}

                <button
                  type="button"
                  onClick={handleRemoveAttachment}
                  disabled={busy}
                  className="rounded p-0.5 text-muted-foreground hover:text-destructive disabled:opacity-50"
                  title="Remover anexo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
                className="flex w-full items-center gap-2 rounded-md border border-dashed px-3 py-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />
                Clique para selecionar um PDF (máx. 10 MB)
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            {isEditing && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={busy}
                className="sm:mr-auto"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Deletar
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
              Cancelar
            </Button>

            <Button type="submit" disabled={busy}>
              {isUploading
                ? "Enviando PDF..."
                : isPending
                  ? "Salvando..."
                  : isEditing
                    ? "Salvar"
                    : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
