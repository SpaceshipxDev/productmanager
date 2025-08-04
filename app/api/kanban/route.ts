import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { getLineEntries } from '@/lib/db';
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
        `Content "${line.content}" confirmed ${formatElapsed(line.lastModified * 1000)} by user ${line.name} of ${line.department}.`
    )
    .join('\n');

  console.log("GOOGLE_API_KEY:", process.env.GOOGLE_API_KEY);
  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

  const prompt = `
  You are a data extraction assistant for a factory job tracking system. Your task is to parse unstructured job update entries and organize them into a structured JSON format.

  **Input**: Unstructured text containing job updates from multiple factory workers at different times.

  **Task**: Extract and organize information about each job (identified by ynmx-... IDs).

  **For each job, extract**:
  1. **id**: Unique numeric id - 1, 2, 3, etc. 
  2. **title**: The job identifier (format: ynmx-XX-X-XX-XXX) 
  3. **stage**: Current stage of the job. Must be one of: ${COLUMN_IDS.join(', ')}
  4. **priority**: One of: "low", "medium", "high", "critical"
    - low = normal flow
    - medium/high/critical = increasing urgency levels
  5. **dueDate**: Due date if mentioned (null if not specified)
  6. **lastEdited**: Time since last edit (e.g., "2 hours ago", "3 days ago")
  7. **customerName**: Customer name (use "无" if not available)
  8. **representative**: Assigned representative (use "无" if not available)
  9. **activity**: Array of activity history entries, each containing:
    - description: What happened and who did it
    - timestamp: When it happened (relative time)

  **Output format**: JSON array of task objects. Each task must include all fields listed above.

  **Example output structure**:
  [
    {
      "id": 1,
      "title": "YNMX-25-07-31-204",
      "stage": "quotation",
      "priority": "medium",
      "dueDate": "2025-08-10",
      "lastEdited": "2 hours ago",
      "customerName": "ABC Corp",
      "representative": "张三",
      "activity": [
        {
          "description": "Created by 李四",
          "timestamp": "3 days ago"
        },
        {
          "description": "Updated specifications by 张三",
          "timestamp": "2 hours ago"
        }
      ]
    },
    {
      "id": 2,
      "title": "YNMX-25-07-31-205",
      "stage": "order",
      "priority": "high",
      "dueDate": "2025-08-08",
      "lastEdited": "1 hour ago",
      "customerName": "XYZ Ltd",
      "representative": "王五",
      "activity": [
        {
          "description": "Order placed by 赵六",
          "timestamp": "2 days ago"
        }
      ]
    }
  ]

  **Important notes**:
  - Output must be a flat JSON array
  - Each task must have a "stage" field indicating its current stage
  - Use null for missing values (except customerName and representative which should be "无")
  - Maintain chronological order in activity arrays (oldest first)
  - Parse relative timestamps consistently
  - Ensure the stage value is exactly one of the allowed stages listed above

  Here is the unstructured lines data: ${linesString}
  `

  console.log("\n Prompt: ", prompt)

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
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

    return NextResponse.json({ tasks });
  } catch (e) {
    console.error("LLM request failed:", e);
    return NextResponse.json({ error: 'LLM request failed' }, { status: 500 });
  }
}