import { data } from "react-router";
import {
  STATUS_LABELS,
  getFileType,
  type DocumentItem,
  type DocumentResponse,
} from "@/components/documents/types";
import { formatSize } from "@/lib/documents/utils";
import { formatRelativeTime } from "@/lib/format";
import { DOCUMENT_URL } from "~/lib/constants";

const toDocumentItem = (item: DocumentResponse): DocumentItem => {
  const type = getFileType(item.file_name);
  if (!type) throw new Error(`Unsupported file type: ${item.file_name}`);
  return {
    id: item.id,
    name: item.file_name,
    size: formatSize(item.size),
    uploaded: formatRelativeTime(item.modified_at, Date.now(), "Uploaded "),
    status: STATUS_LABELS[item.status],
    type,
  };
};

export async function documentList(): Promise<DocumentItem[]> {
  const res = await fetch(DOCUMENT_URL);
  if (!res.ok) throw data("Failed to load documents", { status: res.status });
  const documents: DocumentResponse[] = await res.json();
  return documents.map(toDocumentItem);
}

export async function uploadDocument(file: File): Promise<DocumentItem> {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch(DOCUMENT_URL, {
    method: "POST",
    body,
  });

  if (!res.ok) {
    const error: { detail?: unknown } = await res.json().catch(() => ({}));
    throw new Error(
      typeof error.detail === "string" ? error.detail : "Upload failed",
    );
  }

  const document: DocumentResponse = await res.json();
  return toDocumentItem(document);
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(`${DOCUMENT_URL}${id}`, {
    method: "DELETE",
  });
  if (!res.ok && res.status !== 404) throw new Error("Delete failed");
}
