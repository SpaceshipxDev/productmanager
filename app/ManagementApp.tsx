"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Building2, User, X } from "lucide-react";
import Header from "@/components/header";

// Default Kanban column definitions
const KANBAN_COLUMNS = [
  { id: "quotation", title: "报价" },
  { id: "order", title: "制单" },
  { id: "approval", title: "审批" },
  { id: "outsourcing", title: "外协" },
  { id: "daohe", title: "道禾" },
  { id: "programming", title: "编程" },
  { id: "machine", title: "操机" },
  { id: "manual", title: "手工" },
  { id: "surface", title: "表面处理" },
  { id: "inspection", title: "检验" },
  { id: "shipping", title: "出货" },
];

interface Task {
  id: string;
  title: string;
  priority: string;
  dueDate: string;
  lastEdited: string;
  customerName: string;
  representative: string;
  activity?: { description: string; timestamp: string }[];
}

type SelectedTask = Task & { status: string; columnId: string };

function TaskModal({ task, onClose }: { task: SelectedTask | null; onClose: () => void }) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (task) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [task, onClose]);

  if (!task) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "text-red-600";
      case "high": return "text-orange-600";
      case "medium": return "text-yellow-600";
      case "low": return "text-gray-600";
      default: return "text-gray-600";
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in duration-300"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
        <div
          className="relative w-full max-w-5xl bg-white rounded-2xl shadow-xl animate-in slide-in-from-bottom-8 fade-in duration-500 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          style={{ maxHeight: "90vh" }}
        >
          <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 px-12 py-8 z-10">
            <button
              onClick={onClose}
              className="absolute top-8 right-8 w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors duration-200"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
            <div className="max-w-4xl">
              <div className="flex items-center gap-6 mb-4">
                <span className={`text-sm font-medium ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
                <span className="text-sm text-gray-400">•</span>
                <span className="text-sm text-gray-600">
                  {task.status}
                </span>
              </div>
              <h1 className="text-4xl font-semibold text-gray-900 tracking-tight">
                {task.title}
              </h1>
            </div>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: "calc(90vh - 140px)" }}>
            <div className="px-12 py-10">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 max-w-4xl mb-16">
                <div>
                  <p className="text-sm text-gray-500 mb-2">客户</p>
                  <p className="text-base font-medium text-gray-900">{task.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">负责人</p>
                  <p className="text-base font-medium text-gray-900">{task.representative}</p>
                </div>
                {task.columnId !== "quotation" && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">交期</p>
                    <p className="text-base font-medium text-gray-900">
                      {formatDate(task.dueDate)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500 mb-2">最近更新时间</p>
                  <p className="text-base font-medium text-gray-900">{task.lastEdited}</p>
                </div>
              </div>
              <div className="mt-16 max-w-4xl">
                <h2 className="text-sm font-medium text-gray-900 mb-8">进度记录</h2>
                <div className="space-y-8">
                  {(task.activity ?? []).map((event, i) => (
                    <div className="flex gap-4" key={i}>
                      <div className="w-2 h-2 rounded-full bg-gray-300 mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="text-sm text-gray-600">{event.description}</p>
                        <p className="text-sm text-gray-400 mt-1">{event.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const formatDate = (dateString: string) => {
  if (dateString === "今天") return "今天";
  if (dateString === "明天") return "明天";
  if (dateString === "后天") return "后天";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return dateString;
  }

  const today = new Date();
  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "今天";
  if (diffDays === 1) return "明天";
  if (diffDays === -1) return "昨天";
  if (diffDays > 0 && diffDays <= 7) return `还有${diffDays}天`;
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)}天前`;

  return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
};

export default function ManagementApp() {
  const [selectedTask, setSelectedTask] = useState<SelectedTask | null>(null);
  const [kanbanTasks, setKanbanTasks] = useState<Record<string, Task[]>>({});

  const generateKanban = async () => {
    try {
      const res = await fetch('/api/kanban', { method: 'POST' });
      const data = await res.json();
      setKanbanTasks(data.tasks ?? {});
    } catch (err) {
      console.error('Failed to generate kanban', err);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-50/50 text-red-600 border-red-100";
      case "high": return "bg-orange-50/50 text-orange-600 border-orange-100";
      case "medium": return "bg-yellow-50/50 text-yellow-600 border-yellow-100";
      case "low": return "bg-gray-50/50 text-gray-600 border-gray-100";
      default: return "bg-gray-50/50 text-gray-600 border-gray-100";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/30">
      <Header />
      <div className="pt-20 px-6">
        <div className="flex items-center justify-end mb-6">
          <button
            onClick={generateKanban}
            className="px-4 py-2 rounded-xl bg-white border border-gray-200/60 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
          >
            AI 生成
          </button>
        </div>
        <div className="overflow-x-auto pb-6 -mx-6 px-6">
          <div className="flex gap-4" style={{ minWidth: "max-content" }}>
            {KANBAN_COLUMNS.map((column) => (
              <div key={column.id} className="w-80 flex-shrink-0">
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100/50">
                    <div className="flex items-center justify-between">
                      <h2 className="font-medium text-gray-900 text-[15px]">{column.title}</h2>
                      <span className="text-xs text-gray-500 bg-gray-100/60 px-2.5 py-1 rounded-full font-medium">
                        {(kanbanTasks[column.id] ?? []).length}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 space-y-2.5" style={{ minHeight: "500px", maxHeight: "calc(100vh - 180px)", overflowY: "auto" }}>
                    {(kanbanTasks[column.id] ?? []).map((task) => (
                      <div
                        key={task.id}
                        className="p-4 bg-white rounded-xl border border-gray-200/60 hover:border-gray-300/60 hover:shadow-md transition-all duration-200 cursor-pointer group"
                        onClick={() => setSelectedTask({ ...task, status: column.title, columnId: column.id })}
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="font-medium text-gray-900 text-sm leading-5 flex-1">
                              {task.title}
                            </h3>
                            <Badge
                              variant="outline"
                              className={`text-xs px-2 py-0.5 border ${getPriorityColor(task.priority)}`}
                            >
                              {task.priority}
                            </Badge>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Building2 className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-xs truncate">{task.customerName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <User className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-xs">{task.representative}</span>
                            </div>
                          </div>
                          {column.id !== "quotation" && (
                            <div className="flex items-center justify-between pt-3 border-t border-gray-100/60">
                              <span className="text-xs text-gray-500">
                                交期： {formatDate(task.dueDate)}
                              </span>
                              <div className="flex items-center gap-1 text-gray-400">
                                <Clock className="w-3 h-3" />
                                <span className="text-xs">{task.lastEdited}</span>
                              </div>
                            </div>
                          )}
                          {column.id === "quotation" && (
                            <div className="flex items-center justify-end pt-3 border-t border-gray-100/60">
                              <div className="flex items-center gap-1 text-gray-400">
                                <Clock className="w-3 h-3" />
                                <span className="text-xs">{task.lastEdited}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />
    </div>
  );
}