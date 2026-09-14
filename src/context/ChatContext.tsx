"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  ReactNode,
} from "react";

export interface Message {
  id: number;
  sender: "user" | "ai";
  text: string;
}

interface ChatContextType {
  messages: Message[];
  isTyping: boolean;
  sendMessage: (text: string) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({
  children,
}: {
  children: ReactNode;
}) {
  const nextId = useRef(2);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "ai",
      text: "Hello! I'm MediConnect AI. How can I help you today?",
    },
  ]);

  const [isTyping, setIsTyping] = useState(false);

  function sendMessage(text: string) {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: nextId.current++,
      sender: "user",
      text,
    };

    setMessages((prev) => [...prev, userMessage]);

    setIsTyping(true);

    setTimeout(() => {
      const aiMessage: Message = {
        id: nextId.current++,
        sender: "ai",
        text:
          "This is a temporary AI response. Later this will come from OpenAI or Gemini.",
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  }

  return (
    <ChatContext.Provider
      value={{
        messages,
        isTyping,
        sendMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error("useChat must be used inside ChatProvider");
  }

  return context;
}