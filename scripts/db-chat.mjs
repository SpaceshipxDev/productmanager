import { GoogleGenAI } from "@google/genai";
import sqlite3 from "sqlite3";
import readline from "readline";

// Use the same SQLite database as the main application.
// Defaults to `database.sqlite` so the script can access the journal lines.
const db = new sqlite3.Database(process.env.DB_PATH || "./database.sqlite");
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

// Fetch all journal lines along with user and date information.
async function getLines() {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT users.username as username, lines.date as date, lines.idx as idx, lines.content as content
       FROM lines JOIN users ON lines.user_id = users.id
       ORDER BY lines.date DESC, lines.idx;`,
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
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
          .map((r) => `${r.username} | ${r.date} | ${r.idx}: ${r.content}`)
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
