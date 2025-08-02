import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { 
  initDB, 
  getAllLines, 
  getSmartTuples, 
  saveSmartTuples,
} from '@/lib/db'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || '' })

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get('session')?.value
  const session = verifySession(sessionToken)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  initDB()

  console.log("function is being run")

  console.log("\n Background process called")
  const lines = getAllLines()
  const noteText = lines
    .map(
      l => {
        const shanghaiTime = new Date(l.lastModified).toLocaleString('zh-CN', {
          timeZone: 'Asia/Shanghai',
          hour12: false // optional, for 24h time
        });
        return `${l.username}: ${l.content}. (last modified ${shanghaiTime})`;
      }
    )
    .join('\n')
  console.log("extracted: ", noteText)

  const prompt = `
  
    The notes is multiple entries of attributes for multiple ynmx ids. your job is to single out each id and 
    summarize the progress update for each. 
    
    Return your response as plain text in the format:
    ID: SUMMARY
    ID2: SUMMARY2

    Each line should have the ID, followed by a colon and space, then the summary. Include edit time in the summary.
    Do not include any other text, markdown, or formatting.

    The notes: \n\n${noteText}`

  console.log(prompt)

  try {
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
    })
    const text = res.text ?? ''
    console.log("\n res:, ", text)

    // Parse the plain text format
    const items = text
      .trim()
      .split('\n')
      .filter(line => line.trim()) // Remove empty lines
      .map(line => {
        // Split by first ": " to handle summaries that might contain colons
        const colonIndex = line.indexOf(': ')
        if (colonIndex === -1) {
          console.warn(`Skipping malformed line: ${line}`)
          return null
        }
        const id = line.substring(0, colonIndex).trim()
        const summary = line.substring(colonIndex + 2).trim()
        return { id, summary }
      })
      .filter(item => item !== null) as { id: string; summary: string }[]

    saveSmartTuples(items)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'LLM error' }, { status: 500 })
  }

  const tuples = getSmartTuples()
  return NextResponse.json({ tuples })
}