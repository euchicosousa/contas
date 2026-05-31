import * as React from "react";
import { formatCurrency } from "#/lib/utils";

interface TransactionListSummaryProps {
  totalEntradas: number;
  totalSaidas: number;
  saldoFinal: number;
  totalEntradasPagas: number;
  totalSaidasPagas: number;
  saldoFinalPago: number;
}

export function TransactionListSummary({
  totalEntradas,
  totalSaidas,
  saldoFinal,
  totalEntradasPagas,
  totalSaidasPagas,
  saldoFinalPago,
}: TransactionListSummaryProps) {
  const [showPaid, setShowPaid] = React.useState(false);

  const entries = showPaid ? totalEntradasPagas : totalEntradas;
  const expenses = showPaid ? totalSaidasPagas : totalSaidas;
  const net = showPaid ? saldoFinalPago : saldoFinal;
  const label = showPaid ? "PAGOS" : "PREVISÃO";

  return (
    <div
      onClick={() => setShowPaid((prev) => !prev)}
      className="flex items-center gap-3 text-sm font-medium bg-muted/40 hover:bg-muted/60 px-4 py-2 rounded-lg border border-border shadow-sm cursor-pointer select-none transition-all duration-200"
      title="Clique para alternar entre Previsão e Pagos"
    >
      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
        {formatCurrency(entries)}
      </span>
      <span className="text-muted-foreground font-light">-</span>
      <span className="text-rose-600 dark:text-rose-400 font-semibold">
        {formatCurrency(expenses)}
      </span>
      <span className="text-muted-foreground font-light">=</span>
      <span
        className={`font-bold px-1.5 py-0.5 rounded transition-colors duration-200 ${
          net >= 0
            ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30"
            : "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/30"
        }`}
      >
        {formatCurrency(net)}
      </span>
    </div>
  );
}
