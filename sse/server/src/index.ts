import cors from "cors";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const POLL_INTERVAL = 5000;
const PORT = process.env.PORT || 3000;

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello, Express!");
});

interface Message {
  text: string;
  time: string;
}

// In production, this would likely be replaced with a database (likely MongoDB), to allow it to persist across server restarts and in a clustered environment.
const messages: Message[] = [];
const sseClients: express.Response[] = [];
let lastSentTime = new Date().toISOString();

// Global interval to check for new messages and notify all waiting clients.
setInterval(() => {
  const newMessages = messages.filter((msg) => msg.time > lastSentTime);

  if (newMessages.length > 0) {
    lastSentTime = newMessages[newMessages.length - 1].time; // Update last

    sseClients.forEach((client) => {
      client.write(`data: ${JSON.stringify(newMessages)}\n\n`);
    });
  }
}, POLL_INTERVAL);

app.get("/events", (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  res.flushHeaders(); // Ensure headers are sent immediately

  res.write(`data: ${JSON.stringify(messages)}\n\n`); // Send initial messages

  sseClients.push(res);

  req.on("close", () => {
    const index = sseClients.indexOf(res);
    if (index !== -1) sseClients.splice(index, 1); // Remove client on disconnect
  });
});

app.post("/messages", (req, res) => {
  messages.push({ text: req.body.message, time: new Date().toISOString() });
  res.sendStatus(201); // Created
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
