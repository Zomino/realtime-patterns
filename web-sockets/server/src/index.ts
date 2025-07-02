import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";

dotenv.config();

const PORT = process.env.PORT || 3000;
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const app = express();
const httpServer = createServer(app);

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello, Express!");
});

interface Message {
  text: string;
  time: string;
  server?: string;
}

// In production, this would likely be replaced with a database.
const messages: Message[] = [];

// Set up Socket.IO
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

const pubClient = createClient({ url: REDIS_URL });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  io.adapter(createAdapter(pubClient, subClient));
  console.log("Socket.IO Redis adapter connected");
});

io.on("connection", (socket) => {
  // Send all previous messages on connect, including server info
  socket.emit("messages", messages);

  // Optionally handle client-sent messages:
  // socket.on("send-message", (text: string) => { ... });
});

app.post("/messages", async (req, res) => {
  const msg = { text: req.body.message, time: new Date().toISOString(), server: process.env.SERVER || process.env.HOSTNAME || "unknown" };
  messages.push(msg);

  // Broadcast to all Socket.IO clients, including server info
  io.emit("message", msg);

  res.sendStatus(201);
});

app.get('/test', (req, res) => {
  res.json({ ok: true, message: `Hello from ${process.env.SERVER || process.env.HOSTNAME || "unknown"}!` });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
