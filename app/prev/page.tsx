"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function ManagementAI() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "I can help you analyze performance metrics, review team data, and provide strategic insights. What would you like to explore?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Based on the Q3 data, here are the key insights:\n\nRevenue Performance\nTotal revenue increased by 23% YoY to $4.2M, driven primarily by Enterprise segment growth (+45%). The SMB segment showed modest growth at 12%.\n\nTeam Efficiency\nEngineering velocity improved by 18% after implementing the new sprint structure. Customer success team reduced average resolution time from 48h to 24h. Sales cycle shortened by 5 days on average.\n\nRisk Factors\nCustomer churn in the SMB segment increased to 8.2% (target: <5%). Technical debt accumulation in the core platform requires attention. Hiring pipeline for senior roles remains challenging.\n\nWould you like me to dive deeper into any of these areas or analyze specific metrics?`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#fafafa]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[680px] mx-auto px-4 py-20 space-y-10">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={cn(
                "animate-in fade-in-0 duration-500",
                index === 0 && "mt-20"
              )}
            >
              {message.role === "user" ? (
                <div className="flex justify-end">
                  <div className="max-w-[85%]">
                    <div className="text-[15px] text-[#000000] font-medium leading-[1.5] tracking-[-0.02em]">
                      {message.content}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {message.content.split('\n\n').map((paragraph, idx) => {
                    const isHeading = !paragraph.includes('.') && paragraph.length < 50;
                    return isHeading ? (
                      <h3 key={idx} className="text-[14px] font-semibold text-[#000000] tracking-[0.02em] uppercase mt-8 mb-3 opacity-90">
                        {paragraph}
                      </h3>
                    ) : (
                      <p key={idx} className="text-[15px] text-[#333333] leading-[1.65] tracking-[-0.01em] font-light">
                        {paragraph}
                      </p>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start animate-in fade-in-0 duration-500">
              <div className="flex items-center gap-4">
                <div className="w-1 h-4 bg-[#000000] rounded-full animate-pulse opacity-20" />
                <div className="w-1 h-4 bg-[#000000] rounded-full animate-pulse opacity-20 [animation-delay:200ms]" />
                <div className="w-1 h-4 bg-[#000000] rounded-full animate-pulse opacity-20 [animation-delay:400ms]" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-[#f0f0f0]">
        <form onSubmit={handleSubmit} className="max-w-[680px] mx-auto px-4 py-5">
          <div className="relative flex items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              rows={1}
              className="flex-1 resize-none bg-transparent text-[16px] placeholder-[#999999] focus:outline-none font-light tracking-[-0.01em] leading-[1.4] pr-12"
              style={{
                minHeight: "24px",
                maxHeight: "120px",
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={cn(
                "absolute right-0 bottom-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300",
                input.trim() && !isLoading
                  ? "bg-[#000000] text-white opacity-100 scale-100"
                  : "bg-[#f5f5f5] text-[#cccccc] opacity-0 scale-90"
              )}
            >
              <ArrowUp className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}