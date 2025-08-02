"use client"

import { useEffect, useMemo, useState } from "react"
import { cn } from "@/lib/utils"

/*───────────────────────────────────────────────────────────
  1️⃣  Types
───────────────────────────────────────────────────────────*/
interface HistoryEntry {
  timestamp: string
  action: string
  operator: string
}

interface Order {
  id: string
  overview: string
  status: string
  progress: number             // 0–100
  priority: "critical" | "warning" | "normal"
  history: HistoryEntry[]
}

const summary = {
  inProgress: 8,  // 在制订单
  problems: 2,    // 问题订单
  completed: 5,   // 已完成
  quotes: 3       // 已报价
}

/*───────────────────────────────────────────────────────────
  2️⃣  Helpers
  ───────────────────────────────────────────────────────────*/
const priorityWeight = (p: Order["priority"]) =>
  p === "critical" ? 0 : p === "warning" ? 1 : 2

const parseStatusTime = (status: string) => {
  const m = status.match(/(\d{2})-(\d{2}) (\d{2}):(\d{2})/)
  if (!m) return null
  const [, MM, DD, hh, mm] = m
  const now = new Date()
  return new Date(now.getFullYear(), +MM - 1, +DD, +hh, +mm)
}

const relativeTime = (from: Date, to: Date) => {
  const diffMin = Math.floor((to.getTime() - from.getTime()) / 60000)
  if (diffMin < 60) return `${diffMin} min ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH} h ago`
  return `${from.getMonth() + 1}-${from.getDate()}`
}

/*───────────────────────────────────────────────────────────
  3️⃣  Mock data  (<<<--- paste your array here --->>>)
  ───────────────────────────────────────────────────────────*/
const mockOrders: Order[] = [
  // critical
  {
    id: "YNMX-25-07-11",
    overview: "已延期",
    status: "07-29 16:45 更新",
    progress: 45,
    priority: "critical",
    history: [
      { timestamp: "07-11 09:30", action: "接到任务", operator: "涂名杰" },
      { timestamp: "07-11 14:20", action: "完成报价", operator: "张怡" },
      { timestamp: "07-12 08:15", action: "客户确认下单", operator: "黄工" },
      { timestamp: "07-15 10:00", action: "开始制单", operator: "李明" },
      { timestamp: "07-16 14:30", action: "CNC编程完成", operator: "王技术" },
      { timestamp: "07-18 09:00", action: "开始操机", operator: "陈师傅" },
      { timestamp: "07-19 11:20", action: "发现材料问题，暂停生产", operator: "陈师傅" },
      { timestamp: "07-22 08:30", action: "更换材料重新开始", operator: "李主管" },
      { timestamp: "07-25 15:00", action: "完成初步加工", operator: "陈师傅" },
      { timestamp: "07-29 16:45", action: "质检发现尺寸偏差，需返工", operator: "质检部" }
    ]
  },
  {
    id: "YNMX-25-07-12",
    overview: "材料短缺",
    status: "07-29 15:30 更新",
    progress: 78,
    priority: "warning",
    history: [
      { timestamp: "07-12 10:00", action: "接到任务", operator: "涂名杰" },
      { timestamp: "07-12 16:00", action: "报价完成", operator: "张怡" },
      { timestamp: "07-13 09:00", action: "客户下单", operator: "黄工" },
      { timestamp: "07-15 08:30", action: "开始制单", operator: "李明" },
      { timestamp: "07-16 10:00", action: "审批通过", operator: "王经理" },
      { timestamp: "07-17 14:00", action: "编程完成", operator: "技术部" },
      { timestamp: "07-19 08:00", action: "开始操机", operator: "赵师傅" },
      { timestamp: "07-22 11:00", action: "完成粗加工", operator: "赵师傅" },
      { timestamp: "07-24 09:30", action: "开始精加工", operator: "赵师傅" },
      { timestamp: "07-26 16:00", action: "发现材料不足", operator: "仓库" },
      { timestamp: "07-29 15:30", action: "等待补充材料", operator: "采购部" }
    ]
  },
  {
    id: "YNMX-25-07-13",
    overview: "检验",
    status: "07-29 14:20 更新",
    progress: 92,
    priority: "normal",
    history: [
      { timestamp: "07-13 08:45", action: "接到任务", operator: "涂名杰" },
      { timestamp: "07-13 11:30", action: "报价发出", operator: "张怡" },
      { timestamp: "07-14 09:00", action: "客户确认", operator: "黄工" },
      { timestamp: "07-15 10:00", action: "制单完成", operator: "李明" },
      { timestamp: "07-16 08:30", action: "审批通过", operator: "王经理" },
      { timestamp: "07-17 09:00", action: "编程开始", operator: "技术部" },
      { timestamp: "07-18 14:00", action: "编程完成", operator: "技术部" },
      { timestamp: "07-19 08:00", action: "开始操机", operator: "刘师傅" },
      { timestamp: "07-22 16:30", action: "完成所有加工", operator: "刘师傅" },
      { timestamp: "07-23 09:00", action: "表面处理开始", operator: "处理部" },
      { timestamp: "07-25 11:00", action: "表面处理完成", operator: "处理部" },
      { timestamp: "07-29 14:20", action: "开始质量检验", operator: "质检部" }
    ]
  },
  // … 8 more orders (samples kept concise) …
  {
    id: "YNMX-25-07-19",
    overview: "客户变更",
    status: "07-29 12:10 更新",
    progress: 20,
    priority: "critical",
    history: [
      { timestamp: "07-19 08:30", action: "客户修改图纸", operator: "销售部" },
      { timestamp: "07-19 12:10", action: "等待重新报价", operator: "张怡" }
    ]
  },
  {
    id: "YNMX-25-07-20",
    overview: "等待外协",
    status: "07-29 13:50 更新",
    progress: 60,
    priority: "warning",
    history: [
      { timestamp: "07-20 10:15", action: "外协件下单", operator: "采购部" },
      { timestamp: "07-29 13:50", action: "外协件运输中", operator: "物流部" }
    ]
  },
  {
    id: "YNMX-25-07-21",
    overview: "打包",
    status: "07-29 18:20 更新",
    progress: 85,
    priority: "normal",
    history: [
      { timestamp: "07-21 15:00", action: "包装开始", operator: "包装部" },
      { timestamp: "07-29 18:20", action: "等待发货确认", operator: "物流部" }
    ]
  },
  {
    id: "YNMX-25-07-22",
    overview: "检验",
    status: "07-29 11:40 更新",
    progress: 55,
    priority: "normal",
    history: [
      { timestamp: "07-22 09:00", action: "中期检验", operator: "质检部" },
      { timestamp: "07-29 11:40", action: "复检完成", operator: "质检部" }
    ]
  },
  {
    id: "YNMX-25-07-23",
    overview: "CNC编程",
    status: "07-29 14:05 更新",
    progress: 35,
    priority: "normal",
    history: [
      { timestamp: "07-23 08:00", action: "编程开始", operator: "技术部" },
      { timestamp: "07-29 14:05", action: "编程进行中", operator: "技术部" }
    ]
  },
  {
    id: "YNMX-25-07-24",
    overview: "设备保养",
    status: "07-29 09:15 更新",
    progress: 50,
    priority: "warning",
    history: [
      { timestamp: "07-24 09:00", action: "保养计划确认", operator: "设备部" },
      { timestamp: "07-29 09:15", action: "主轴润滑完成", operator: "设备部" }
    ]
  },
  {
    id: "YNMX-25-07-25",
    overview: "表面处理",
    status: "07-29 17:45 更新",
    progress: 70,
    priority: "normal",
    history: [
      { timestamp: "07-25 11:00", action: "喷涂开始", operator: "处理部" },
      { timestamp: "07-29 17:45", action: "喷涂进行中", operator: "处理部" }
    ]
  }
]

/*───────────────────────────────────────────────────────────
  4️⃣  Component
  ───────────────────────────────────────────────────────────*/
export default function OrdersPage() {
  /* Local state */
  const [expanded, setExpanded] = useState<string | null>(null)
  const [now, setNow] = useState(new Date())

  /* Keep “now” fresh every minute for live footer */
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  /*───────────────────
    A.  Sorted order list
    ───────────────────*/
  const sortedOrders = useMemo(
    () =>
      [...mockOrders].sort((a, b) => {
        const diff = priorityWeight(a.priority) - priorityWeight(b.priority)
        if (diff) return diff
        return (
          parseStatusTime(b.status)!.getTime() -
          parseStatusTime(a.status)!.getTime()
        )
      }),
    []
  )

  /*───────────────────
    B.  Today-View metrics
    ───────────────────*/
  const metrics = useMemo(() => {
    const inProgress = mockOrders.filter(
      o => o.progress > 0 && o.progress < 100
    ).length

    const problems = mockOrders.filter(o => o.priority !== "normal").length

    const completed = mockOrders.filter(o => o.progress >= 100).length

    // crude definition: overview includes “报价”
    const quotes = mockOrders.filter(o => o.overview.includes("报价")).length

    return { inProgress, problems, completed, quotes }
  }, [])

  /*───────────────────
    C.  Last status timestamp
    ───────────────────*/
  const lastStatusTime = useMemo(() => {
    const parsed = mockOrders
      .map(o => parseStatusTime(o.status))
      .filter(Boolean) as Date[]
    return new Date(Math.max(...parsed.map(d => d.getTime())))
  }, [])

  /*───────────────────
    D.  Render
    ───────────────────*/
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Page title */}
        <h1 className="text-2xl font-medium text-black mb-6">Orders</h1>

        <div className="bg-gray-50 rounded-lg p-3 mb-10 text-center flex flex-wrap gap-4">
        <span className="w-full text-sm font-medium text-gray-600 mb-1">今日概况</span>

        {([
            ["在制", summary.inProgress],
            ["问题", summary.problems],
            ["已完成", summary.completed],
            ["已报价", summary.quotes]
        ] as const).map(([label, num]) => (
            <div key={label} className="flex-1 min-w-[68px]">
            <div className="text-lg font-bold text-gray-800">{num}</div>
            <div className="text-xs text-gray-500">{label}</div>
            </div>
        ))}
        </div>

        {/* ── Order rows list ─────────────────────────────── */}
        <div className="divide-y divide-gray-200">
          {sortedOrders.map((order, idx) => (
            <div key={order.id} className="py-4">
              {/* Rank badge */}
              <span className="mr-2 text-xs text-gray-400 font-mono w-6 inline-block">
                #{idx + 1}
              </span>

              {/* Clickable row */}
              <button
                onClick={() =>
                  setExpanded(expanded === order.id ? null : order.id)
                }
                className="w-full text-left group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-8 flex-1">
                    {/* Priority dot + ID */}
                    <div className="flex items-center space-x-2">
                      {order.priority !== "normal" && (
                        <div
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            order.priority === "critical"
                              ? "bg-red-500"
                              : "bg-orange-500"
                          )}
                        />
                      )}
                      <span className="text-sm text-gray-500 font-mono">
                        {order.id}
                      </span>
                    </div>

                    {/* Overview or priority pill */}
                    {order.priority === "normal" ? (
                      <span className="text-sm text-black font-medium">
                        {order.overview}
                      </span>
                    ) : (
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-semibold",
                          order.priority === "critical"
                            ? "bg-red-100 text-red-700"
                            : "bg-orange-100 text-orange-700"
                        )}
                      >
                        {order.overview}
                      </span>
                    )}

                    {/* Status */}
                    <span className="text-sm text-gray-500">
                      {order.status}
                    </span>

                    {/* Progress bar */}
                    <div className="flex items-center space-x-3 ml-auto">
                      <span className="text-sm text-gray-400">
                        {order.progress}%
                      </span>
                      <div className="w-32 bg-gray-100 rounded-full h-1 overflow-hidden">
                        <div
                          className="h-full bg-gray-900 rounded-full transition-all duration-300"
                          style={{ width: `${order.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Chevron */}
                  <svg
                    className={cn(
                      "w-4 h-4 text-gray-400 ml-4 transition-transform duration-200",
                      expanded === order.id && "rotate-90"
                    )}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </button>

              {/* Expanded timeline */}
              {expanded === order.id && (
                <ul className="mt-4 pl-[168px] pr-8 space-y-3">
                  {order.history.map((step, i) => (
                    <li key={i} className="flex items-start">
                      <span className="mt-1.5 w-1.5 h-1.5 bg-gray-300 rounded-full flex-shrink-0" />
                      <p className="ml-3 text-sm text-gray-600 leading-relaxed">
                        <span className="font-mono text-gray-500">
                          {step.timestamp}
                        </span>{" "}
                        {step.action}{" "}
                        <span className="text-gray-400">
                          [{step.operator}]
                        </span>
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* ── Live footer ─────────────────────────────── */}
        <footer className="mt-12 flex items-center justify-center text-xs text-gray-400">
          <span className="relative flex h-2 w-2 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>
            数据实时更新 · last sync&nbsp;
            {relativeTime(lastStatusTime, now)}
          </span>
        </footer>
      </div>
    </div>
  )
}
