import { UserRound } from "lucide-react";
import type { UserMessageData } from "@/components/agent/types";

type UserMessageProps = {
  message: UserMessageData;
};

export default function UserMessage({ message }: UserMessageProps) {
  return (
    <div className="flex items-start justify-end gap-3">
      <div className="max-w-[min(720px,88%)]">
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-4 text-sm leading-relaxed shadow-sm">
          <p className="whitespace-pre-line">{message.content}</p>
        </div>
      </div>
      <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <UserRound className="h-6 w-6" />
      </div>
    </div>
  );
}
