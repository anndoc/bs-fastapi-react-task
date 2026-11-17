import { data } from "react-router";
import {
  STATUS_LABELS,
  getFileType,
  type DocumentItem,
  type DocumentResponse,
} from "@/components/documents/types";
import { formatSize, formatUploaded } from "@/lib/documents/utils";

// The browser goes through the Vite `/api` proxy; only SSR needs the absolute URL.
const API_URL = import.meta.env.SSR ? process.env.API_URL : "";
if (API_URL === undefined) throw new Error("API_URL is not set");

const toDocumentItem = (item: DocumentResponse): DocumentItem => {
  const type = getFileType(item.file_name);
  if (!type) throw new Error(`Unsupported file type: ${item.file_name}`);
  return {
    id: item.id,
    name: item.file_name,
    size: formatSize(item.size),
    uploaded: formatUploaded(item.modified_at),
    status: STATUS_LABELS[item.status],
    type,
  };
};


export async function documentList(): Promise<DocumentItem[]> {
  const res = await fetch(`${API_URL}/api/documents/`);
  if (!res.ok) throw data("Failed to load documents", { status: res.status });
  const documents: DocumentResponse[] = await res.json();
  return documents.map(toDocumentItem);
}


export async function uploadDocument(file: File): Promise<DocumentItem> {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch(`${API_URL}/api/documents/`, {
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
  const res = await fetch(`${API_URL}/api/documents/${id}`, {
    method: "DELETE",
  });
  if (!res.ok && res.status !== 404) throw new Error("Delete failed");
}
