import { Separator } from "@/components/ui/separator";
import Document from "@/components/documents/document";
import type { DocumentItem } from "@/components/documents/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SORT_OPTIONS = { newest: "Newest first" } as const;

export type DocumentListProps = {
  documents: DocumentItem[];
  onDelete: (id: string) => void;
};

export default function DocumentList({
  documents,
  onDelete,
}: DocumentListProps) {
  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-semibold">Your Documents ({documents.length})</h2>
        <Select defaultValue="newest" items={SORT_OPTIONS}>
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{SORT_OPTIONS.newest}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Separator />
      <div className="divide-y divide-slate-100">
        {documents.map((doc) => (
          <Document key={doc.id} doc={doc} onDelete={onDelete} />
        ))}
        {documents.length === 0 && (
          <div className="py-8 text-center text-sm text-slate-500">
            No documents uploaded yet.
          </div>
        )}
      </div>
    </>
  );
}
