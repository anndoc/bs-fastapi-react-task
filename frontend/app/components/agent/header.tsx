import { MessageCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header({ onNewChat }: { onNewChat: () => void }) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-7">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-800">
          <MessageCircle className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-bold">AI Chat</h2>
          <p className="mt-1 truncate text-sm text-slate-600">
            Ask questions about your documents and get answers with references.
          </p>
        </div>
      </div>
      <Button variant="outline" className="shrink-0 gap-2" onClick={onNewChat}>
        <Plus className="h-4 w-4" />
        New Chat
      </Button>
    </header>
  );
}
