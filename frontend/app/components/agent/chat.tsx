import { useRef, useState } from "react";
import { Bot } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import AssistantMessage from "@/components/agent/assistant-message";
import UserMessage from "@/components/agent/user-message";
import { type ChatMessage, type ChatSession } from "@/components/agent/types";
import Form from "@/components/agent/form";
import Header from "@/components/agent/header";
import { chat, detail } from "@/lib/agent/api";
import { groupSources, readEvents } from "@/lib/agent/utils";
import { formatTime } from "@/lib/format";

type ChatProps = {
  initialChatHistory: ChatSession[];
};

export default function Chat({ initialChatHistory }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState(initialChatHistory);
  const [question, setQuestion] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);
  const abortController = useRef<AbortController | null>(null);
  const latestDetailRequest = useRef(0);

  const sendQuestion = useMutation({
    mutationFn: async (query: string) => {
      const controller = new AbortController();
      abortController.current = controller;
      const time = formatTime(new Date());
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: query,
        time,
      };
      let answer: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        time,
      };

      setMessages((current) => [...current, userMessage]);
      try {
        const stream = await chat(query, sessionId, controller.signal);
        for await (const { event, data } of readEvents(stream)) {
          // Don't rely on reader.read() rejecting: a buffered event applied after
          // abort would leak into (or switch sessionId back from) the next chat.
          if (controller.signal.aborted) return;
          if (event === "init") {
            setSessionId(data.id);
            setChatHistory((current) => [
              data,
              ...current.filter((chat) => chat.id !== data.id),
            ]);
          } else if (event === "sources" && data.length > 0) {
            answer = { ...answer, sources: groupSources(data) };
          } else if (event === "text") {
            answer = { ...answer, content: answer.content + data };
          } else if (event === "stop") {
            answer = { ...answer, content: data, error: true };
          }
          setMessages((current) => [
            ...current.filter((message) => message.id !== answer.id),
            answer,
          ]);
        }
      } catch (error) {
        if (!controller.signal.aborted) throw error;
      }
    },
  });

  const send = () => {
    const value = question.trim();
    if (!value || sendQuestion.isPending) return;
    setQuestion("");
    setLoadFailed(false);
    sendQuestion.mutate(value);
  };
  const stop = () => abortController.current?.abort();
  const newChat = () => {
    stop();
    latestDetailRequest.current++;
    setMessages([]);
    setSessionId(null);
    setQuestion("");
    setLoadFailed(false);
    sendQuestion.reset();
  };
  const onSelectSession = async (sessionId: string) => {
    stop();
    setSessionId(sessionId);
    setMessages([]);
    setLoadFailed(false);
    sendQuestion.reset();
    const request = ++latestDetailRequest.current;
    try {
      const { messages } = await detail(sessionId);
      if (request !== latestDetailRequest.current) return;
      setMessages(
        messages.map(({ created_at, ...message }) => ({
          ...message,
          time: formatTime(created_at),
        })),
      );
    } catch {
      if (request === latestDetailRequest.current) setLoadFailed(true);
    }
  };

  return (
    <section className="flex min-h-[700px] min-w-0 flex-col lg:min-h-0">
      <Header
        onNewChat={newChat}
        chatSessions={chatHistory}
        sessionId={sessionId}
        onSelectSession={onSelectSession}
      />
      <div className="flex-1 space-y-7 overflow-y-auto px-5 py-7 sm:px-7">
        {messages.length === 0 && !loadFailed && (
          <div className="flex h-full min-h-64 flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-2xl bg-indigo-50 p-4 text-indigo-600">
              <Bot className="h-8 w-8" />
            </div>
            <h3 className="font-semibold">Start a conversation</h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Ask a question about your uploaded documents. Answers will include
              links to their sources.
            </p>
          </div>
        )}
        {messages.map((message) =>
          message.role === "user" ? (
            <UserMessage key={message.id} message={message} />
          ) : (
            <AssistantMessage key={message.id} message={message} />
          ),
        )}
        {loadFailed && (
          <p className="text-sm text-rose-600">Failed to load chat</p>
        )}
        {sendQuestion.error && (
          <p className="text-sm text-rose-600">{sendQuestion.error.message}</p>
        )}
      </div>
      <Form
        value={question}
        pending={sendQuestion.isPending}
        onValueChange={setQuestion}
        onSend={send}
        onStop={stop}
      />
    </section>
  );
}
