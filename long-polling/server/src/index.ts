import cors from "cors";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const LONG_POLL_TIMEOUT = 25000;
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
const waitingClients: Array<{ res: express.Response; timer: NodeJS.Timeout }> =
  [];

// Global interval to check for new messages and notify all waiting clients.
// This could easily lead to performance issues or memory leaks in a real-world application, especially with many clients.
setInterval(() => {
  if (messages.length > 0 && waitingClients.length > 0) {
    while (waitingClients.length > 0) {
      const { res, timer } = waitingClients.shift()!;
      clearTimeout(timer);
      res.json({ messages });
    }
  }
}, POLL_INTERVAL);

app.get("/messages", (req, res) => {
  // In reality, this would check for new messages.
  if (messages.length > 0) {
    res.json({ messages }); // Respond immediately if there are any messages
    return;
  }

  // The timeout ensures that dead connections are cleaned up after a certain period, preventing memory leaks.
  const timer = setTimeout(() => {
    // Remove this client from waitingClients if still present
    const idx = waitingClients.findIndex((wc) => wc.res === res);
    if (idx !== -1) waitingClients.splice(idx, 1);
    res.json({ messages: [] });
  }, LONG_POLL_TIMEOUT);

  waitingClients.push({ res, timer });
});

app.post("/messages", (req, res) => {
  messages.push({ text: req.body.message, time: new Date().toISOString() });
  res.sendStatus(201); // Created
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
