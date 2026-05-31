import * as React from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "@tanstack/react-router";
import { CopyIcon, Edit2Icon, Trash2Icon } from "lucide-react";
import { Input } from "#/components/ui/input";
import { PayButton } from "./PayButton";
import { cn, formatCurrency } from "#/lib/utils";

function InlineEditableTitle({
  initialTitle,
  onSave,
  disabled,
}: {
  initialTitle: string;
  onSave: (newTitle: string) => void;
  disabled: boolean;
}) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [title, setTitle] = React.useState(initialTitle);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle]);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    if (title.trim() && title !== initialTitle) {
      onSave(title.trim());
    } else {
      setTitle(initialTitle);
    }
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") {
            setTitle(initialTitle);
            setIsEditing(false);
          }
        }}
        disabled={disabled}
        className="w-full h-6 py-1 px-2 -ml-2 font-medium md:text-xs"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      disabled={disabled}
      className="font-medium border border-transparent text-foreground hover:bg-muted/50 rounded -ml-2 px-2 py-0.5 transition-colors text-left disabled:opacity-50 truncate w-full"
    >
      {title}
    </button>
  );
}

interface TransactionTableRowProps {
  tx: any;
  isUpdating: boolean;
  isDuplicating: boolean;
  isDeleting: boolean;
  onUpdateTitle: (tx: any, title: string) => void;
  onMarkAsPaid: (tx: any) => void;
  onDuplicate: (tx: any, shiftKey: boolean) => void;
  onDelete: (id: string) => void;
  isChildRow?: boolean;
  isSubChildRow?: boolean;
}

export function TransactionTableRow({
  tx,
  isUpdating,
  isDuplicating,
  isDeleting,
  onUpdateTitle,
  onMarkAsPaid,
  onDuplicate,
  onDelete,
  isChildRow = false,
  isSubChildRow = false,
}: TransactionTableRowProps) {
  const isThinner = isChildRow || isSubChildRow;
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const isLate = !tx.is_paid && tx.payment_date < todayStr;

  return (
    <tr
      className={`border-b last:border-0 transition-colors group/row ${
        isLate
          ? "bg-yellow-500/10 dark:bg-yellow-500/5 hover:bg-yellow-500/15 dark:hover:bg-yellow-500/10"
          : `hover:bg-muted/50 ${isThinner ? "bg-muted/5 dark:bg-muted/5" : ""}`
      }`}
    >
      <td
        className={`whitespace-nowrap ${
          isSubChildRow
            ? "p-2 pl-12 text-xs text-muted-foreground"
            : isChildRow
              ? "p-2 pl-8 text-xs text-muted-foreground"
              : "p-4"
        }`}
      >
        {format(parseISO(tx.payment_date), "dd 'de' MMM", { locale: ptBR })}
      </td>
      <td className={cn(isThinner ? "p-2 text-xs" : "p-4", "")}>
        <div className={cn("flex items-center gap-2 min-w-0", isSubChildRow ? "pl-6" : isChildRow ? "pl-2" : "")}>
          <div className="min-w-0 flex-1">
            <InlineEditableTitle
              initialTitle={tx.title}
              onSave={(newTitle) => onUpdateTitle(tx, newTitle)}
              disabled={isUpdating}
            />
          </div>
          {tx.installment_index != null && tx.installment_total != null && (
            <span className="shrink-0 text-[10px] font-bold tabular-nums text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {tx.installment_index}/{tx.installment_total}
            </span>
          )}
        </div>
      </td>
      <td
        className={`text-right whitespace-nowrap ${isThinner ? "p-2 text-xs" : "p-4"}`}
      >
        <span
          className={
            tx.transaction_type === "entrada"
              ? "text-emerald-500 font-medium"
              : "text-foreground"
          }
        >
          {tx.transaction_type === "entrada" ? "+" : "-"}
          {formatCurrency(tx.amount)}
        </span>
      </td>
      <td className={`text-right ${isThinner ? "p-2" : "p-4"}`}>
        <div className="flex items-center justify-end">
          {/* Status Area */}
          <div
            className={`${isThinner ? "w-[100px] mr-2 h-6" : "w-[110px] mr-3 h-7"} flex justify-end items-center`}
          >
            <PayButton
              tx={tx}
              isUpdating={isUpdating}
              onMarkAsPaid={onMarkAsPaid}
              variant="table"
            />
          </div>

          {/* Actions Area */}
          <div className="flex items-center gap-2 pl-3">
            <button
              onClick={(e) => onDuplicate(tx, e.shiftKey)}
              disabled={isDuplicating}
              className="text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
              title="Duplicar"
            >
              <CopyIcon className="h-4 w-4" />
            </button>
            <Link
              to="/transactions/$id/edit"
              params={{ id: tx.id }}
              className="text-muted-foreground hover:text-primary transition-colors"
              title="Editar"
            >
              <Edit2Icon className="h-4 w-4" />
            </Link>
            <button
              onClick={() => {
                if (
                  window.confirm(
                    "Tem certeza que deseja excluir este lançamento?",
                  )
                ) {
                  onDelete(tx.id);
                }
              }}
              disabled={isDeleting}
              className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
              title="Excluir"
            >
              <Trash2Icon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}
