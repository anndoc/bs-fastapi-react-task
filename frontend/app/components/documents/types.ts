export const DOCUMENTS_KEY = ["documents"];
export const POLL_INTERVAL_MS = 30_000;

export const FILE_TYPES = ["pdf", "txt"] as const;
export type FileType = (typeof FILE_TYPES)[number];

export const getFileType = (fileName: string): FileType | undefined =>
  FILE_TYPES.find((type) => fileName.toLowerCase().endsWith(`.${type}`));

export type DocumentStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export const STATUS_LABELS = {
  pending: "Pending",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
} as const satisfies Record<DocumentStatus, string>;

export type DocumentStatusLabel = (typeof STATUS_LABELS)[DocumentStatus];

export type DocumentItem = {
  id: string;
  name: string;
  size: string;
  uploaded: string;
  status: DocumentStatusLabel;
  type: FileType;
};

export type DocumentResponse = {
  id: string;
  file_name: string;
  size: number;
  status: DocumentStatus;
  modified_at: string;
};
