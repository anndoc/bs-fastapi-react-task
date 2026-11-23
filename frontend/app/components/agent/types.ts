export type AssistantMessageData = {
  content: string;
  time: string;
  error?: boolean;
  sources?: { name: string; pages: string }[];
};

export type UserMessageData = {
  content: string;
  time: string;
};

export type ChatMessage =
  | ({ id: string; role: "user" } & UserMessageData)
  | ({ id: string; role: "assistant" } & AssistantMessageData);

export type ChatSession = {
  id: string;
  title: string;
  modified_at: string;
};

export type ChatDetail = ChatSession & {
  messages: {
    id: string;
    role: ChatMessage["role"];
    content: string;
    created_at: string;
  }[];
};

export type SourceResponse = {
  document_id: string;
  file_name: string;
  page: number;
};

export const CHAT_EVENTS = [
  "init",
  "sources",
  "reasoning",
  "text",
  "done",
  "stop",
] as const;

export type ChatStreamEvent =
  | { event: "init"; data: ChatSession }
  | { event: "sources"; data: SourceResponse[] }
  | { event: "reasoning" | "text" | "stop"; data: string }
  | { event: "done"; data: null };
