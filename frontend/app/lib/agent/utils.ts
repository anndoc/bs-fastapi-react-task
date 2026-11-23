import {
  CHAT_EVENTS,
  type AssistantMessageData,
  type ChatStreamEvent,
  type SourceResponse,
} from "@/components/agent/types";

export async function* readEvents(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<ChatStreamEvent> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) return;
    buffer += decoder.decode(value, { stream: true }).replace(/\r\n?/g, "\n");
    let end;
    while ((end = buffer.indexOf("\n\n")) !== -1) {
      const lines = buffer.slice(0, end).split("\n");
      buffer = buffer.slice(end + 2);
      const name = lines.find((line) => line.startsWith("event:"))?.slice(6);
      const event = CHAT_EVENTS.find((known) => known === name?.trim());
      if (!event) continue;
      const data = lines
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).replace(/^ /, ""));
      yield { event, data: data.length ? JSON.parse(data.join("\n")) : null };
    }
  }
}

export const groupSources = (
  sources: SourceResponse[],
): NonNullable<AssistantMessageData["sources"]> => {
  const documents = new Map<string, { name: string; pages: number[] }>();
  for (const { document_id, file_name, page } of sources) {
    const document = documents.get(document_id);
    if (document) document.pages.push(page);
    else documents.set(document_id, { name: file_name, pages: [page] });
  }
  return Array.from(documents.values(), ({ name, pages }) => ({
    name,
    pages: pages.sort((a, b) => a - b).join(", "),
  }));
};
