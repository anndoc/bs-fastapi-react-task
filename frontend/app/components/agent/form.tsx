import { Paperclip, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function Form({
  value,
  onValueChange,
  onSend,
}: {
  value: string;
  onValueChange: (value: string) => void;
  onSend: () => void;
}) {
  return (
    <div className="border-t border-slate-100 p-5 sm:px-7 sm:py-6">
      <div className="flex items-end gap-2 rounded-2xl border border-slate-300 bg-white p-2 shadow-sm focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
        <Textarea
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSend();
            }
          }}
          placeholder="Type your question..."
          rows={1}
          className="max-h-36 min-h-11 resize-none border-0 shadow-none focus-visible:ring-0"
        />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Attach file"
          className="mb-0.5 shrink-0 text-slate-500"
        >
          <Paperclip className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          aria-label="Send message"
          onClick={onSend}
          disabled={!value.trim()}
          className="mb-0.5 shrink-0 bg-indigo-600 hover:bg-indigo-700"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <p className="mt-2 text-center text-[11px] text-slate-400">
        AI responses are generated from your uploaded documents.
      </p>
    </div>
  );
}
