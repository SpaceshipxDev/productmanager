"use client";

import React, { useState, useEffect, useRef } from 'react';
import { LogOut, ArrowUp, BarChart3, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface TupleItem {
  id: string;
  summary: string;
}
 
export default function ManagementApp() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "I can help you analyze performance metrics, review team data, and provide strategic insights. What would you like to explore?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tuples, setTuples] = useState<TupleItem[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/smarttuple');
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setTuples(data.tuples || []);
        }
      } catch {}
    }
    load();
    const id = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const handleAISubmit = async (e: React.FormEvent) => {
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

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMessage.content })
      });
      const data = await res.json();
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.text || data.error || 'Error communicating with AI',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Failed to contact AI service.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAISubmit(e);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } finally {
      location.href = '/login';
    }
  };

  const pathname = usePathname();
  const currentView = pathname.startsWith('/management') ? 'management' : 'journal';

  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-gray-200/50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-[15px] font-medium text-gray-600 tracking-tight">
                Production Control
              </h1>
            </div>

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative bg-gray-100/80 rounded-full p-1 backdrop-blur">
                <div
                  className={cn(
                    'absolute inset-y-1 rounded-full bg-white shadow-sm transition-all duration-300 ease-out',
                    currentView === 'journal' ? 'left-1 right-1/2' : 'left-1/2 right-1'
                  )}
                />
                <div className="relative flex items-center gap-1">
                  <Link
                    href="/notes"
                    className={cn(
                      'flex items-center gap-1.5 px-5 py-2 rounded-full text-[13px] font-medium transition-all duration-300',
                      currentView === 'journal'
                        ? 'text-gray-900'
                        : 'text-gray-500 hover:text-gray-700'
                    )}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Daily Log</span>
                  </Link>
                  <Link
                    href="/management"
                    className={cn(
                      'flex items-center gap-1.5 px-5 py-2 rounded-full text-[13px] font-medium transition-all duration-300',
                      currentView === 'management'
                        ? 'text-gray-900'
                        : 'text-gray-500 hover:text-gray-700'
                    )}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Management</span>
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="h-8 px-3 rounded-lg hover:bg-gray-100/80 text-[13px] font-medium text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col h-screen pt-16 bg-[#fafafa]">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[680px] mx-auto px-4 py-20 space-y-10">
            {tuples.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-2">Smart Tuples</h2>
                <ul className="space-y-1 text-sm text-gray-700">
                  {tuples.map(t => (
                    <li key={t.id} className="flex gap-2">
                      <span className="font-mono font-medium">{t.id}</span>
                      <span className="flex-1">{t.summary}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={cn(
                  'animate-in fade-in-0 duration-500',
                  index === 0 && 'mt-20'
                )}
              >
                {message.role === 'user' ? (
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
                        <h3
                          key={idx}
                          className="text-[14px] font-semibold text-[#000000] tracking-[0.02em] uppercase mt-8 mb-3 opacity-90"
                        >
                          {paragraph}
                        </h3>
                      ) : (
                        <p
                          key={idx}
                          className="text-[15px] text-[#333333] leading-[1.65] tracking-[-0.01em] font-light"
                        >
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

        <div className="bg-white border-t border-[#f0f0f0]">
          <form onSubmit={handleAISubmit} className="max-w-[680px] mx-auto px-4 py-5">
            <div className="relative flex items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything..."
                rows={1}
                className="flex-1 resize-none bg-transparent text-[16px] placeholder-[#999999] focus:outline-none font-light tracking-[-0.01em] leading-[1.4] pr-12"
                style={{ minHeight: '24px', maxHeight: '120px' }}
                onInput={e => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={cn(
                  'absolute right-0 bottom-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300',
                  input.trim() && !isLoading
                    ? 'bg-[#000000] text-white opacity-100 scale-100'
                    : 'bg-[#f5f5f5] text-[#cccccc] opacity-0 scale-90'
                )}
              >
                <ArrowUp className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
