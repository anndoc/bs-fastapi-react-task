import { Check, LoaderCircle, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  STATUS_LABELS,
  type DocumentItem,
  type DocumentStatusLabel,
  type FileType,
} from "@/components/documents/types";

function StatusBadge({ status }: { status: DocumentStatusLabel }) {
  const styles: Record<DocumentStatusLabel, string> = {
    [STATUS_LABELS.pending]: "border-amber-200 bg-amber-50 text-amber-700",
    [STATUS_LABELS.processing]: "border-blue-200 bg-blue-50 text-blue-700",
    [STATUS_LABELS.completed]:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    [STATUS_LABELS.failed]: "border-rose-200 bg-rose-50 text-rose-700",
  };
  return (
    <Badge
      variant="outline"
      className={`gap-1.5 rounded-full px-2.5 py-1 font-medium ${styles[status]}`}
    >
      {status === STATUS_LABELS.processing ? (
        <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
      ) : status === STATUS_LABELS.completed ? (
        <Check className="h-3.5 w-3.5" />
      ) : status === STATUS_LABELS.failed ? (
        <X className="h-3.5 w-3.5" />
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
      )}
      {status}
    </Badge>
  );
}

const GLYPH_STYLES: Record<FileType, { box: string; label: string }> = {
  pdf: { box: "border-red-100 bg-red-50 text-red-500", label: "bg-red-500" },
  txt: {
    box: "border-slate-200 bg-slate-100 text-slate-500",
    label: "bg-slate-500",
  },
};

function FileGlyph({ type }: { type: FileType }) {
  const { box, label } = GLYPH_STYLES[type];
  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${box}`}
    >
      <span
        className={`rounded px-1 py-1.5 text-[9px] font-bold uppercase leading-none text-white ${label}`}
      >
        {type}
      </span>
    </div>
  );
}

export type DocumentProps = {
  doc: DocumentItem;
  onDelete: (id: string) => void;
};

export default function Document({ doc, onDelete }: DocumentProps) {
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
