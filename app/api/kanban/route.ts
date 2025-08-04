import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { getLineEntries } from '@/lib/db';
import { formatDistanceToNow } from 'date-fns';
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
  const lines = rawLines.map(line => ({
    content: line.content,
    name: line.name,
    department: line.department,
    timeAgo: formatDistanceToNow(line.lastModified * 1000, { addSuffix: true })
  }));

  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
  const prompt = `From the following note entries, extract project tasks and organize them into a kanban board. ` +
    `Return a JSON object with keys ${COLUMN_IDS.join(', ')} where each key maps to an array of tasks. ` +
    `Each task should include id, title, priority, dueDate, lastEdited, customerName, representative, and activity (array of {description, timestamp}).\n` +
    `${JSON.stringify(lines)}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    let tasks: Record<string, any[]> = {};
    try {
      tasks = JSON.parse(response.text);
    } catch (e) {
      tasks = {};
    }
    return NextResponse.json({ tasks });
  } catch (e) {
    return NextResponse.json({ error: 'LLM request failed' }, { status: 500 });
  }
}
