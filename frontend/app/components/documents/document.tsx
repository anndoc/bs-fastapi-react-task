import { Check, LoaderCircle, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DocStatus, DocumentItem } from "@/components/documents/list";

function StatusBadge({ status }: { status: DocStatus }) {
  const styles: Record<DocStatus, string> = {
    Pending: "border-amber-200 bg-amber-50 text-amber-700",
    Processing: "border-blue-200 bg-blue-50 text-blue-700",
    Completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Failed: "border-rose-200 bg-rose-50 text-rose-700",
  };
  return (
    <Badge
      variant="outline"
      className={`gap-1.5 rounded-full px-2.5 py-1 font-medium ${styles[status]}`}
    >
      {status === "Processing" ? (
        <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
      ) : status === "Completed" ? (
        <Check className="h-3.5 w-3.5" />
      ) : status === "Failed" ? (
        <X className="h-3.5 w-3.5" />
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
      )}
      {status}
    </Badge>
  );
}

function FileGlyph({ type }: { type: "pdf" | "txt" }) {
  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${type === "pdf" ? "border-red-100 bg-red-50 text-red-500" : "border-slate-200 bg-slate-100 text-slate-500"}`}
    >
      {type === "pdf" ? (
        <span className="rounded bg-red-500 px-1 py-1.5 text-[9px] font-bold leading-none text-white">
          PDF
        </span>
      ) : (
        <span className="rounded bg-slate-500 px-1 py-1.5 text-[9px] font-bold leading-none text-white">
          TXT
        </span>
      )}
    </div>
  );
}

export default function Document({
  doc,
  onDelete,
}: {
  doc: DocumentItem;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <FileGlyph type={doc.type} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{doc.name}</p>
        <p className="mt-1 text-xs text-slate-500">
          {doc.size} · {doc.uploaded}
        </p>
      </div>
      <StatusBadge status={doc.status} />
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Delete ${doc.name}`}
        className="h-8 w-8 shrink-0 text-slate-500 hover:text-rose-600"
        onClick={() => onDelete(doc.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
