"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ArrowUp, LogOut, BarChart3, NotebookPen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isProcessing) return;

    setIsProcessing(true);

    const newEntry: Entry = {
      id: Date.now().toString(),
      query: query.trim(),
      response: "Processing your query...",
      timestamp: new Date(),
    };

    setEntries(prev => [newEntry, ...prev]);
    setQuery("");

    setTimeout(() => {
      setEntries(prev =>
        prev.map(entry =>
          entry.id === newEntry.id
            ? {
                ...entry,
                response:
                  "This is where the AI response would appear. The interface maintains a clean, information-focused design.",
              }
            : entry
        )
      );
      setIsProcessing(false);
    }, 1500);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [entries]);

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
              <h1 className="text-[15px] font-medium text-gray-600 tracking-tight">Estara</h1>
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
                    <NotebookPen className="w-3.5 h-3.5" />
                    <span>日志</span>
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
                    <span>管理</span>
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
                退出
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 pt-24 pb-32">
        {entries.length === 0 ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-8">
            <div className="space-y-2 text-center">
              <h1 className="text-4xl font-light tracking-tight text-gray-900">Ask anything</h1>
              <p className="text-lg text-gray-500">Precise answers to complex questions</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-12">
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
                  className="rounded-2xl border border-gray-200 px-5 py-3 text-sm text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-12rem)]" ref={scrollRef}>
            <div className="space-y-12 pb-8">
              {entries.map((entry, index) => (
                <article
                  key={entry.id}
                  className={cn("group relative")}
                  onMouseEnter={() => setFocusedIndex(index)}
                  onMouseLeave={() => setFocusedIndex(null)}
                >
                  <div className="space-y-4">
                    <h2 className="text-xl font-medium text-gray-900">{entry.query}</h2>
                    <div className="prose prose-gray max-w-none">
                      <p className="text-gray-600 leading-relaxed">{entry.response}</p>
                    </div>
                    <time className="text-xs text-gray-400">
                      {entry.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </div>
                  <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-gray-50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                </article>
              ))}
            </div>
          </ScrollArea>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-4xl px-6 py-6">
          <form onSubmit={handleSubmit} className="relative">
            <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question..."
              className="h-14 w-full rounded-full border-gray-200 bg-gray-50 pl-14 pr-14 text-base transition-all placeholder:text-gray-400 focus:bg-white focus:border-gray-300 focus:ring-0 focus:ring-offset-0"
              disabled={isProcessing}
            />
            <div
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-200",
                query ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"
              )}
            >
              {isProcessing ? (
                <div className="flex h-8 w-8 items-center justify-center">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                </div>
              ) : (
                <button
                  type="submit"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-all hover:bg-gray-200 hover:text-gray-900"
                  aria-label="Submit query"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>
          <div className="mt-2 text-center text-xs text-gray-400">Press Enter to search</div>
        </div>
      </div>
    </div>
  );
}

