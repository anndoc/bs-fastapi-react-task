import { useState } from "react";
import { Bot } from "lucide-react";
import AssistantMessage, {
  type AssistantMessageData,
} from "@/components/agent/assistant-message";
import UserMessage, {
  type UserMessageData,
} from "@/components/agent/user-message";
import Form from "@/components/agent/form";
import Header from "@/components/agent/header";

type ChatMessage =
  | ({ id: number; role: "user" } & UserMessageData)
  | ({ id: number; role: "assistant" } & AssistantMessageData);

const initialMessages: ChatMessage[] = [
  {
    id: 1,
    role: "user",
    content: "What are the main features of our product?",
    time: "9:45 AM",
  },
  {
    id: 2,
    role: "assistant",
    content:
      "Based on the documentation, our product offers the following key features:\n\n•  Advanced analytics and reporting\n•  Seamless integration with third-party tools\n•  Scalable architecture for growing teams\n•  Strong security and data privacy\n\nFor more details, please see the Product Documentation (pages 12–14).",
    time: "9:45 AM",
    sources: [
      { name: "Product Documentation.pdf", pages: "pp. 12–13" },
      { name: "Product Documentation.pdf", pages: "p. 14" },
    ],
  },
  {
    id: 3,
    role: "user",
    content: "Can you tell me more about the integration options?",
    time: "9:47 AM",
  },
];

export default function Chat() {
  const [messages, setMessages] = useState(initialMessages);
  const [question, setQuestion] = useState("");

  const sendQuestion = () => {
    const value = question.trim();
    if (!value) return;
    const now = new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
    setMessages((current) => [
      ...current,
      { id: Date.now(), role: "user", content: value, time: now },
    ]);
    setQuestion("");
  };
  const newChat = () => {
    setMessages([]);
    setQuestion("");
  };

  return (
    <section className="flex min-h-[700px] min-w-0 flex-col">
      <Header onNewChat={newChat} />
      <div className="flex-1 space-y-7 overflow-y-auto px-5 py-7 sm:px-7">
        {messages.length === 0 && (
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
      </div>
      <Form
        value={question}
        onValueChange={setQuestion}
        onSend={sendQuestion}
      />
    </section>
  );
}
