// The browser goes through the Vite `/api` proxy; only SSR needs the absolute URL.
export const API_URL = import.meta.env.SSR ? process.env.API_URL : "";
if (API_URL === undefined) throw new Error("API_URL is not set");

export const DOCUMENT_URL = `${API_URL}/api/documents/`;
export const AGENT_URL = `${API_URL}/api/chat/`;
