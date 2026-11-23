import { MessageCircle, Plus, RotateCcwClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { type ChatSession } from "@/components/agent/types";
import { formatRelativeTime } from "@/lib/format";

export type HeaderProps = {
  onNewChat: () => void;
  chatSessions: ChatSession[];
  sessionId: string | null;
  onSelectSession: (sessionId: string) => void;
};

export default function Header({
  onNewChat,
  chatSessions,
  sessionId,
  onSelectSession,
}: HeaderProps) {
  const selectedChat = chatSessions.find((chat) => chat.id === sessionId);

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
      <div className="flex shrink-0 items-center gap-2">
        {chatSessions.length > 0 && (
          <Select
            value={sessionId}
            onValueChange={(value: string | null) => {
              if (value !== null) onSelectSession(value);
            }}
          >
            <Tooltip>
              <TooltipTrigger
                render={<SelectTrigger size="sm" className="max-w-80" />}
              >
                <SelectValue>
                  {selectedChat ? (
                    <span className="truncate">{selectedChat.title}</span>
                  ) : (
                    <RotateCcwClock />
                  )}
                </SelectValue>
              </TooltipTrigger>
              <TooltipContent>{selectedChat?.title}</TooltipContent>
            </Tooltip>
            <SelectContent
              align="end"
              alignItemWithTrigger={false}
              className="w-max max-w-sm"
            >
              {chatSessions.map((chat) => (
                <SelectItem
                  key={chat.id}
                  value={chat.id}
                  className="py-1.5 pr-7 pl-2"
                >
                  <div className="flex w-full items-center justify-between gap-3">
                    <span className="min-w-0 max-w-60 truncate pl-1.5">
                      {chat.title}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatRelativeTime(chat.modified_at)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button
          variant="outline"
          className="shrink-0 gap-2"
          onClick={onNewChat}
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>
    </header>
  );
}
