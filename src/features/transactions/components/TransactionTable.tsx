import * as React from "react";
import { TransactionTableRow } from "./TransactionTableRow";
import { cn, formatCurrency } from "#/lib/utils";
import { useAccounts } from "#/features/accounts/hooks/useAccounts";
import { ChevronDownIcon, ChevronRightIcon, CopyIcon } from "lucide-react";
import { useState } from "react";

interface TransactionTableProps {
  txs: any[];
  isGrouped?: boolean;
  updatingIds: Set<string>;
  isDuplicating: boolean;
  isDeleting: boolean;
  onUpdateTitle: (tx: any, title: string) => void;
  onMarkAsPaid: (tx: any) => void;
  onDuplicate: (tx: any, shiftKey: boolean) => void;
  onDelete: (id: string) => void;
  onDuplicateGroup?: (groupId: string, groupName: string, txs: any[]) => void;
}

export function TransactionTable({
  txs,
  isGrouped = true,
  updatingIds,
  isDuplicating,
  isDeleting,
  onUpdateTitle,
  onMarkAsPaid,
  onDuplicate,
  onDelete,
  onDuplicateGroup,
}: TransactionTableProps) {
  const { data: accounts } = useAccounts();
  const [collapsedIds, setCollapsedIds] = React.useState<Set<string>>(
    () => new Set(),
  );

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isExpanded = (id: string) => !collapsedIds.has(id);

  const totalAmount = React.useMemo(() => {
    return txs.reduce((sum, tx) => sum + (tx.amount || 0), 0);
  }, [txs]);

  const totalPaid = React.useMemo(() => {
    return txs.reduce((sum, tx) => sum + (tx.amount_paid || 0), 0);
  }, [txs]);

  const isEntrada = React.useMemo(() => {
    return txs.some((tx) => tx.transaction_type === "entrada");
  }, [txs]);

  // Agrupa dados para exibição hierárquica
  const groupedData = React.useMemo(() => {
    if (!isGrouped || !accounts) return { tree: [], unassigned: [] };

    const accountMap = new Map(accounts.map((acc) => [acc.id, acc]));
    const txsByAccount = new Map<string, any[]>();
    txsByAccount.set("unassigned", []);

    for (const tx of txs) {
      const gid = tx.group_id;
      if (gid && accountMap.has(gid)) {
        if (!txsByAccount.has(gid)) {
          txsByAccount.set(gid, []);
        }
        txsByAccount.get(gid)!.push(tx);
      } else {
        txsByAccount.get("unassigned")!.push(tx);
      }
    }

    const parentAccounts = accounts.filter((acc) => !acc.parent_id);
    const childAccounts = accounts.filter((acc) => acc.parent_id);

    const tree: Array<{
      id: string;
      name: string;
      totalAmount: number;
      totalPaid: number;
      directTxs: any[];
      children: Array<{
        id: string;
        name: string;
        totalAmount: number;
        totalPaid: number;
        txs: any[];
      }>;
    }> = [];

    for (const parent of parentAccounts) {
      const directTxs = txsByAccount.get(parent.id) || [];
      const parentChildren = childAccounts.filter(
        (child) => child.parent_id === parent.id,
      );

      const childGroups = parentChildren
        .map((child) => {
          const childTxs = txsByAccount.get(child.id) || [];
          const childTotalAmount = childTxs.reduce(
            (sum, tx) => sum + (tx.amount || 0),
            0,
          );
          const childTotalPaid = childTxs.reduce(
            (sum, tx) => sum + (tx.amount_paid || 0),
            0,
          );
          return {
            id: child.id,
            name: child.name,
            totalAmount: childTotalAmount,
            totalPaid: childTotalPaid,
            txs: childTxs,
          };
        })
        .filter((cg) => cg.txs.length > 0);

      const directTotalAmount = directTxs.reduce(
        (sum, tx) => sum + (tx.amount || 0),
        0,
      );
      const directTotalPaid = directTxs.reduce(
        (sum, tx) => sum + (tx.amount_paid || 0),
        0,
      );

      const subAccountsTotalAmount = childGroups.reduce(
        (sum, cg) => sum + cg.totalAmount,
        0,
      );
      const subAccountsTotalPaid = childGroups.reduce(
        (sum, cg) => sum + cg.totalPaid,
        0,
      );

      const parentTotalAmount = directTotalAmount + subAccountsTotalAmount;
      const parentTotalPaid = directTotalPaid + subAccountsTotalPaid;

      if (directTxs.length > 0 || childGroups.length > 0) {
        tree.push({
          id: parent.id,
          name: parent.name,
          totalAmount: parentTotalAmount,
          totalPaid: parentTotalPaid,
          directTxs,
          children: childGroups,
        });
      }
    }

    // Trata subcontas órfãs
    const rootIds = new Set(parentAccounts.map((p) => p.id));
    const orphans = childAccounts.filter((c) => !rootIds.has(c.parent_id!));
    const orphanGroups = orphans
      .map((child) => {
        const childTxs = txsByAccount.get(child.id) || [];
        const childTotalAmount = childTxs.reduce(
          (sum, tx) => sum + (tx.amount || 0),
          0,
        );
        const childTotalPaid = childTxs.reduce(
          (sum, tx) => sum + (tx.amount_paid || 0),
          0,
        );
        return {
          id: child.id,
          name: child.name,
          totalAmount: childTotalAmount,
          totalPaid: childTotalPaid,
          txs: childTxs,
        };
      })
      .filter((cg) => cg.txs.length > 0);

    for (const og of orphanGroups) {
      tree.push({
        id: og.id,
        name: og.name,
        totalAmount: og.totalAmount,
        totalPaid: og.totalPaid,
        directTxs: og.txs,
        children: [],
      });
    }

    const unassigned = txsByAccount.get("unassigned") || [];

    return { tree, unassigned };
  }, [isGrouped, txs, accounts]);

  const unassignedTotalAmount = React.useMemo(() => {
    return groupedData.unassigned.reduce(
      (sum, tx) => sum + (tx.amount || 0),
      0,
    );
  }, [groupedData.unassigned]);

  const unassignedTotalPaid = React.useMemo(() => {
    return groupedData.unassigned.reduce(
      (sum, tx) => sum + (tx.amount_paid || 0),
      0,
    );
  }, [groupedData.unassigned]);

  return (
    <div className="flex-1 w-full flex flex-col overflow-hidden rounded-lg border bg-card">
      {/* 1. Tabela Estática de Cabeçalho e Totais */}
      <table className="w-full text-sm table-fixed border-collapse shrink-0">
        <thead>
          <tr className="text-left text-muted-foreground border-b bg-muted dark:bg-muted/95">
            <th className="p-4 font-medium w-20 sm:w-24">Data</th>
            <th className="p-4 font-medium">Título</th>
            <th className="p-4 font-medium text-right w-24 sm:w-28">Valor</th>
            <th className="p-4 font-medium w-40 sm:w-44 text-center">
              Status / Ações
            </th>
          </tr>
          {txs.length > 0 && (
            <tr className="border-b text-xs font-semibold text-muted-foreground/80 bg-card dark:bg-card/95">
              <td className="p-3 pl-4" colSpan={2}>
                <span className="uppercase tracking-wider text-[10px] font-bold text-muted-foreground">
                  Totais do Período
                </span>
              </td>
              <td className="p-3 text-right font-bold text-foreground whitespace-nowrap w-24 sm:w-28">
                {formatCurrency(totalAmount)}
              </td>
              <SwitchValueTD
                isEntrada={isEntrada}
                value={totalPaid}
                total={totalAmount}
              />
            </tr>
          )}
        </thead>
      </table>

      {/* 2. Container de Rolagem e Tabela com os Lançamentos */}
      <div className="flex-1 overflow-y-auto w-full">
        <table className="w-full text-sm table-fixed border-collapse">
          <colgroup>
            <col className="w-20 sm:w-24" />
            <col />
            <col className="w-24 sm:w-28" />
            <col className="w-40 sm:w-44" />
          </colgroup>
          <tbody className="group">
            {txs.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="p-8 text-center text-muted-foreground border-b last:border-0 border-dashed"
                >
                  Nenhum lançamento registrado.
                </td>
              </tr>
            ) : !isGrouped ? (
              txs.map((tx) => (
                <TransactionTableRow
                  key={tx.id}
                  tx={tx}
                  isUpdating={updatingIds.has(tx.id)}
                  isDuplicating={isDuplicating}
                  isDeleting={isDeleting}
                  onUpdateTitle={onUpdateTitle}
                  onMarkAsPaid={onMarkAsPaid}
                  onDuplicate={onDuplicate}
                  onDelete={onDelete}
                />
              ))
            ) : (
              <>
                {/* 1. Lançamentos Agrupados em Árvore */}
                {groupedData.tree.map((parent) => {
                  const parentExpanded = isExpanded(parent.id);
                  return (
                    <React.Fragment key={parent.id}>
                      {/* Linha de Conta Principal */}
                      <tr
                        onClick={() => toggleCollapse(parent.id)}
                        className="bg-muted/20 border-b cursor-pointer hover:bg-muted/35 transition-colors font-semibold select-none"
                      >
                        <td
                          className="p-2.5 pl-4 text-xs font-bold text-foreground/90 whitespace-nowrap flex items-center justify-end  gap-1.5"
                          colSpan={2}
                        >
                          {parentExpanded ? (
                            <ChevronDownIcon className="size-4 text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronRightIcon className="size-4 text-muted-foreground shrink-0" />
                          )}
                        </td>
                        <td className="pl-4">
                          <span className="font-bold text-foreground truncate">
                            {parent.name}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const txsToDuplicate = [
                                ...parent.directTxs,
                                ...parent.children.flatMap(
                                  (child) => child.txs,
                                ),
                              ];
                              onDuplicateGroup?.(
                                parent.id,
                                parent.name,
                                txsToDuplicate,
                              );
                            }}
                            className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-muted transition-all ml-1.5 shrink-0"
                            title="Duplicar lançamentos desta conta e subcontas"
                          >
                            <CopyIcon className="h-3.5 w-3.5" />
                          </button>
                        </td>
                        <td className="p-2.5 text-right font-bold text-foreground/90 whitespace-nowrap">
                          {formatCurrency(parent.totalAmount)}
                        </td>
                        <td
                          className={`p-2.5 text-center text-xs font-bold whitespace-nowrap ${
                            isEntrada
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {isEntrada ? "Recebido: " : "Pago: "}
                          {formatCurrency(parent.totalPaid)}
                        </td>
                      </tr>

                      {parentExpanded && (
                        <>
                          {/* Transações Diretas da Conta Principal */}
                          {parent.directTxs.map((tx) => (
                            <TransactionTableRow
                              key={tx.id}
                              tx={tx}
                              isUpdating={updatingIds.has(tx.id)}
                              isDuplicating={isDuplicating}
                              isDeleting={isDeleting}
                              onUpdateTitle={onUpdateTitle}
                              onMarkAsPaid={onMarkAsPaid}
                              onDuplicate={onDuplicate}
                              onDelete={onDelete}
                              isChildRow={true}
                            />
                          ))}

                          {/* Subcontas (Contas Secundárias) */}
                          {parent.children.map((child) => {
                            const childExpanded = isExpanded(child.id);
                            return (
                              <React.Fragment key={child.id}>
                                {/* Linha da Subconta */}
                                <tr
                                  onClick={() => toggleCollapse(child.id)}
                                  className="bg-muted/5 border-b cursor-pointer hover:bg-muted/15 transition-colors text-xs font-medium select-none"
                                >
                                  <td
                                    className="p-2 pl-8 text-xs text-foreground/75 whitespace-nowrap flex items-center gap-1.5"
                                    colSpan={2}
                                  >
                                    {childExpanded ? (
                                      <ChevronDownIcon className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                                    ) : (
                                      <ChevronRightIcon className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                                    )}
                                    <span className="font-semibold text-foreground/80 truncate">
                                      ↳ {child.name}
                                    </span>
                                  </td>
                                  <td className="p-2 text-right font-semibold text-foreground/75 whitespace-nowrap">
                                    {formatCurrency(child.totalAmount)}
                                  </td>
                                  <td
                                    className={`p-2 text-center text-xs font-semibold whitespace-nowrap ${
                                      isEntrada
                                        ? "text-emerald-600/90 dark:text-emerald-400/90"
                                        : "text-rose-600/90 dark:text-rose-400/90"
                                    }`}
                                  >
                                    {isEntrada ? "Recebido: " : "Pago: "}
                                    {formatCurrency(child.totalPaid)}
                                  </td>
                                </tr>

                                {/* Transações da Subconta */}
                                {childExpanded &&
                                  child.txs.map((tx) => (
                                    <TransactionTableRow
                                      key={tx.id}
                                      tx={tx}
                                      isUpdating={updatingIds.has(tx.id)}
                                      isDuplicating={isDuplicating}
                                      isDeleting={isDeleting}
                                      onUpdateTitle={onUpdateTitle}
                                      onMarkAsPaid={onMarkAsPaid}
                                      onDuplicate={onDuplicate}
                                      onDelete={onDelete}
                                      isSubChildRow={true}
                                    />
                                  ))}
                              </React.Fragment>
                            );
                          })}
                        </>
                      )}
                    </React.Fragment>
                  );
                })}

                {/* 2. Lançamentos sem Conta (Se houver) */}
                {groupedData.unassigned.length > 0 && (
                  <>
                    <tr
                      onClick={() => toggleCollapse("unassigned")}
                      className="bg-muted/15 border-b cursor-pointer hover:bg-muted/30 transition-colors font-semibold select-none"
                    >
                      <td
                        className="p-2.5 pl-4 text-xs font-bold text-muted-foreground whitespace-nowrap flex items-center gap-1.5"
                        colSpan={2}
                      >
                        {isExpanded("unassigned") ? (
                          <ChevronDownIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronRightIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <span className="font-bold text-muted-foreground truncate">
                          Sem Conta
                        </span>
                      </td>
                      <td className="p-2.5 text-right font-bold text-muted-foreground whitespace-nowrap">
                        {formatCurrency(unassignedTotalAmount)}
                      </td>
                      <td className="p-2.5 text-center text-xs font-bold text-muted-foreground whitespace-nowrap">
                        {isEntrada ? "Recebido: " : "Pago: "}
                        {formatCurrency(unassignedTotalPaid)}
                      </td>
                    </tr>
                    {isExpanded("unassigned") &&
                      groupedData.unassigned.map((tx) => (
                        <TransactionTableRow
                          key={tx.id}
                          tx={tx}
                          isUpdating={updatingIds.has(tx.id)}
                          isDuplicating={isDuplicating}
                          isDeleting={isDeleting}
                          onUpdateTitle={onUpdateTitle}
                          onMarkAsPaid={onMarkAsPaid}
                          onDuplicate={onDuplicate}
                          onDelete={onDelete}
                          isChildRow={true}
                        />
                      ))}
                  </>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SwitchValueTD({
  isEntrada,
  value,
  total,
}: {
  isEntrada?: boolean;
  value: number;
  total?: number;
}) {
  const [showTotal, setShowTotal] = useState(true);

  function handleChange() {
    setShowTotal(!showTotal);
  }

  return (
    <td
      className={`p-3 text-center font-bold whitespace-nowrap w-40 sm:w-44 ${
        isEntrada
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-rose-600 dark:text-rose-400"
      }`}
      onClick={handleChange}
    >
      {showTotal ? (isEntrada ? "Recebido: " : "Pago: ") : "Falta: "}
      {formatCurrency(showTotal ? value : (total || 0) - value)}
    </td>
  );
}
