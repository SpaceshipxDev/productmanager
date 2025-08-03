"use client";

import { LogOut, BarChart3, NotebookPen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  const currentView = pathname.startsWith('/management') ? 'management' : 'journal';

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } finally {
      location.href = '/login';
    }
  };

  return (
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
  );
}
