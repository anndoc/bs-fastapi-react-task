import { describe, expect, it } from "vitest";
import { groupSources, readEvents } from "@/lib/agent/utils";

const streamOf = (...chunks: string[]) =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });

const collect = async (stream: ReadableStream<Uint8Array>) => {
  const events = [];
  for await (const event of readEvents(stream)) events.push(event);
  return events;
};

describe("readEvents", () => {
  it("parses event names and JSON data", async () => {
    const stream = streamOf(
      'event: init\ndata: {"id":"abc","title":"Hi","modified_at":"2026-01-01T00:00:00Z"}\n\n',
      'event: text\ndata: "Hello"\n\n',
      "event: done\n\n",
    );

    await expect(collect(stream)).resolves.toEqual([
      {
        event: "init",
        data: { id: "abc", title: "Hi", modified_at: "2026-01-01T00:00:00Z" },
      },
      { event: "text", data: "Hello" },
      { event: "done", data: null },
    ]);
  });

  it("reassembles events split across chunks", async () => {
    const stream = streamOf("event: te", 'xt\ndata: "Hel', 'lo"\n', "\n");

    await expect(collect(stream)).resolves.toEqual([
      { event: "text", data: "Hello" },
    ]);
  });

  it("handles CRLF line endings", async () => {
    const stream = streamOf('event: text\r\ndata: "Hi"\r\n\r\n');

    await expect(collect(stream)).resolves.toEqual([
      { event: "text", data: "Hi" },
    ]);
  });

  it("skips keep-alive comments and unknown events", async () => {
    const stream = streamOf(
      ": ping\n\n",
      'event: unknown\ndata: "x"\n\n',
      'event: stop\ndata: "Failed"\n\n',
    );

    await expect(collect(stream)).resolves.toEqual([
      { event: "stop", data: "Failed" },
    ]);
  });
});

describe("groupSources", () => {
  it("groups pages by document in ascending order", () => {
    expect(
      groupSources([
        { document_id: "1", file_name: "a.pdf", page: 3 },
        { document_id: "2", file_name: "b.txt", page: 1 },
        { document_id: "1", file_name: "a.pdf", page: 1 },
      ]),
    ).toEqual([
      { name: "a.pdf", pages: "1, 3" },
      { name: "b.txt", pages: "1" },
    ]);
  });
});
