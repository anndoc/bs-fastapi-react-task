import type { Route } from "./+types/home";
import DocumentPanel from "@/components/documents/panel";
import Chat from "@/components/agent/chat";
import { documentList } from "@/lib/documents/api";

export async function loader() {
  return { documents: await documentList() };
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
      <Chat />
    </>
  );
}
