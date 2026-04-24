import type { Metadata } from "next";
import "./globals.css";

// Metadados padrão exibidos na aba do navegador
export const metadata: Metadata = {
  title: "Dashboard de Backlog",
  description: "Gestão de tarefas entre Dev e Comercial",
};

// Layout root — envolve toda a aplicação
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-background antialiased">
        {children}
      </body>
    </html>
  );
}
