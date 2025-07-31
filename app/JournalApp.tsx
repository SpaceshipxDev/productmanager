"use client"

import React, { useState, useEffect, useRef } from 'react'
import { format, addDays, subDays, isToday, isSameDay } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar, LogOut, ArrowUp, BarChart3, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"

interface JournalEntry {
  date: Date
  content: string
  lastModified: Date
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

const logPlaceholderText = `记录今日工单状态，一行一个...

YNMX-2025-06-07: 质检失败 (主轴跳动超公差)
YNMX-2025-07-21: 加工中
YNMX-2025-04-20: 等待物料
`

export default function ManagementApp() {
  const [currentView, setCurrentView] = useState<'journal' | 'management'>('journal')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [entries, setEntries] = useState<Record<string, JournalEntry>>({})
  const [currentContent, setCurrentContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Management AI state
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "I can help you analyze performance metrics, review team data, and provide strategic insights. What would you like to explore?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const dateKey = format(selectedDate, 'yyyy-MM-dd')

  // Journal effects
  useEffect(() => {
    if (currentView !== 'journal') return
    
    async function loadNote() {
      try {
        const res = await fetch(`/api/notes?date=${dateKey}`)
        if (res.ok) {
          const data = await res.json()
          if (data.note) {
            setEntries(prev => ({
              ...prev,
              [dateKey]: {
                date: selectedDate,
                content: data.note.content as string,
                lastModified: new Date(data.note.lastModified)
              }
            }))
          } else {
            setEntries(prev => {
              const next = { ...prev }
              delete next[dateKey]
              return next
            })
          }
        }
      } catch {}
    }
    loadNote()
  }, [dateKey, selectedDate, currentView])

  useEffect(() => {
    const entry = entries[dateKey]
    setCurrentContent(entry?.content || '')
  }, [selectedDate, entries, dateKey])

  useEffect(() => {
    if (currentView !== 'journal') return
    if (currentContent === (entries[dateKey]?.content || '')) return

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    setIsSaving(true)
    saveTimeoutRef.current = setTimeout(() => {
      setEntries(prev => ({
        ...prev,
        [dateKey]: {
          date: selectedDate,
          content: currentContent,
          lastModified: new Date()
        }
      }))
      fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateKey, content: currentContent })
      }).catch(() => {})
      setIsSaving(false)
      setShowSaved(true)
      setTimeout(() => setShowSaved(false), 2000)
    }, 500)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [currentContent, dateKey, selectedDate, currentView])

  // Management AI effects
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (currentView === 'management') {
      scrollToBottom()
    }
  }, [messages, currentView])

  // Journal methods
  const navigateDate = (direction: 'prev' | 'next') => {
    setSelectedDate(current =>
      direction === 'prev' ? subDays(current, 1) : addDays(current, 1)
    )
  }

  const goToToday = () => {
    setSelectedDate(new Date())
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' })
    } finally {
      location.href = '/login'
    }
  }

  // Management AI methods
  const handleAISubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Based on the Q3 data, here are the key insights:\n\nRevenue Performance\nTotal revenue increased by 23% YoY to $4.2M, driven primarily by Enterprise segment growth (+45%). The SMB segment showed modest growth at 12%.\n\nTeam Efficiency\nEngineering velocity improved by 18% after implementing the new sprint structure. Customer success team reduced average resolution time from 48h to 24h. Sales cycle shortened by 5 days on average.\n\nRisk Factors\nCustomer churn in the SMB segment increased to 8.2% (target: <5%). Technical debt accumulation in the core platform requires attention. Hiring pipeline for senior roles remains challenging.\n\nWould you like me to dive deeper into any of these areas or analyze specific metrics?`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])
      setIsLoading(false)
    }, 1500)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleAISubmit(e)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-gray-200/50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo/Title */}
            <div className="flex items-center">
              <h1 className="text-[15px] font-semibold text-gray-900 tracking-tight">
                Production Control
              </h1>
            </div>

            {/* Center: Navigation Pills */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative bg-gray-100/80 rounded-full p-1 backdrop-blur">
                <div 
                  className={cn(
                    "absolute inset-y-1 rounded-full bg-white shadow-sm transition-all duration-300 ease-out",
                    currentView === 'journal' ? "left-1 right-1/2" : "left-1/2 right-1"
                  )}
                />
                <div className="relative flex items-center gap-1">
                  <button
                    onClick={() => setCurrentView('journal')}
                    className={cn(
                      "flex items-center gap-1.5 px-5 py-2 rounded-full text-[13px] font-medium transition-all duration-300",
                      currentView === 'journal' 
                        ? "text-gray-900" 
                        : "text-gray-500 hover:text-gray-700"
                    )}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Daily Log</span>
                  </button>
                  <button
                    onClick={() => setCurrentView('management')}
                    className={cn(
                      "flex items-center gap-1.5 px-5 py-2 rounded-full text-[13px] font-medium transition-all duration-300",
                      currentView === 'management' 
                        ? "text-gray-900" 
                        : "text-gray-500 hover:text-gray-700"
                    )}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Management</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center">
              <AnimatePresence mode="wait">
                {currentView === 'journal' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-2 mr-3"
                  >
                    {/* Date Navigation */}
                    <div className="flex items-center bg-gray-50 rounded-lg">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigateDate('prev')}
                        className="h-8 w-8 rounded-lg hover:bg-gray-100/80"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                      
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            className={cn(
                              "h-8 px-3 rounded-lg hover:bg-gray-100/80 font-medium text-[13px] min-w-[120px]",
                              isToday(selectedDate) && "text-blue-600"
                            )}
                          >
                            {isToday(selectedDate) ? 'Today' : format(selectedDate, 'MMM d, yyyy')}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                          <CalendarComponent
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => date && setSelectedDate(date)}
                            disabled={(date) => date > new Date()}
                            className="rounded-md"
                          />
                        </PopoverContent>
                      </Popover>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigateDate('next')}
                        disabled={isSameDay(selectedDate, new Date())}
                        className="h-8 w-8 rounded-lg hover:bg-gray-100/80 disabled:opacity-30"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* Save Status */}
                    <div className="flex items-center h-8 px-3 min-w-[70px]">
                      <AnimatePresence mode="wait">
                        {isSaving && (
                          <motion.span
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            className="text-[11px] font-medium text-gray-400"
                          >
                            Saving...
                          </motion.span>
                        )}
                        {showSaved && !isSaving && (
                          <motion.span
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            className="text-[11px] font-medium text-green-600"
                          >
                            Saved
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Logout */}
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

      {/* Main content */}
      <AnimatePresence mode="wait">
        {currentView === 'journal' ? (
          <motion.main
            key="journal"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="pt-24 pb-12"
          >
            <div className="max-w-4xl mx-auto px-6">
              <div className="mt-8">
                <div className="mb-8">
                  <h2 className="text-3xl font-extralight text-gray-900 tracking-tight">{format(selectedDate, 'EEEE')}</h2>
                  <p className="text-lg text-gray-500 mt-1 font-light">{format(selectedDate, 'MMMM d, yyyy')}</p>
                </div>
                <div className="relative">
                  <Textarea
                    ref={textareaRef}
                    value={currentContent}
                    onChange={(e) => setCurrentContent(e.target.value)}
                    placeholder={logPlaceholderText}
                    className={cn(
                      "min-h-[60vh] w-full resize-none",
                      "text-gray-900 placeholder:text-gray-400/70 placeholder:whitespace-pre-wrap",
                      "border-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                      "text-[15px] leading-relaxed font-mono",
                      "bg-transparent"
                    )}
                  />
                  {currentContent && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute bottom-4 right-4 text-xs text-gray-400 font-sans"
                    >
                      {currentContent.split('\n').filter(line => line.trim() !== '').length} entries
                    </motion.div>
                  )}
                </div>
                {entries[dateKey]?.lastModified && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-8 text-xs text-gray-400"
                  >
                    Last updated {format(entries[dateKey].lastModified, 'h:mm a')}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.main>
        ) : (
          <motion.div
            key="management"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex flex-col h-screen pt-16 bg-[#fafafa]"
          >
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
                          const isHeading = !paragraph.includes('.') && paragraph.length < 50
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
                          )
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
              <form onSubmit={handleAISubmit} className="max-w-[680px] mx-auto px-4 py-5">
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
                      const target = e.target as HTMLTextAreaElement
                      target.style.height = "auto"
                      target.style.height = `${Math.min(target.scrollHeight, 120)}px`
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}