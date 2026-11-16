import type { Route } from "./+types/home";
import DocumentPanel from "@/components/documents/panel";
import Chat from "@/components/agent/chat";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "RAG Assistant" },
    { name: "description", content: "RAG Assistant" },
  ];
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f7f8fc] p-3 text-slate-950 md:p-4">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1800px] grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[minmax(340px,430px)_minmax(0,1fr)]">
        <DocumentPanel />
        <Chat />
      </div>
    </div>
  );
}
