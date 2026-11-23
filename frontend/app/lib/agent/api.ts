import type { ChatDetail, ChatSession } from "@/components/agent/types";
import { AGENT_URL } from "@/lib/constants";
import { data } from "react-router";

export async function history(): Promise<ChatSession[]> {
  const res = await fetch(AGENT_URL);
  if (!res.ok)
    throw data("Failed to load chat history", { status: res.status });
  return await res.json();
}

export async function detail(sessionId: string): Promise<ChatDetail> {
  const res = await fetch(`${AGENT_URL}${sessionId}`);
  if (!res.ok) throw data("Failed to load chat", { status: res.status });
  return await res.json();
}

export async function chat(
  query: string,
  sessionId: string | null,
  signal?: AbortSignal,
): Promise<ReadableStream<Uint8Array>> {
  const params = sessionId ? `?session_id=${sessionId}` : "";
  const res = await fetch(`${AGENT_URL}${params}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
    signal,
  });

  if (!res.ok) {
    const error: { detail?: unknown } = await res.json().catch(() => ({}));
    throw new Error(
      typeof error.detail === "string"
        ? error.detail
        : "Failed to send question",
    );
  }
  if (!res.body) throw new Error("Empty chat response");
  return res.body;
}
