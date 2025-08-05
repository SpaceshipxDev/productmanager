import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { getLineEntries, getKanbanTasks, setKanbanTasks } from '@/lib/db';
import { GoogleGenAI } from '@google/genai';

const COLUMN_IDS = [
  'quotation',
  'order',
  'approval',
  'outsourcing',
  'daohe',
  'programming',
  'machine',
  'manual',
  'surface',
  'inspection',
  'shipping',
];

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get('session')?.value;
  const session = verifySession(sessionToken);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const tasks = getKanbanTasks();
  return NextResponse.json({ tasks });
}

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get('session')?.value;
  const session = verifySession(sessionToken);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rawLines = getLineEntries();

  const formatElapsed = (timestampMs: number) => {
    const diff = Date.now() - timestampMs;
    const totalSeconds = Math.max(0, Math.floor(diff / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    let result = '';
    if (days > 0) result += `${days}d`;
    if (days > 0 || hours > 0) result += `${hours}hr`;
    if (days > 0 || hours > 0 || minutes > 0) result += `${minutes}min`;
    result += `${seconds}sec ago`;
    return result;
  };

  const linesString = rawLines
    .map(
      line =>
        `Content "${line.content}" confirmed ${formatElapsed(line.lastModified * 1000)} by user ${line.name} of department ${line.department}.`
    )
    .join('\n');

  console.log("GOOGLE_API_KEY:", process.env.GOOGLE_API_KEY);
  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

  const shanghaiDate = new Date().toLocaleDateString("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric", 
    month: "2-digit",
    day: "2-digit"
  }).replace(/\//g, '-');

  const prompt = `
  You are a data extraction assistant for a factory job tracking system.

  Your task is to parse unstructured job update entries and organize them into a structured JSON format.
  Employees may either input content of "ID: status, info" or just "ID" (in which case, they implicitly mean the job has arrived at their personal station).

  重要要求：
  - 所有展示给用户的内容必须以简体中文输出，包括 "lastEdited"（如："2小时前"，"3天前"）、"description"（如："到达 手工（张三）"）、"timestamp"（如："2小时前"）以及 "customerName"、"representative" 的内容。
  - JSON字段名保持英文。字段值 "stage" 使用英文枚举值（如 "quotation"、"order" 等）。字段值 "priority" 已改为中文枚举值："低"、"中"、"高"，优先级等级从原来的四个（low、medium、high、critical）调整为三个。

  Input: Unstructured text containing job updates from multiple factory workers at different times.

  Task: Extract and organize information about each job (identified by ynmx-... IDs).

  For each job, extract:

  id: Unique numeric id - 1, 2, 3, etc.
  title: The job identifier (format: YNMX-XX-X-XX-XXX)
  stage: Current stage of the job. Must be one of: ${COLUMN_IDS.join(', ')}
  priority: One of: "低", "中", "高"
  🛠 评估规则（必须严格遵守，任何偏差都算错误）  
  • 已逾期 —— 交期 **早于今天** ⇒ "高"  
  • 交期 **等于今天** ⇒ "中"  
  • 交期 **等于明天** ⇒ "中"  
  • 交期 **晚于明天** ⇒ "低"  
  • 若未给出交期，则默认 "低"
  Today's date is ${shanghaiDate}.
  dueDate: Due date if mentioned (null if not specified). Always format as YYYY-MM-DD.
  lastEdited: Time since last edit (例如："2小时前"，"3天前") rounded for user readability.
  customerName: Customer name (如无请填写："无")
  representative: Assigned representative (如无请填写："无")
  activity: Array of activity history entries, each containing:
  - description: 具体操作描述及操作者姓名，以中文输出，如："到达 CNC（赵六）". Given an actual grammatically correct succinct sentence. 
  - timestamp: 相对时间，以中文输出，如："2天前"
  The entries in the activity should be in chronological order, latest first. 

  Output format: JSON array of task objects. Each task must include all fields listed above.


  Important notes:

  There will be multiple lines/entries of the same job. your task is to, like mentioned, merge the unstructured jobs into a defined json array of job entries conveying the db's unstructured information in the form of individual jobs with activity history.

  - Output must be a flat JSON array.
  - Use null for missing values (except customerName and representative which should be "无").
  - Maintain chronological order in activity arrays (latest first).
  - Parse relative timestamps consistently, 并以中文形式展示给用户（例如："2小时前"、"3天前"）。
  - Ensure the stage value is exactly one of the allowed stages listed above.

  Here is the unstructured lines data: ${linesString}
  `;


  console.log("\n Prompt: ", prompt)

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { 
        responseMimeType: 'application/json',       
        thinkingConfig: { thinkingBudget: 0 }, 
      }
    });
    console.log("\n Res: ", response.text)
    
    let tasksArray: any[] = [];
    try {
      tasksArray = JSON.parse(response.text);
    } catch (e) {
      console.error("Failed to parse JSON:", e);
      tasksArray = [];
    }

    // Convert flat array to grouped object for frontend compatibility
    const tasks: Record<string, any[]> = {};
    COLUMN_IDS.forEach(columnId => {
      tasks[columnId] = [];
    });

    // Group tasks by stage
    tasksArray.forEach(task => {
      if (task.stage && tasks[task.stage]) {
        // Remove the stage field from the task object since it's now the key
        const { stage, ...taskWithoutStage } = task;
        tasks[stage].push(taskWithoutStage);
      }
    });

    setKanbanTasks(tasks);
    return NextResponse.json({ tasks });
  } catch (e) {
    console.error("LLM request failed:", e);
    return NextResponse.json({ error: 'LLM request failed' }, { status: 500 });
  }
}