import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Helper padrão do shadcn: combina clsx + tailwind-merge
// Permite mesclar classes condicionais e resolver conflitos de Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formata uma data ISO (yyyy-mm-dd) no padrão brasileiro (dd/mm/yyyy)
// Retorna "—" quando o valor é nulo, evitando ifs espalhados na UI
export function formatDateBR(date: string | null | undefined): string {
  if (!date) return "—";
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}
