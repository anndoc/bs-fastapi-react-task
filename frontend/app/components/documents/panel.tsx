import { useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import DocumentList from "@/components/documents/list";
import {
  DOCUMENTS_KEY,
  POLL_INTERVAL_MS,
  getFileType,
  type DocumentItem, STATUS_LABELS,
} from "@/components/documents/types";
import Upload from "@/components/documents/upload";
import { deleteDocument, documentList, uploadDocument } from "@/lib/documents/api";
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

export default function DocumentPanel({
  initialDocuments,
}: {
  initialDocuments: DocumentItem[];
}) {
  const queryClient = useQueryClient();
  const { data: documents } = useQuery({
    queryKey: DOCUMENTS_KEY,
    queryFn: documentList,
    initialData: initialDocuments,
    refetchInterval: ({ state }) =>
      state.data?.some(
        (doc) => doc.status === STATUS_LABELS.pending || doc.status === STATUS_LABELS.processing,
      )
        ? POLL_INTERVAL_MS
        : false,
  });
  const upload = useMutation({
    mutationFn: uploadDocument,
    onSuccess: (uploaded) =>
      queryClient.setQueryData<DocumentItem[]>(DOCUMENTS_KEY, (current = []) => [
        uploaded,
        ...current,
      ]),
  });
  const remove = useMutation({
    mutationFn: deleteDocument,
    onSuccess: (_, id) =>
      queryClient.setQueryData<DocumentItem[]>(DOCUMENTS_KEY, (current = []) =>
        current.filter((doc) => doc.id !== id),
      ),
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

  const addFiles = async (files: FileList | File[]) => {
    setUploadErrors([]);
    for (const file of Array.from(files)) {
      if (!getFileType(file.name)) continue;
      try {
        await upload.mutateAsync(file);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setUploadErrors((current) => [...current, `${file.name}: ${message}`]);
      }
    }
  };

  const removeDocument = () => {
    if (deleteId !== null) remove.mutate(deleteId);
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
        {uploadErrors.length > 0 && (
          <ul className="-mt-5 mb-6 space-y-1 text-sm text-rose-600">
            {uploadErrors.map((message, index) => (
              <li key={index}>{message}</li>
            ))}
          </ul>
        )}
        {remove.error && (
          <p className="-mt-5 mb-6 text-sm text-rose-600">
            {remove.error.message}
          </p>
        )}

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
