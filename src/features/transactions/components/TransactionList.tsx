import { useAccounts } from "#/features/accounts/hooks/useAccounts";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  addMonths,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, FolderTree } from "lucide-react";
import * as React from "react";
import {
  useCreateManyTransactions,
  useDeleteTransaction,
  useDuplicateTransaction,
  useTransactions,
  useUpdateTransaction,
} from "../hooks/useTransactions";
import { TransactionCalendar } from "./TransactionCalendar";
import { TransactionDailyView } from "./TransactionDailyView";
import { TransactionFiltersForm } from "./TransactionFiltersForm";
import { TransactionListSummary } from "./TransactionListSummary";
import { TransactionTable } from "./TransactionTable";
import { TransactionTabs } from "./TransactionTabs";

function sortTransactions(a: any, b: any) {
  const dateA = a.payment_date || "";
  const dateB = b.payment_date || "";
  if (dateA !== dateB) return dateA.localeCompare(dateB);
  return (a.title || "").localeCompare(b.title || "");
}

export function TransactionList({
  showFilters = false,
}: {
  showFilters?: boolean;
}) {
  const today = new Date();
  const [dateFrom, setDateFrom] = React.useState(
    format(startOfMonth(today), "yyyy-MM-dd"),
  );
  const [dateTo, setDateTo] = React.useState(
    format(endOfMonth(today), "yyyy-MM-dd"),
  );
  const [filterType, setFilterType] = React.useState<
    "entrada" | "saida" | "todos"
  >("todos");
  const [filterGroup, setFilterGroup] = React.useState<string | null>(null);

  const { data: accounts } = useAccounts();

  const [isGrouped, setIsGrouped] = React.useState(true);

  // Duplication dialog state & ref
  const [duplicateSource, setDuplicateSource] = React.useState<{
    groupId: string;
    groupName: string;
    txs: any[];
  } | null>(null);
  const duplicateDialogRef = React.useRef<HTMLDialogElement>(null);
  const [targetMonth, setTargetMonth] = React.useState<number>(6);
  const [targetYear, setTargetYear] = React.useState<number>(2026);
  const [targetStatus, setTargetStatus] = React.useState<
    "original" | "pending" | "paid"
  >("pending");

  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as any;
  const viewMode =
    search.view === "calendar"
      ? "calendar"
      : search.view === "daily"
        ? "daily"
        : "list";

  const setViewMode = (mode: "list" | "calendar" | "daily") => {
    navigate({
      search: (prev: any) => ({ ...prev, view: mode }),
    } as any);
  };

  const groupIds = React.useMemo(() => {
    if (!filterGroup) return undefined;
    if (!accounts) return [filterGroup];

    // Busca contas filhas associadas a essa conta pai
    const children = accounts.filter((acc) => acc.parent_id === filterGroup);
    return [filterGroup, ...children.map((c) => c.id)];
  }, [filterGroup, accounts]);

  const filters = {
    dateFrom,
    dateTo,
    ...(filterType !== "todos"
      ? { type: filterType as "entrada" | "saida" }
      : {}),
    ...(groupIds ? { groupIds } : {}),
  };

  const { data: transactions, isLoading, error } = useTransactions(filters);

  const { entradas, saidas } = React.useMemo(() => {
    if (!transactions) return { entradas: [], saidas: [] };
    const entradas = transactions
      .filter((t) => t.transaction_type === "entrada")
      .sort(sortTransactions);
    const saidas = transactions
      .filter((t) => t.transaction_type !== "entrada")
      .sort(sortTransactions);
    return { entradas, saidas };
  }, [transactions]);

  const {
    totalEntradas,
    totalSaidas,
    saldoFinal,
    totalEntradasPagas,
    totalSaidasPagas,
    saldoFinalPago,
  } = React.useMemo(() => {
    if (!transactions) {
      return {
        totalEntradas: 0,
        totalSaidas: 0,
        saldoFinal: 0,
        totalEntradasPagas: 0,
        totalSaidasPagas: 0,
        saldoFinalPago: 0,
      };
    }
    let totalEntradas = 0;
    let totalSaidas = 0;
    let totalEntradasPagas = 0;
    let totalSaidasPagas = 0;
    for (const t of transactions) {
      const amount = t.amount || 0;
      const amountPaid = t.amount_paid || 0;
      if (t.transaction_type === "entrada") {
        totalEntradas += amount;
        totalEntradasPagas += amountPaid;
      } else {
        totalSaidas += amount;
        totalSaidasPagas += amountPaid;
      }
    }
    return {
      totalEntradas,
      totalSaidas,
      saldoFinal: totalEntradas - totalSaidas,
      totalEntradasPagas,
      totalSaidasPagas,
      saldoFinalPago: totalEntradasPagas - totalSaidasPagas,
    };
  }, [transactions]);

  const { mutate: deleteTransaction, isPending: isDeleting } =
    useDeleteTransaction();
  const { mutate: duplicateTransaction, isPending: isDuplicating } =
    useDuplicateTransaction();
  const { mutateAsync: updateTransactionAsync } = useUpdateTransaction();
  const { mutateAsync: createManyTransactions, isPending: isCreatingMany } =
    useCreateManyTransactions();

  const handleOpenDuplicateDialog = (
    groupId: string,
    groupName: string,
    txs: any[],
  ) => {
    const [currentYear, currentMonth] = dateFrom.split("-").map(Number);
    let nextMonth = currentMonth + 1;
    let nextYear = currentYear;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }

    setTargetMonth(nextMonth);
    setTargetYear(nextYear);
    setTargetStatus("pending");
    setDuplicateSource({ groupId, groupName, txs });
    duplicateDialogRef.current?.showModal();
  };

  const handleDuplicateSingle = (tx: any, shiftKey: boolean) => {
    if (shiftKey) {
      duplicateTransaction(tx.id);
    } else {
      handleOpenDuplicateDialog(tx.group_id ?? "single", tx.title, [tx]);
    }
  };

  const handleConfirmDuplicate = async () => {
    if (!duplicateSource || duplicateSource.txs.length === 0) return;

    try {
      const inputs = duplicateSource.txs.map((tx) => {
        const origDay = Number(tx.payment_date.split("-")[2]);
        const targetDate = new Date(targetYear, targetMonth - 1, origDay);

        if (targetDate.getMonth() !== targetMonth - 1) {
          const lastDay = new Date(targetYear, targetMonth, 0).getDate();
          targetDate.setDate(lastDay);
        }

        const newPaymentDate = format(targetDate, "yyyy-MM-dd");

        let isPaid = tx.is_paid;
        let amountPaid = tx.amount_paid;

        if (targetStatus === "pending") {
          isPaid = false;
          amountPaid = 0;
        } else if (targetStatus === "paid") {
          isPaid = true;
          amountPaid = tx.amount;
        }

        return {
          title: tx.title,
          amount: tx.amount,
          amount_paid: amountPaid,
          is_paid: isPaid,
          payment_date: newPaymentDate,
          transaction_type: tx.transaction_type,
          group_id: tx.group_id,
          notes: tx.notes,
        };
      });

      await createManyTransactions(inputs);

      duplicateDialogRef.current?.close();
      setDuplicateSource(null);
    } catch (err) {
      console.error("Erro ao duplicar lançamentos:", err);
    }
  };

  const [updatingIds, setUpdatingIds] = React.useState<Set<string>>(new Set());

  const handleMarkAsPaid = async (tx: any) => {
    setUpdatingIds((prev) => new Set(prev).add(tx.id));
    try {
      await updateTransactionAsync({
        id: tx.id,
        is_paid: true,
        amount_paid: tx.amount,
      });
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(tx.id);
        return next;
      });
    }
  };

  const handleUpdateTitle = async (id: string, newTitle: string) => {
    setUpdatingIds((prev) => new Set(prev).add(id));
    try {
      await updateTransactionAsync({
        id,
        title: newTitle,
      });
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  if (error) {
    return (
      <div className="text-center p-4 text-destructive">
        Erro ao carregar lançamentos.
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col overflow-hidden gap-6">
      {/* Filtros Avançados */}
      <div className="shrink-0">
        <TransactionFiltersForm
          dateFrom={dateFrom}
          dateTo={dateTo}
          setDateFrom={setDateFrom}
          setDateTo={setDateTo}
          filterType={filterType}
          setFilterType={setFilterType}
          filterGroup={filterGroup}
          setFilterGroup={setFilterGroup}
          showFilters={showFilters}
        />
      </div>

      {/* Main View Area */}
      <div className="flex-1 flex flex-col overflow-hidden gap-4">
        {/* Header with Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
          <div className="flex gap-3 items-center">
            <button
              type="button"
              onClick={() => {
                const nextDate = addMonths(parseISO(dateFrom), -1);
                setDateFrom(format(startOfMonth(nextDate), "yyyy-MM-dd"));
                setDateTo(format(endOfMonth(nextDate), "yyyy-MM-dd"));
              }}
              className="p-1.5 hover:bg-muted rounded-md transition-colors flex items-center justify-center cursor-pointer"
              title="Mês Anterior"
            >
              <ChevronLeft className="size-4" />
            </button>
            <h2 className="text-lg font-bold first-letter:capitalize min-w-[140px] text-center">
              {format(parseISO(dateFrom), "MMMM 'de' yyyy", { locale: ptBR })}
            </h2>
            <button
              type="button"
              onClick={() => {
                const nextDate = addMonths(parseISO(dateFrom), 1);
                setDateFrom(format(startOfMonth(nextDate), "yyyy-MM-dd"));
                setDateTo(format(endOfMonth(nextDate), "yyyy-MM-dd"));
              }}
              className="p-1.5 hover:bg-muted rounded-md transition-colors flex items-center justify-center cursor-pointer"
              title="Próximo Mês"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <TransactionListSummary
            totalEntradas={totalEntradas}
            totalSaidas={totalSaidas}
            saldoFinal={saldoFinal}
            totalEntradasPagas={totalEntradasPagas}
            totalSaidasPagas={totalSaidasPagas}
            saldoFinalPago={saldoFinalPago}
          />

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            {viewMode === "list" && (
              <button
                type="button"
                onClick={() => setIsGrouped(!isGrouped)}
                className={`flex items-center justify-center p-2 rounded-md border shadow-sm transition-all cursor-pointer ${
                  isGrouped
                    ? "bg-primary text-primary-foreground border-primary shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
                    : "bg-background text-foreground border-input hover:bg-muted"
                }`}
                title={
                  isGrouped
                    ? "Desagrupar Contas (Visualização Plana)"
                    : "Agrupar por Conta"
                }
              >
                <FolderTree className="h-4 w-4" />
              </button>
            )}
            <TransactionTabs viewMode={viewMode} setViewMode={setViewMode} />
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center p-4 text-muted-foreground flex-1 flex items-center justify-center">
            Carregando lançamentos...
          </div>
        ) : !transactions || transactions.length === 0 ? (
          <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground flex-1 flex flex-col justify-center items-center">
            Nenhum lançamento encontrado neste período.
          </div>
        ) : viewMode === "list" ? (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 w-full overflow-hidden items-stretch">
            {/* Tabela de Entradas */}
            <div className="flex flex-col h-full overflow-hidden space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 pl-1 shrink-0">
                Entradas (+)
              </h3>
              <TransactionTable
                txs={entradas}
                isGrouped={isGrouped}
                updatingIds={updatingIds}
                isDeleting={isDeleting}
                isDuplicating={isDuplicating}
                onUpdateTitle={handleUpdateTitle}
                onMarkAsPaid={handleMarkAsPaid}
                onDelete={deleteTransaction}
                onDuplicate={handleDuplicateSingle}
                onDuplicateGroup={handleOpenDuplicateDialog}
              />
            </div>

            {/* Tabela de Saídas */}
            <div className="flex flex-col h-full overflow-hidden space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 pl-1 shrink-0">
                Saídas (-)
              </h3>
              <TransactionTable
                txs={saidas}
                isGrouped={isGrouped}
                updatingIds={updatingIds}
                isDeleting={isDeleting}
                isDuplicating={isDuplicating}
                onUpdateTitle={handleUpdateTitle}
                onMarkAsPaid={handleMarkAsPaid}
                onDelete={deleteTransaction}
                onDuplicate={handleDuplicateSingle}
                onDuplicateGroup={handleOpenDuplicateDialog}
              />
            </div>
          </div>
        ) : viewMode === "calendar" ? (
          <div className="flex-1 overflow-auto">
            <TransactionCalendar
              transactions={transactions}
              currentDate={parseISO(dateFrom)}
              updatingIds={updatingIds}
              onMarkAsPaid={handleMarkAsPaid}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <TransactionDailyView
              transactions={transactions}
              updatingIds={updatingIds}
              onMarkAsPaid={handleMarkAsPaid}
            />
          </div>
        )}
      </div>

      {/* Diálogo de Duplicação em Lote */}
      <dialog
        ref={duplicateDialogRef}
        className="m-auto rounded-xl border bg-card p-6 shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm open:animate-in open:fade-in open:zoom-in-95 duration-200 w-full max-w-md focus:outline-none"
        onClose={() => setDuplicateSource(null)}
      >
        {duplicateSource && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-bold text-foreground">
                Duplicar lançamentos de "{duplicateSource.groupName}"
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Isso criará uma cópia de todos os {duplicateSource.txs.length}{" "}
                lançamentos desta conta e subcontas no período selecionado.
              </p>
            </div>

            <div className="space-y-4">
              {/* Mês e Ano de Destino */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="dup-month"
                    className="text-xs font-semibold text-muted-foreground"
                  >
                    Mês de Destino
                  </label>
                  <select
                    id="dup-month"
                    value={targetMonth}
                    onChange={(e) => setTargetMonth(Number(e.target.value))}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        {format(new Date(2026, m - 1, 1), "MMMM", {
                          locale: ptBR,
                        })}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="dup-year"
                    className="text-xs font-semibold text-muted-foreground"
                  >
                    Ano de Destino
                  </label>
                  <input
                    id="dup-year"
                    type="number"
                    value={targetYear}
                    onChange={(e) => setTargetYear(Number(e.target.value))}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>

              {/* Status de Destino */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Status Financeiro no Destino
                </label>
                <div className="space-y-2 pt-1">
                  <label className="flex items-center space-x-2.5 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="dup-status"
                      value="pending"
                      checked={targetStatus === "pending"}
                      onChange={() => setTargetStatus("pending")}
                      className="h-4 w-4 text-primary focus:ring-primary"
                    />
                    <span>Pendente / Não Pago</span>
                  </label>
                  <label className="flex items-center space-x-2.5 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="dup-status"
                      value="paid"
                      checked={targetStatus === "paid"}
                      onChange={() => setTargetStatus("paid")}
                      className="h-4 w-4 text-primary focus:ring-primary"
                    />
                    <span>Pago / Concluído</span>
                  </label>
                  <label className="flex items-center space-x-2.5 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="dup-status"
                      value="original"
                      checked={targetStatus === "original"}
                      onChange={() => setTargetStatus("original")}
                      className="h-4 w-4 text-primary focus:ring-primary"
                    />
                    <span>Manter status original</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => duplicateDialogRef.current?.close()}
                className="h-9 px-4 py-2 text-sm font-semibold rounded-md border border-input bg-background hover:bg-muted transition-colors cursor-pointer"
                disabled={isCreatingMany}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDuplicate}
                className="h-9 px-4 py-2 text-sm font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow cursor-pointer disabled:opacity-50"
                disabled={isCreatingMany}
              >
                {isCreatingMany ? "Duplicando..." : "Confirmar"}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
