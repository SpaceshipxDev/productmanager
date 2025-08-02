"use client"

import { useState, useRef, useEffect } from "react"
import { Search, Sparkles, Command, ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Entry {
  id: string
  query: string
  response: string
  timestamp: Date
}

export default function Page() {
  const [query, setQuery] = useState("")
  const [entries, setEntries] = useState<Entry[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || isProcessing) return

    setIsProcessing(true)
    
    // Simulate AI processing
    const newEntry: Entry = {
      id: Date.now().toString(),
      query: query.trim(),
      response: "Processing your query...",
      timestamp: new Date()
    }
    
    setEntries(prev => [newEntry, ...prev])
    setQuery("")
    
    // Simulate API call
    setTimeout(() => {
      setEntries(prev => 
        prev.map(entry => 
          entry.id === newEntry.id 
            ? { ...entry, response: "This is where the AI response would appear. The interface maintains a clean, information-focused design inspired by Apple's design philosophy." }
            : entry
        )
      )
      setIsProcessing(false)
    }, 1500)
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [entries])

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="rounded-full bg-gray-900 p-1.5">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-900">Intelligence</span>
            </div>
            <div className="flex items-center space-x-1 text-xs text-gray-400">
              <Command className="h-3 w-3" />
              <span>K</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-6 pt-24 pb-32">
        {entries.length === 0 ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-8">
            <div className="space-y-2 text-center">
              <h1 className="text-4xl font-light tracking-tight text-gray-900">
                Ask anything
              </h1>
              <p className="text-lg text-gray-500">
                Precise answers to complex questions
              </p>
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
                    setQuery(suggestion)
                    inputRef.current?.focus()
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
                  className={cn(
                    "group relative transition-all duration-300",
                    focusedIndex === index && "scale-[1.02]"
                  )}
                  onMouseEnter={() => setFocusedIndex(index)}
                  onMouseLeave={() => setFocusedIndex(null)}
                >
                  <div className="space-y-4">
                    <h2 className="text-xl font-medium text-gray-900">
                      {entry.query}
                    </h2>
                    <div className="prose prose-gray max-w-none">
                      <p className="text-gray-600 leading-relaxed">
                        {entry.response}
                      </p>
                    </div>
                    <time className="text-xs text-gray-400">
                      {entry.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
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

      {/* Search Bar */}
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
          <div className="mt-2 text-center text-xs text-gray-400">
            Press Enter to search
          </div>
        </div>
      </div>

      {/* Keyboard shortcut handler */}
      <div className="sr-only" aria-live="polite">
        Press Command+K to focus search
      </div>
    </div>
  )
}