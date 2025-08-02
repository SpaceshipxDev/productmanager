"use client";

import React, { useState, useEffect, useRef } from 'react';
import { format, addDays, subDays, isToday, isSameDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, LogOut, BarChart3, NotebookPen } from 'lucide-react';
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
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
                Estara
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
