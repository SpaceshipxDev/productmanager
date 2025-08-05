"use client";

import { useState, useEffect } from "react";
import { Clock, X, Sparkles, RefreshCw } from "lucide-react";
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

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl animate-in slide-in-from-bottom-3 fade-in duration-300 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          style={{ maxHeight: "85vh" }}
        >
          <div className="px-8 py-6">
            <button
              onClick={onClose}
              className="absolute top-6 right-6 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
            
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-medium ${
                  task.priority === "高" ? "text-red-500" : 
                  task.priority === "中" ? "text-yellow-500" : 
                  "text-gray-400"
                }`}>
                  {task.priority}优先级
                </span>
                <span className="text-xs text-gray-300">•</span>
                <span className="text-xs text-gray-500">{task.status}</span>
              </div>
              <h1 className="text-2xl font-medium text-gray-900">
                {task.title}
              </h1>
            </div>

            <div className="space-y-6 mb-8">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-gray-500 mb-1">客户</p>
                  <p className="text-sm text-gray-900">{task.customerName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">负责人</p>
                  <p className="text-sm text-gray-900">{task.representative}</p>
                </div>
                {task.columnId !== "quotation" && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">交期</p>
                    <p className="text-sm text-gray-900">{formatDate(task.dueDate)}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500 mb-1">最近更新</p>
                  <p className="text-sm text-gray-900">{task.lastEdited}</p>
                </div>
              </div>
            </div>

            {task.activity && task.activity.length > 0 && (
              <div>
                <h2 className="text-xs text-gray-500 mb-4">活动</h2>
                <div className="space-y-3">
                  {task.activity.map((event, i) => (
                    <div className="flex gap-3" key={i}>
                      <div className="w-1 h-1 rounded-full bg-gray-300 mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="text-sm text-gray-700">{event.description}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{event.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
  if (diffDays > 0 && diffDays <= 7) return `${diffDays}天`;
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)}天前`;

  return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
};

export default function ManagementApp() {
  const [selectedTask, setSelectedTask] = useState<SelectedTask | null>(null);
  const [kanbanTasks, setKanbanTasks] = useState<Record<string, Task[]>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate statistics
  const stats = {
    active: 0,
    high: 0,
    medium: 0,
    low: 0
  };

  Object.values(kanbanTasks).forEach(tasks => {
    tasks.forEach(task => {
      stats.active++;
      if (task.priority === "高") stats.high++;
      else if (task.priority === "中") stats.medium++;
      else if (task.priority === "低") stats.low++;
    });
  });

  const generateKanban = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/kanban', { method: 'POST' });
      const data = await res.json();
      setKanbanTasks(data.tasks ?? {});
    } catch (err) {
      console.error('Failed to generate kanban', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="pt-20 px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-semibold text-gray-900">{stats.active}</span>
              <span className="text-sm text-gray-500">活跃任务</span>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-sm font-medium text-gray-700">{stats.high}</span>
                <span className="text-xs text-gray-500">高优先级</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span className="text-sm font-medium text-gray-700">{stats.medium}</span>
                <span className="text-xs text-gray-500">中优先级</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                <span className="text-sm font-medium text-gray-700">{stats.low}</span>
                <span className="text-xs text-gray-500">低优先级</span>
              </div>
            </div>
          </div>
          <button
            onClick={generateKanban}
            disabled={isRefreshing}
            className="group relative px-4 py-2 rounded-full bg-gray-900 text-white text-[13px] font-medium transition-all duration-200 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-2">
              <Sparkles className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-pulse' : 'group-hover:rotate-12 transition-transform'}`} />
              <span>{isRefreshing ? '刷新中...' : 'AI 刷新'}</span>
            </div>
          </button>
        </div>
        
        <div className="overflow-x-auto -mx-8 px-8">
          <div className="flex gap-6" style={{ minWidth: "max-content" }}>
            {KANBAN_COLUMNS.map((column) => (
              <div key={column.id} className="w-80 flex-shrink-0">
                <div>
                  <div className="mb-4">
                    <div className="flex items-baseline justify-between">
                      <h2 className="text-sm font-medium text-gray-900">{column.title}</h2>
                      <span className="text-xs text-gray-400">
                        {(kanbanTasks[column.id] ?? []).length}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3" style={{ minHeight: "400px" }}>
                    {(kanbanTasks[column.id] ?? []).map((task) => (
                      <div
                        key={task.id}
                        className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer group"
                        onClick={() => setSelectedTask({ ...task, status: column.title, columnId: column.id })}
                      >
                        <div className="space-y-3">
                          <div>
                            <h3 className="text-sm font-medium text-gray-900 mb-1">
                              {task.title}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {task.customerName} · {task.representative}
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className={`text-xs font-medium ${
                                  task.priority === "高" ? "text-red-500" : 
                                  task.priority === "中" ? "text-yellow-500" : 
                                  "text-gray-400"
                                }`}>
                                {task.priority === "高" && "●"} 
                                {task.priority === "中" && "●"} 
                                {task.priority === "低" && "○"}
                              </span>
                              
                              {column.id !== "quotation" && task.dueDate && (
                                <span className="text-xs text-gray-500">
                                  {formatDate(task.dueDate)}
                                </span>
                              )}
                            </div>
                            
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {task.lastEdited}
                            </span>
                          </div>
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
