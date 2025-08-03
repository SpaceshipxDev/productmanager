"use client";

import { BarChart3, NotebookPen } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Header() {
  const pathname = usePathname();
  const currentView = pathname.startsWith('/management') ? 'management' : 'journal';
  const [showSignOut, setShowSignOut] = useState(false);

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

          <div className="relative">
            <button
              onClick={() => setShowSignOut(!showSignOut)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-full hover:bg-gray-100/60 transition-all duration-200"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-100 to-gray-200/80 flex items-center justify-center">
                <span className="text-[11px] font-semibold text-gray-700">张</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-medium text-gray-900">张明</span>
                <span className="text-[13px] text-gray-400">·</span>
                <span className="text-[13px] text-gray-500">手工</span>
              </div>
            </button>

            {showSignOut && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowSignOut(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 py-1 w-36 rounded-lg bg-white/95 backdrop-blur-xl shadow-[0_4px_24px_-2px_rgba(0,0,0,0.12)] border border-gray-200/60 overflow-hidden z-50">
                  <button
                    onClick={handleLogout}
                    className="w-full px-3 py-2 text-left text-[13px] font-medium text-gray-700 hover:bg-gray-50/80 transition-colors"
                  >
                    退出登录
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}