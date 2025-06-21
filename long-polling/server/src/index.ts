import cors from "cors";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const LONG_POLL_TIMEOUT = 25000;
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

app.get("/messages", (req, res) => {
  res.json({ messages });
});

app.post("/messages", (req, res) => {
  const { message } = req.body;
  messages.push({ text: message, time: new Date().toISOString() });
  res.sendStatus(201); // Created
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

console.log("Server started successfully");
