# AI Context & Architecture Reference

Este arquivo fornece uma visão geral da arquitetura, do fluxo de dados e das convenções de design deste projeto. Ele serve de guia rápido para agentes de IA e desenvolvedores entenderem o sistema instantaneamente sem precisar fazer varreduras demoradas.

---

## 🛠️ Stack Tecnológica
* **Framework Principal**: [TanStack Start](https://tanstack.com/router/latest/docs/start/overview) (Server-side rendering e roteamento integrado construído sobre Vite).
* **Banco de Dados & Autenticação**: [Supabase](https://supabase.com/) com RLS (Row Level Security) ativado e persistência de sessão por cookies via `@supabase/ssr`.
* **Estilização**: Tailwind CSS v4 com diretivas inline e customizações integradas em `src/styles.css`.
* **Formulários**: `@tanstack/react-form` para validação e submissão tipada.
* **Gerenciamento de Estado**: `@tanstack/react-query` para cache e mutações.
* **Formatação & Linting**: Biome.
* **Runtime / Gerenciador**: Bun.

---

## 📁 Estrutura de Pastas Chave
* `src/routes/`: Roteamento baseado em arquivos (TanStack Router).
  - `_authenticated.tsx`: Layout base autenticado com menu e travamento de altura global (`h-screen overflow-hidden`).
  - `_authenticated/transactions/`: Rota principal de Lançamentos.
  - `_authenticated/accounts/`: Rota de Gerenciamento de Contas.
* `src/features/`: Componentes modulares, hooks e serviços divididos por domínio:
  - `features/transactions/`: Lançamentos (tabelas, listagem, formulários, hooks e lógica de totais).
  - `features/accounts/`: Estrutura de Contas/Pastas (seletor de conta, criação de hierarquias, árvore de contas).
* `src/integrations/supabase/`: Configuração do cliente Supabase e tipos gerados automaticamente (`database.types.ts`).

---

## 🗄️ Modelo de Dados (Supabase)
### 1. `transaction_groups` (Contas)
Representa a carteira, banco ou pasta de despesas/receitas:
* `id` (UUID, Primary Key)
* `name` (TEXT)
* `transaction_type` ('entrada' | 'saida')
* `parent_id` (UUID, Foreign Key para si mesma): Define o relacionamento **Pai-Filho** das contas (ex: `COMPRAS` -> `CARTÃO DE CRÉDITO`).
* `user_id` (UUID, Foreign Key)

### 2. `transactions` (Lançamentos)
* `id` (UUID)
* `title` (TEXT)
* `amount` (NUMERIC)
* `amount_paid` (NUMERIC)
* `is_paid` (BOOLEAN)
* `payment_date` (DATE string `yyyy-MM-dd`)
* `transaction_type` ('entrada' | 'saida')
* `group_id` (UUID, Foreign Key para `transaction_groups`)
* `notes` (TEXT, opcional)
* **Importante**: O campo de categorias foi **completamente removido** do banco de dados, da UI e dos tipos de dados.

---

## 📐 Regras de UX e Layout (Imutáveis)

### 1. Travamento de Tela (Sem Rolagem de Página)
* **Regra**: O aplicativo **nunca** deve possuir scroll na página inteira (o scroll do navegador na lateral direita). A tela está travada na altura da viewport (`h-screen overflow-hidden`).
* **Implementação**: Altura fixa de 100% no layout base (`_authenticated.tsx`). O overflow e a rolagem vertical ocorrem **exclusivamente dentro das listas internas de dados** (tabelas de transações e lista de contas cadastradas) usando `flex-1 overflow-y-auto`.

### 2. Hierarquia e Agrupamento de Lançamentos
* **Regra**: Na visualização de lista de lançamentos, por padrão, os dados são exibidos **agrupados de forma hierárquica por Contas**.
* **Visualização Agrupada (`isGrouped = true`)**:
  - Exibe a **Conta Principal** com o valor total acumulado (soma do direto + subcontas).
  - Permite abrir/fechar o acordeão.
  - Subcontas e transações diretas aparecem com recuo visual (`↳` e recuo de margem).
  - Linhas filhas são renderizadas com fonte menor e layout mais fino.
* **Visualização Plana (`isGrouped = false`)**:
  - Exibe todos os lançamentos sem agrupamento, ordenados estritamente por data.
  - O botão de toggle de visualização na barra superior (ícone `FolderTree`) alterna esse comportamento.

### 3. Evitar Inconsistência de Pagamento
* **Regra**: Uma transação nunca deve ter `is_paid = false` se o valor pago (`amount_paid`) for igual ou maior que o valor total (`amount`).
* **Sincronização no Formulário**: O componente `TransactionForm.tsx` valida na submissão e força `is_paid = true` caso `amount_paid >= amount`.

### 4. Destaque Visual de Atrasos (Overdue)
* **Regra**: A seção isolada "Contas em Atraso" foi removida. O atraso é indicado de forma integrada.
* **Implementação**: Se o lançamento estiver pendente (`is_paid = false`) e a data de pagamento for anterior à data de hoje, a linha do lançamento é destacada com fundo amarelo claro suave nas tabelas principais.

### 5. Barras de Rolagem Customizadas (Scrollbars)
* **Estilo**: As barras de rolagem padrão do sistema são sobrescritas em navegadores WebKit para manter um visual limpo e uniforme via `@apply h-2 w-2 appearance-none` no polegar (`thumb`) e fundo transparente.

---

## 🔄 Comandos Comuns
* Gerar tipos do banco: `bun run gentypes`
* Validar TypeScript: `bun x tsc --noEmit`
* Compilar produção: `bun run build`
