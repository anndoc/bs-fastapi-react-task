import { useState } from "react";
import DocumentList, {
  type DocStatus,
  type DocumentItem,
} from "@/components/documents/list";
import Upload from "@/components/documents/upload";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const initialDocs: DocumentItem[] = [
  {
    id: 1,
    name: "Product Documentation.pdf",
    size: "2.4 MB",
    uploaded: "Uploaded 2 min ago",
    status: "Processing",
    type: "pdf",
  },
  {
    id: 2,
    name: "API Reference.txt",
    size: "185 KB",
    uploaded: "Uploaded 10 min ago",
    status: "Completed",
    type: "txt",
  },
  {
    id: 3,
    name: "Company Policies.pdf",
    size: "1.8 MB",
    uploaded: "Uploaded 1 hour ago",
    status: "Completed",
    type: "pdf",
  },
  {
    id: 4,
    name: "Meeting Notes.txt",
    size: "78 KB",
    uploaded: "Uploaded 1 day ago",
    status: "Failed",
    type: "txt",
  },
];

export default function DocumentPanel() {
  const [documents, setDocuments] = useState(initialDocs);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const addFiles = (files: FileList | File[]) => {
    const accepted = Array.from(files).filter((file) =>
      /\.(pdf|txt)$/i.test(file.name),
    );
    setDocuments((current) => [
      ...accepted.map((file, index) => ({
        id: Date.now() + index,
        name: file.name,
        size:
          file.size < 1024 * 1024
            ? `${Math.max(1, Math.round(file.size / 1024))} KB`
            : `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        uploaded: "Uploaded just now",
        status: "Pending" as DocStatus,
        type: file.name.toLowerCase().endsWith(".pdf")
          ? ("pdf" as const)
          : ("txt" as const),
      })),
      ...current,
    ]);
  };

  const removeDocument = () => {
    if (deleteId !== null)
      setDocuments((current) => current.filter((doc) => doc.id !== deleteId));
    setDeleteId(null);
  };

  return (
    <>
      <section className="flex min-h-[700px] flex-col border-b border-slate-200 p-5 sm:p-6 lg:border-b-0 lg:border-r">
        <header className="mb-7">
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <p className="mt-1.5 max-w-md text-sm leading-relaxed text-slate-600">
            Upload and manage your documents. They will be processed in the
            background and used for answering your questions.
          </p>
        </header>
        <Upload onFiles={addFiles} />

        <DocumentList documents={documents} onDelete={setDeleteId} />
      </section>

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>
              This document will be removed from your document list. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={removeDocument}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
