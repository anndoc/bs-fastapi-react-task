import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Document from "@/components/documents/document";
import type { DocumentItem } from "@/components/documents/types";

export default function DocumentList({
  documents,
  onDelete,
}: {
  documents: DocumentItem[];
  onDelete: (id: string) => void;
}) {
  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-semibold">Your Documents ({documents.length})</h2>
        <Button variant="outline" size="sm" className="gap-2">
          Newest first <ChevronDown className="h-4 w-4" />
        </Button>
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
