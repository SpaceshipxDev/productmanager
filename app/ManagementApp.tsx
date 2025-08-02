"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ArrowUp, LogOut, BarChart3, NotebookPen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Entry {
  id: string;
  query: string;
  response: string;
  timestamp: Date;
}

export default function ManagementApp() {
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isProcessing) return;

    setIsProcessing(true);

    const newEntry: Entry = {
      id: Date.now().toString(),
      query: query.trim(),
      response: "Processing your query...",
      timestamp: new Date(),
    };

    const history = entries
      .slice()
      .reverse()
      .flatMap(entry => [
        { role: "user" as const, text: entry.query },
        { role: "model" as const, text: entry.response },
      ]);

    setEntries(prev => [...prev, newEntry]);
    setQuery("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: newEntry.query, history }),
      });
      const data = await res.json();
      setEntries(prev =>
        prev.map(entry =>
          entry.id === newEntry.id
            ? {
                ...entry,
                response: data.text || "No response from AI.",
              }
            : entry
        )
      );
    } catch (err) {
      setEntries(prev =>
        prev.map(entry =>
          entry.id === newEntry.id
            ? { ...entry, response: "Error fetching response." }
            : entry
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector<HTMLDivElement>(
        '[data-slot="scroll-area-viewport"]'
      );
      if (viewport) {
        setTimeout(() => {
          viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
        }, 100);
      }
    }
  }, [entries.length]);

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
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/75 backdrop-blur-xl border-b border-gray-200/40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center">
              <h1 className="text-[15px] font-medium text-gray-800 tracking-tight">Estara</h1>
            </div>

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative bg-gray-100/50 rounded-full p-0.5 backdrop-blur">
                <div
                  className={cn(
                    'absolute inset-y-0.5 rounded-full bg-white shadow-sm transition-all duration-300 ease-out',
                    currentView === 'journal' ? 'left-0.5 right-1/2' : 'left-1/2 right-0.5'
                  )}
                />
                <div className="relative flex items-center">
                  <Link
                    href="/notes"
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-300',
                      currentView === 'journal'
                        ? 'text-gray-900'
                        : 'text-gray-500 hover:text-gray-700'
                    )}
                  >
                    <NotebookPen className="w-3.5 h-3.5" />
                    <span>日志</span>
                  </Link>
                  <Link
                    href="/management"
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-300',
                      currentView === 'management'
                        ? 'text-gray-900'
                        : 'text-gray-500 hover:text-gray-700'
                    )}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>管理</span>
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="h-8 px-3 rounded-lg hover:bg-gray-100/50 text-[13px] font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                退出
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[42rem] px-6 sm:px-8 pt-24 pb-32">
        {entries.length === 0 ? (
          <div className="flex min-h-[70vh] flex-col items-center justify-center">
            <div className="space-y-4 text-center mb-20">
              <h1 className="text-[64px] font-extralight tracking-tight text-gray-900 leading-none">
                Ask anything
              </h1>
              <p className="text-[18px] text-gray-500 font-normal">
                Precise answers to complex questions
              </p>
            </div>

            <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 w-full max-w-2xl">
              {[
                "Explain quantum computing",
                "History of the internet",
                "How does photosynthesis work"
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setQuery(suggestion);
                    inputRef.current?.focus();
                  }}
                  className="rounded-xl border border-gray-200/60 bg-white/40 px-5 py-3.5 text-[14px] text-gray-600 transition-all hover:border-gray-300 hover:bg-white hover:shadow-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-13rem)]" ref={scrollRef}>
            <div className="space-y-0 pb-12">
              {entries.map((entry, index) => (
                <article
                  key={entry.id}
                  className="border-b border-gray-200/40 last:border-0"
                >
                  <div className="py-16 first:pt-8">
                    <div className="mb-8">
                      <h2 className="text-[22px] font-semibold text-gray-900 leading-relaxed mb-2">
                        {entry.query}
                      </h2>
                      <time className="text-[13px] text-gray-400 font-normal">
                        {entry.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </time>
                    </div>
                    
                    <div className="prose prose-gray prose-lg max-w-none">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({children}) => <h1 className="text-[28px] font-semibold text-gray-900 mt-10 mb-5 leading-snug">{children}</h1>,
                          h2: ({children}) => <h2 className="text-[22px] font-semibold text-gray-900 mt-8 mb-4 leading-relaxed">{children}</h2>,
                          h3: ({children}) => <h3 className="text-[18px] font-semibold text-gray-900 mt-6 mb-3 leading-relaxed">{children}</h3>,
                          p: ({children}) => <p className="text-[17px] leading-[1.75] text-gray-700 mb-5 font-normal tracking-wide">{children}</p>,
                          ul: ({children}) => <ul className="my-6 space-y-3">{children}</ul>,
                          ol: ({children}) => <ol className="my-6 space-y-3">{children}</ol>,
                          li: ({children}) => <li className="text-[17px] leading-[1.75] text-gray-700 ml-7 font-normal tracking-wide">{children}</li>,
                          strong: ({children}) => <strong className="font-semibold text-gray-900">{children}</strong>,
                          em: ({children}) => <em className="italic text-gray-700">{children}</em>,
                          code: ({className, children, ...props}) => {
                            const match = /language-(\w+)/.exec(className || '');
                            return match ? (
                              <pre className="bg-gray-50/80 border border-gray-200/40 rounded-xl p-5 my-6 overflow-x-auto">
                                <code className="text-[15px] font-mono text-gray-800 leading-relaxed">{children}</code>
                              </pre>
                            ) : (
                              <code className="bg-gray-100/80 text-gray-800 px-1.5 py-0.5 rounded-md text-[15px] font-mono">{children}</code>
                            );
                          },
                          blockquote: ({children}) => (
                            <blockquote className="border-l-3 border-gray-300 pl-5 my-6 text-gray-600 italic">
                              {children}
                            </blockquote>
                          ),
                          a: ({children, href}) => (
                            <a href={href} className="text-blue-600 hover:text-blue-700 underline decoration-1 underline-offset-3 transition-colors" target="_blank" rel="noopener noreferrer">
                              {children}
                            </a>
                          ),
                          hr: () => <hr className="my-8 border-gray-200/60" />,
                        }}
                      >
                        {entry.response}
                      </ReactMarkdown>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </ScrollArea>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white/75 backdrop-blur-xl border-t border-gray-200/40">
        <div className="mx-auto max-w-[42rem] px-6 sm:px-8 py-5">
          <form onSubmit={handleSubmit} className="relative">
            <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question..."
              className="h-[52px] w-full rounded-full border-gray-200/60 bg-gray-50/40 pl-12 pr-12 text-[16px] transition-all placeholder:text-gray-400 focus:bg-white focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-0"
              disabled={isProcessing}
            />
            <div
              className={cn(
                "absolute right-2.5 top-1/2 -translate-y-1/2 transition-all duration-200",
                query ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"
              )}
            >
              {isProcessing ? (
                <div className="flex h-9 w-9 items-center justify-center">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                </div>
              ) : (
                <button
                  type="submit"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-white transition-all hover:bg-gray-800 hover:scale-105"
                  aria-label="Submit query"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        .prose pre {
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        
        .prose ul li::before {
          content: "•";
          color: #9CA3AF;
          font-weight: 400;
          display: inline-block;
          width: 1em;
          margin-left: -1em;
        }
        
        .prose ol {
          counter-reset: list-counter;
        }
        
        .prose ol li {
          counter-increment: list-counter;
        }
        
        .prose ol li::before {
          content: counter(list-counter) ".";
          color: #9CA3AF;
          font-weight: 400;
          display: inline-block;
          width: 1.5em;
          margin-left: -1.5em;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 10px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: #E5E7EB;
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #D1D5DB;
        }
      `}</style>
    </div>
  );
}