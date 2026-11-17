import {
  afterAll,
  afterEach,
  assert,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  deleteDocument,
  documentList,
  uploadDocument,
} from "@/lib/documents/api";
import type { DocumentResponse } from "@/components/documents/types";

const { API_URL } = vi.hoisted(() => {
  const url = "http://api.test";
  vi.stubEnv("API_URL", url);
  return { API_URL: url };
});

const NOW = Date.parse("2026-11-17T12:00:00Z");

const fetchMock = vi.fn<typeof fetch>();

const documentResponse: DocumentResponse = {
  id: "1",
  file_name: "report.pdf",
  size: 2048,
  status: "completed",
  modified_at: "2026-11-17T10:00:00Z",
};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe("documentList", () => {
  it("maps the API response to document items", async () => {
    vi.useFakeTimers({ now: NOW });
    fetchMock.mockResolvedValue(Response.json([documentResponse]));

    await expect(documentList()).resolves.toEqual([
      {
        id: "1",
        name: "report.pdf",
        size: "2 kB",
        uploaded: "Uploaded 2 hours ago",
        status: "Completed",
        type: "pdf",
      },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/api/documents/`);
  });

  it("returns an empty list when there are no documents", async () => {
    fetchMock.mockResolvedValue(Response.json([]));

    await expect(documentList()).resolves.toEqual([]);
  });

  it("throws a route error when the request fails", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 503 }));

    await expect(documentList()).rejects.toMatchObject({
      data: "Failed to load documents",
      init: { status: 503 },
    });
  });

  it("rejects documents with an unsupported extension", async () => {
    fetchMock.mockResolvedValue(
      Response.json([{ ...documentResponse, file_name: "notes.docx" }]),
    );

    await expect(documentList()).rejects.toThrow(
      "Unsupported file type: notes.docx",
    );
  });
});

describe("uploadDocument", () => {
  it("posts the file as multipart form data", async () => {
    const file = new File(["hello"], "notes.txt", { type: "text/plain" });
    fetchMock.mockResolvedValue(
      Response.json({
        ...documentResponse,
        id: "2",
        file_name: "notes.txt",
        size: 5,
        status: "pending",
      }),
    );

    await expect(uploadDocument(file)).resolves.toMatchObject({
      id: "2",
      name: "notes.txt",
      type: "txt",
      status: "Pending",
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_URL}/api/documents/`);
    expect(init?.method).toBe("POST");
    assert.instanceOf(init?.body, FormData);
    expect(init.body.get("file")).toBe(file);
  });

  it("surfaces the server detail when the upload fails", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ detail: "File too large" }, { status: 413 }),
    );

    await expect(uploadDocument(new File(["x"], "a.pdf"))).rejects.toThrow(
      "File too large",
    );
  });

  it("falls back to a generic message when detail is not a string", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ detail: [{ msg: "bad" }] }, { status: 422 }),
    );

    await expect(uploadDocument(new File(["x"], "a.pdf"))).rejects.toThrow(
      "Upload failed",
    );
  });

  it("falls back to a generic message when the error body is not JSON", async () => {
    fetchMock.mockResolvedValue(new Response("<html>", { status: 500 }));

    await expect(uploadDocument(new File(["x"], "a.pdf"))).rejects.toThrow(
      "Upload failed",
    );
  });
});

describe("deleteDocument", () => {
  it("sends a DELETE request", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(deleteDocument("abc")).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/api/documents/abc`, {
      method: "DELETE",
    });
  });

  it("resolves when the document is already gone", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 404 }));

    await expect(deleteDocument("abc")).resolves.toBeUndefined();
  });

  it("throws when the request fails", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }));

    await expect(deleteDocument("abc")).rejects.toThrow("Delete failed");
  });
});
