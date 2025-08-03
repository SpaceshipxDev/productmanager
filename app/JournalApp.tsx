"use client";

import React, { useState, useEffect, useRef } from 'react';
import { format, addDays, subDays, isToday, isSameDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import Header from '@/components/header';

interface JournalEntry {
  date: Date;
  content: string;
  lastModified: Date;
}


const logPlaceholderText = `记录今日工单状态，一行一个...

YNMX-2025-06-07: 质检失败 (主轴跳动超公差)
YNMX-2025-07-21: 加工中
YNMX-2025-04-20: 等待物料
`;

export default function JournalApp() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [entries, setEntries] = useState<Record<string, JournalEntry>>({});
  const [currentContent, setCurrentContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const dateKey = format(selectedDate, 'yyyy-MM-dd');

  useEffect(() => {
    async function loadNote() {
      try {
        const res = await fetch(`/api/notes?date=${dateKey}`);
        if (res.ok) {
          const data = await res.json();
          if (data.note) {
            setEntries(prev => ({
              ...prev,
              [dateKey]: {
                date: selectedDate,
                content: data.note.content as string,
                lastModified: new Date(data.note.lastModified),
              },
            }));
          } else {
            setEntries(prev => {
              const next = { ...prev };
              delete next[dateKey];
              return next;
            });
          }
        }
      } catch {}
    }
    loadNote();
  }, [dateKey, selectedDate]);

  useEffect(() => {
    const entry = entries[dateKey];
    setCurrentContent(entry?.content || '');
  }, [selectedDate, entries, dateKey]);

  useEffect(() => {
    if (currentContent === (entries[dateKey]?.content || '')) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setIsSaving(true);
    saveTimeoutRef.current = setTimeout(() => {
      setEntries(prev => ({
        ...prev,
        [dateKey]: {
          date: selectedDate,
          content: currentContent,
          lastModified: new Date(),
        },
      }));
      fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateKey, content: currentContent }),
      }).catch(() => {});
      setIsSaving(false);
      setShowSaved(true);
    }, 500);


    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      setIsSaving(false);
    };
  }, [currentContent, dateKey, selectedDate]);

  const navigateDate = (direction: 'prev' | 'next') => {
    setSelectedDate(current =>
      direction === 'prev' ? subDays(current, 1) : addDays(current, 1)
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="pt-24 pb-12"
      >
        <div className="max-w-4xl mx-auto px-6">
          <div className="mt-8">
            <div className="mb-8">
              <h2 className="text-3xl font-light text-gray-900 tracking-tight">
                {format(selectedDate, 'EEEE', { locale: zhCN })}
              </h2>
              <p className="text-lg text-gray-500 mt-1 font-normal">
                {format(selectedDate, 'yyyy年M月d日', { locale: zhCN })}
              </p>
            </div>

            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateDate('prev')}
                  className="h-9 w-9 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100/80"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        'h-9 px-4 rounded-lg hover:bg-gray-100/80 font-medium text-[13px]',
                        isToday(selectedDate) ? 'text-black' : 'text-gray-700'
                      )}
                    >
                      {isToday(selectedDate) ? '今天' : format(selectedDate, 'yyyy年M月d日', { locale: zhCN })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
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
                  className="h-9 w-9 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100/80 disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center h-8 px-3 min-w-[70px]">
                <AnimatePresence mode="wait">
                  {isSaving && (
                    <motion.span
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="text-[11px] font-medium text-gray-400"
                    >
                      保存中...
                    </motion.span>
                  )}
                  {showSaved && !isSaving && (
                    <motion.span
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="text-[11px] font-medium text-green-600"
                    >
                      已保存
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={currentContent}
                onChange={(e) => setCurrentContent(e.target.value)}
                placeholder={logPlaceholderText}
                className={cn(
                  'min-h-[60vh] w-full resize-none',
                  'text-gray-900 placeholder:text-gray-400/70 placeholder:whitespace-pre-wrap',
                  'border-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0',
                  'text-[15px] leading-relaxed font-mono',
                  'bg-transparent'
                )}
              />
              {currentContent && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute bottom-4 right-4 text-xs text-gray-400 font-sans"
                >
                  {currentContent.split('\n').filter(line => line.trim() !== '').length} 条记录
                </motion.div>
              )}
            </div>
            {entries[dateKey]?.lastModified && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-8 text-xs text-gray-400"
              >
                最后更新 {format(entries[dateKey].lastModified, 'HH:mm')}
              </motion.div>
            )}
          </div>
        </div>
      </motion.main>
    </div>
  );
}
