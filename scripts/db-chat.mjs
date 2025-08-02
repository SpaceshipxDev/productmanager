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
      `SELECT users.username as username, lines.date as date, lines.idx as idx, lines.content as content, lines.last_modified as last_modified
       FROM lines JOIN users ON lines.user_id = users.id
       ORDER BY lines.date DESC, lines.idx;`,
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows.map(r => ({...r, last_modified: new Date(r.last_modified * 1000).toLocaleString('en-US', { timeZone: 'Asia/Shanghai' })})));
      }
    );
  });
}

async function main() {
  const chat = ai.chats.create({
    model: "gemini-2.5-flash",
    history: [
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
          .map((r) => `Order ${r.content}. Last edited ${r.last_modified} by employee ${r.username}`)
          .join("\n");

        const shanghaiTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Shanghai' });
        const message = `I'm the factory owner. You are my manager responsible for telling me the production /employee status of jobs in the factory. The current time in Shanghai is ${shanghaiTime}. Here is my live database: ${linesText}. My question: ${input}.  `
        console.log("\n Prompt: ", message)
        const response = await chat.sendMessage({
          message
        })
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
