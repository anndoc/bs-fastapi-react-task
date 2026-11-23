import type { Route } from "./+types/home";
import DocumentPanel from "@/components/documents/panel";
import Chat from "@/components/agent/chat";
import { documentList } from "@/lib/documents/api";
import { history } from "@/lib/agent/api";

export async function loader() {
  const [documents, chatHistory] = await Promise.all([
    documentList(),
    history(),
  ]);
  return { documents, chatHistory };
}

export function meta() {
  return [
    { title: "RAG Assistant" },
    { name: "description", content: "RAG Assistant" },
  ];
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <DocumentPanel initialDocuments={loaderData.documents} />
      <Chat initialChatHistory={loaderData.chatHistory} />
    </>
  );
}
