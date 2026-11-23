import { useState } from "react";
import { Bot, ChevronDown, ChevronUp } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { AssistantMessageData } from "@/components/agent/types";

export type AssistantMessageProps = {
  message: AssistantMessageData;
};

export default function AssistantMessage({ message }: AssistantMessageProps) {
  const [sourcesOpen, setSourcesOpen] = useState(true);

  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">
        <Bot className="h-6 w-6" />
      </div>
      <div className="max-w-[min(720px,88%)]">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-relaxed shadow-sm">
          <p
            className={
              message.error
                ? "whitespace-pre-line text-rose-600"
                : "whitespace-pre-line"
            }
          >
            {message.content}
          </p>
          {message.sources && (
            <Collapsible
              open={sourcesOpen}
              onOpenChange={setSourcesOpen}
              className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/80"
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-3 text-left text-xs font-semibold hover:bg-slate-100">
                <span className="flex items-center gap-2">
                  {sourcesOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  Sources ({message.sources.length})
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="divide-y divide-slate-200 rounded-lg border-t border-slate-200 bg-white">
                  {message.sources.map((source) => (
                    <div
                      key={`${source.name}-${source.pages}`}
                      className="flex items-center justify-between gap-3 px-3 py-2.5 text-xs"
                    >
                      <span className="truncate font-medium text-slate-700">
                        {source.name}
                      </span>
                      <span className="shrink-0 text-slate-500">
                        Pages: {source.pages}
                      </span>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>
    </div>
  );
}
