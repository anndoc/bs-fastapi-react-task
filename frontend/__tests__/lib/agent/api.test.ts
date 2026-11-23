import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { chat } from "@/lib/agent/api";

const { API_URL } = vi.hoisted(() => {
  const url = "http://api.test";
  vi.stubEnv("API_URL", url);
  return { API_URL: url };
});

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe("chat", () => {
  it("posts the query and returns the response stream", async () => {
    const response = new Response("event: done\n\n");
    fetchMock.mockResolvedValue(response);

    await expect(chat("What is RAG?", null)).resolves.toBe(response.body);
    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/api/chat/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "What is RAG?" }),
    });
  });

  it("continues an existing session", async () => {
    fetchMock.mockResolvedValue(new Response(""));

    await chat("And then?", "abc");

    expect(fetchMock.mock.calls[0][0]).toBe(
      `${API_URL}/api/chat/?session_id=abc`,
    );
  });

  it("forwards the abort signal", async () => {
    fetchMock.mockResolvedValue(new Response(""));
    const controller = new AbortController();

    await chat("Hi", null, controller.signal);

    expect(fetchMock.mock.calls[0][1]?.signal).toBe(controller.signal);
  });

  it("surfaces the server detail when the request fails", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ detail: "Chat session not found" }, { status: 404 }),
    );

    await expect(chat("Hi", "missing")).rejects.toThrow(
      "Chat session not found",
    );
  });

  it("falls back to a generic message when detail is not a string", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ detail: [{ msg: "too short" }] }, { status: 422 }),
    );

    await expect(chat("", null)).rejects.toThrow("Failed to send question");
  });
});
