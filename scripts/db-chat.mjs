import { GoogleGenAI } from "@google/genai";
import sqlite3 from "sqlite3";
import readline from "readline";

const db = new sqlite3.Database(process.env.DB_PATH || "./lines.db");
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

async function getLines() {
  return new Promise((resolve, reject) => {
    db.all('SELECT id, "desc", time FROM lines', (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function main() {
  const chat = ai.chats.create({
    model: "gemini-2.5-flash",
    history: [
      { role: "user", parts: [{ text: "Hello" }] },
      {
        role: "model",
        parts: [
          { text: "Great to meet you. Ask me about the lines table." },
        ],
      },
    ],
  });

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log("Type 'exit' to quit. Ask your question about the lines table:");

  const prompt = () => {
    rl.question("> ", async (input) => {
      if (input.trim().toLowerCase() === "exit") {
        rl.close();
        db.close();
        return;
      }

      try {
        const rows = await getLines();
        const linesText = rows
          .map((r) => `id: ${r.id}, desc: ${r.desc}, time: ${r.time}`)
          .join("\n");
        const response = await chat.sendMessage({
          message: `Lines table:\n${linesText}\n\nUser question: ${input}`,
        });
        console.log(response.text);
      } catch (err) {
        console.error("Error:", err.message);
      }

      prompt();
    });
  };

  prompt();
}

main().catch((err) => {
  console.error("Failed to start chat:", err.message);
  db.close();
});
