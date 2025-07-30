"use client"
import React, { useState, useEffect, useRef } from 'react'
import { format, addDays, subDays, isToday, isSameDay } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
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

// --- CHANGED: The placeholder text is now highly specific to the CNC client's use case ---
const logPlaceholderText = `记录今日工单状态，一行一个...

例如:
YNMX-2025-06-07: 质检失败 (主轴跳动超公差)
YNMX-2025-07-21: 加工中 
YNMX-2025-04-20: 等待物料
`

// --- END CHANGE ---

export default function JournalApp() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [entries, setEntries] = useState<Record<string, JournalEntry>>({})
  const [currentContent, setCurrentContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const dateKey = format(selectedDate, 'yyyy-MM-dd')

  useEffect(() => {
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
  }, [dateKey, selectedDate])

  useEffect(() => {
    const entry = entries[dateKey]
    setCurrentContent(entry?.content || '')
  }, [selectedDate, entries, dateKey])

  useEffect(() => {
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
  }, [currentContent, dateKey, selectedDate])

  const navigateDate = (direction: 'prev' | 'next') => {
    setSelectedDate(current => 
      direction === 'prev' ? subDays(current, 1) : addDays(current, 1)
    )
  }

  const goToToday = () => {
    setSelectedDate(new Date())
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-medium text-gray-900">Daily Production Log</h1>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigateDate('prev')} className="h-8 w-8 rounded-full hover:bg-gray-100">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className={cn("h-8 px-3 rounded-full hover:bg-gray-100 font-medium", isToday(selectedDate) && "text-blue-600")}>
                    <Calendar className="h-3.5 w-3.5 mr-2" />
                    {isToday(selectedDate) ? 'Today' : format(selectedDate, 'MMM d, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent mode="single" selected={selectedDate} onSelect={(date) => date && setSelectedDate(date)} disabled={(date) => date > new Date()} className="rounded-md" />
                </PopoverContent>
              </Popover>
              <Button variant="ghost" size="icon" onClick={() => navigateDate('next')} disabled={isSameDay(selectedDate, new Date())} className="h-8 w-8 rounded-full hover:bg-gray-100 disabled:opacity-30">
                <ChevronRight className="h-4 w-4" />
              </Button>
              {!isToday(selectedDate) && (
                <Button variant="ghost" size="sm" onClick={goToToday} className="ml-2 h-8 px-3 rounded-full hover:bg-gray-100 text-sm">
                  Today
                </Button>
              )}
            </div>
            <div className="w-20 flex justify-end">
              <AnimatePresence mode="wait">
                {isSaving && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-gray-400">Saving...</motion.span>}
                {showSaved && !isSaving && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-green-600">Saved</motion.span>}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>
      <main className="pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-6">
          <AnimatePresence mode="wait">
            <motion.div key={dateKey} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="mt-8">
              <div className="mb-6">
                <h2 className="text-3xl font-light text-gray-900">{format(selectedDate, 'EEEE')}</h2>
                <p className="text-lg text-gray-500 mt-1">{format(selectedDate, 'MMMM d, yyyy')}</p>
                <p className="text-sm text-gray-500 mt-2 font-mono">
                  Format: <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded-sm">ORDER_ID: Status message</code>
                </p>
              </div>
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={currentContent}
                  onChange={(e) => setCurrentContent(e.target.value)}
                  placeholder={logPlaceholderText}
                  className={cn(
                    "min-h-[60vh] w-full resize-none",
                    "text-gray-900 placeholder:text-gray-400/80 placeholder:whitespace-pre-wrap",
                    "border-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                    "text-base leading-relaxed font-mono",
                    "bg-transparent"
                  )}
                  style={{ fontSize: '15px', lineHeight: '1.75' }}
                />
                {currentContent && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute bottom-4 right-4 text-xs text-gray-400 font-sans">
                    {currentContent.split('\n').filter(line => line.trim() !== '').length} entries
                  </motion.div>
                )}
              </div>
              {entries[dateKey]?.lastModified && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 text-xs text-gray-400">
                  Last updated {format(entries[dateKey].lastModified, 'h:mm a')}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}