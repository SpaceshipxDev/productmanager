"use client";

import React, { useState, useEffect } from 'react';
import { LogOut, ChevronRight, Search, Filter, Plus, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, BarChart3 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SmartTuple {
  id: string;
  content: string;
  timestamp: Date;
  tags?: string[];
}

// Mock data generator
const generateMockTuples = (): SmartTuple[] => {
  const tuples: SmartTuple[] = [
    {
      id: "tuple-001",
      content: "YNMX-2025-06-07: Quality inspection failed due to spindle runout exceeding tolerance. Main shaft vibration detected at 0.08mm, tolerance is 0.05mm. Requires immediate recalibration of the CNC machine axis alignment system.",
      timestamp: new Date('2025-01-28T10:30:00'),
      tags: ["quality-control", "cnc", "urgent"]
    },
    {
      id: "tuple-002",
      content: "YNMX-2025-07-21: Currently in machining phase 3 of 5. Surface finishing operations underway. Expected completion by EOD. Material: Aluminum 6061-T6. Running at 80% optimal speed due to tool wear considerations.",
      timestamp: new Date('2025-01-28T09:15:00'),
      tags: ["in-progress", "aluminum", "phase-3"]
    },
    {
      id: "tuple-003",
      content: "YNMX-2025-04-20: Awaiting material delivery. Stainless steel 316L sheets delayed from supplier. New ETA: 2025-01-30. Production line 4 idle. Consider reallocating resources to backlog items.",
      timestamp: new Date('2025-01-28T08:45:00'),
      tags: ["pending", "materials", "delay"]
    },
    {
      id: "tuple-004",
      content: "Production efficiency report: Line 2 operating at 94% capacity. 127 units completed in last shift. Zero defects reported. Maintenance scheduled for next week.",
      timestamp: new Date('2025-01-27T16:30:00'),
      tags: ["report", "efficiency", "line-2"]
    },
    {
      id: "tuple-005",
      content: "Tool inventory alert: Carbide end mills running low. Current stock: 12 units. Recommended reorder point: 20 units. Auto-purchase order generated for approval.",
      timestamp: new Date('2025-01-27T14:20:00'),
      tags: ["inventory", "tools", "alert"]
    },
    {
      id: "tuple-006",
      content: "YNMX-2025-08-15: Completed successfully. Final inspection passed all parameters. Surface roughness: 0.8 μm Ra. Dimensional accuracy within ±0.02mm. Ready for shipping.",
      timestamp: new Date('2025-01-27T11:00:00'),
      tags: ["completed", "passed", "shipping-ready"]
    },
    {
      id: "tuple-007",
      content: "Shift handover notes: Machine 3 experiencing intermittent coolant flow issues. Temporary fix applied. Full maintenance required within 48 hours. All other systems operational.",
      timestamp: new Date('2025-01-26T22:00:00'),
      tags: ["maintenance", "coolant", "machine-3"]
    },
    {
      id: "tuple-008",
      content: "Customer specification update for order YNMX-2025-09-10: Tolerance tightened from ±0.05mm to ±0.03mm. Engineering review required. Estimated additional setup time: 2 hours.",
      timestamp: new Date('2025-01-26T15:30:00'),
      tags: ["specification", "customer", "review-needed"]
    }
  ];
  return tuples;
};

const formatTimestamp = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  
  if (hours < 1) {
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes}分钟前`;
  } else if (hours < 24) {
    return `${hours}小时前`;
  } else {
    const days = Math.floor(hours / 24);
    return `${days}天前`;
  }
};

export default function ManagementApp() {
  const [tuples, setTuples] = useState<SmartTuple[]>([]);
  const [expandedTuple, setExpandedTuple] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const pathname = usePathname();
  const currentView = pathname.startsWith('/management') ? 'management' : 'journal';

  useEffect(() => {
    // Simulate loading tuples
    setTuples(generateMockTuples());
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } finally {
      location.href = '/login';
    }
  };

  const filteredTuples = tuples.filter(tuple => {
    const matchesSearch = searchQuery === '' || 
      tuple.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tuple.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => tuple.tags?.includes(tag));
    
    return matchesSearch && matchesTags;
  });

  const allTags = Array.from(new Set(tuples.flatMap(t => t.tags || [])));

  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-gray-200/50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-[15px] font-medium text-gray-600 tracking-tight">
                生产控制
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
        <div className="max-w-7xl mx-auto px-6">
          {/* Search and Filter Bar */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索记录..."
                  className="pl-10 h-10 bg-gray-50/50 border-gray-200/50 rounded-lg text-[14px] placeholder:text-gray-400"
                />
              </div>
              <Button
                variant="ghost"
                className="h-10 px-4 rounded-lg hover:bg-gray-100/80 text-[13px] font-medium text-gray-600 hover:text-gray-900"
              >
                <Filter className="h-3.5 w-3.5 mr-2" />
                筛选
              </Button>
              <Button
                variant="ghost"
                className="h-10 px-4 rounded-lg hover:bg-gray-100/80 text-[13px] font-medium text-gray-600 hover:text-gray-900"
              >
                <Plus className="h-3.5 w-3.5 mr-2" />
                新建记录
              </Button>
            </div>

            {/* Tag filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    setSelectedTags(prev =>
                      prev.includes(tag)
                        ? prev.filter(t => t !== tag)
                        : [...prev, tag]
                    );
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[12px] font-medium transition-all",
                    selectedTags.includes(tag)
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100/80 text-gray-600 hover:bg-gray-200/80"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Tuples Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredTuples.map((tuple, index) => (
                <motion.div
                  key={tuple.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ 
                    duration: 0.2,
                    delay: index * 0.03,
                    layout: { duration: 0.3 }
                  }}
                  className={cn(
                    "group relative bg-white rounded-xl border border-gray-200/50 p-5",
                    "hover:border-gray-300/50 hover:shadow-sm",
                    "transition-all duration-200 cursor-pointer",
                    expandedTuple === tuple.id && "ring-2 ring-gray-900/10"
                  )}
                  onClick={() => setExpandedTuple(expandedTuple === tuple.id ? null : tuple.id)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-[13px] font-medium text-gray-900 mb-1">
                        {tuple.id}
                      </h3>
                      <p className="text-[11px] text-gray-500">
                        {formatTimestamp(tuple.timestamp)}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem className="text-[12px]">编辑</DropdownMenuItem>
                        <DropdownMenuItem className="text-[12px]">复制</DropdownMenuItem>
                        <DropdownMenuItem className="text-[12px] text-red-600">删除</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Content */}
                  <div className="relative">
                    <p className={cn(
                      "text-[13px] text-gray-700 leading-relaxed",
                      !expandedTuple || expandedTuple !== tuple.id ? "line-clamp-3" : ""
                    )}>
                      {tuple.content}
                    </p>
                    {!expandedTuple || expandedTuple !== tuple.id ? (
                      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                    ) : null}
                  </div>

                  {/* Tags */}
                  {tuple.tags && tuple.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-4 flex-wrap">
                      {tuple.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 rounded-md bg-gray-100/80 text-[11px] font-medium text-gray-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Expand indicator */}
                  <div className="absolute bottom-3 right-3">
                    <ChevronRight className={cn(
                      "h-3.5 w-3.5 text-gray-400 transition-transform duration-200",
                      expandedTuple === tuple.id && "rotate-90"
                    )} />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Empty state */}
          {filteredTuples.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-24"
            >
              <p className="text-[14px] text-gray-500 mb-4">未找到记录</p>
              <Button
                variant="ghost"
                className="h-9 px-4 rounded-lg hover:bg-gray-100/80 text-[13px] font-medium text-gray-700 hover:text-gray-900"
              >
                <Plus className="h-3.5 w-3.5 mr-2" />
                创建你的第一条记录
              </Button>
            </motion.div>
          )}
        </div>
      </motion.main>
    </div>
  );
}
