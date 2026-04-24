# Dashboard de Backlog

Dashboard simples para gestão de tarefas entre Dev e Comercial. Stack: Next.js 14 (App Router), Supabase (Postgres + Realtime), Tailwind CSS e shadcn/ui.

## Funcionalidades

- Tabela de tarefas com Status, Prioridade, Solicitante, Datas, Responsável, Descrição e Observações
- Criar / editar / deletar via modal (clique na linha para editar)
- Filtros por status, responsável e prioridade
- Busca por solicitante ou título
- Ordenação por data ou prioridade
- Atualização em tempo real (Supabase Realtime)
- Cores visuais por prioridade (Alta = vermelho, Média = amarelo, Baixa = verde)
- Layout responsivo

## Estrutura

```
.
├── app/
│   ├── actions/tasks.ts         # Server Actions (create, update, delete)
│   ├── components/
│   │   ├── TasksDashboard.tsx   # Container principal (estado + Realtime)
│   │   ├── TaskTable.tsx        # Tabela
│   │   ├── TaskModal.tsx        # Modal criar/editar
│   │   ├── Filters.tsx          # Filtros e busca
│   │   └── helpers.ts           # Mapeamentos de variants/ordenação
│   ├── globals.css              # Tokens shadcn + Tailwind
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Server Component (SSR inicial)
├── components/ui/               # Componentes shadcn (Button, Dialog, etc.)
├── lib/
│   ├── supabase.ts              # Client browser
│   ├── supabase-server.ts       # Client server-side
│   └── utils.ts                 # cn() + formatDateBR()
├── supabase/schema.sql          # Schema completo do banco
├── types/task.ts                # Tipos do domínio
└── .env.example                 # Variáveis de ambiente
```

## Setup

### 1. Pré-requisitos

- Node.js 18.18+ (recomendado 20+)
- Conta no [Supabase](https://supabase.com)

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar Supabase

1. Crie um projeto novo em https://supabase.com.
2. No painel do projeto, vá em **SQL Editor** → **New query**.
3. Cole o conteúdo de `supabase/schema.sql` e execute. Isso cria:
   - ENUMs `task_status`, `task_priority`, `task_assignee`
   - Tabela `tasks` com índices e trigger de `updated_at`
   - Habilitação do Realtime na tabela
   - RLS com policies abertas (ajuste quando adicionar autenticação)

### 4. Variáveis de ambiente

Copie `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Pegue as credenciais em **Project Settings → API** no painel do Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...
```

### 5. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse http://localhost:3000.

## Build de produção

```bash
npm run build
npm run start
```

## Deploy na Vercel

1. Faça push para um repositório Git.
2. Importe o projeto em https://vercel.com.
3. Adicione as variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` em **Settings → Environment Variables**.
4. Deploy.

## Notas técnicas

- **Server Actions** fazem todas as mutações (`createTask`, `updateTask`, `deleteTask`) e chamam `revalidatePath("/")` para invalidar o cache do SSR.
- **Realtime** é assinado no `useEffect` do `TasksDashboard` e atualiza o estado local em qualquer mudança na tabela `tasks`. Como a Server Action já revalidou o SSR, há proteção contra duplicação no INSERT.
- **RLS** está aberto para a chave `anon`. Se este dashboard for exposto publicamente, restrinja com auth do Supabase.
- **Datas** são armazenadas como `date` (ISO `yyyy-mm-dd`) e formatadas para `dd/mm/yyyy` na UI via `formatDateBR()`.
- **Cores das prioridades** são definidas como variants do `Badge` em `components/ui/badge.tsx`.

## Próximos passos sugeridos

- Autenticação Supabase + RLS por usuário
- Logs de auditoria (quem mudou o quê)
- Anexos por tarefa (Supabase Storage)
- Notificações no navegador quando alguém criar/atualizar
