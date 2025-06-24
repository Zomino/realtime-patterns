import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createClient } from "redis";

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
const waitingClients: Array<{ res: express.Response; timer: NodeJS.Timeout }> =
  [];

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const pubClient = createClient({ url: redisUrl });
const subClient = createClient({ url: redisUrl });

async function connectRedis() {
  try {
    await pubClient.connect();
    await subClient.connect();
    console.log("Connected to Redis");
  } catch (error) {
    console.error("Error connecting to Redis:", error);
  }
}

connectRedis()
  .then(() => {
    // For the sake of simplicity, we explicitly subscribe to the "new_message" channel.
    // In a production environment, we would separate the concerns of the message broker and the application logic that consumes messages.
    subClient.subscribe("new_message", (message) => {
      console.log("Received message:", message);

      const msg: Message = JSON.parse(message);

      // Check if the message already exists to avoid duplicates
      // This is a simple check; in a real application, you might want to use a more robust method to ensure uniqueness.
      // For example, you could use a unique ID for each message.
      if (!messages.find((m) => m.text === msg.text && m.time === msg.time)) {
        console.log("Adding new message to the list:", msg);
        messages.push(msg);
      }

      while (waitingClients.length > 0) {
        const { res, timer } = waitingClients.shift()!;

        clearTimeout(timer);

        res.json({ messages: [msg] }); // Send only the new message to the client
      }
    });
  })
  .catch((error) => {
    console.error("Error setting up Redis subscription:", error);
  });

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

app.post("/messages", async (req, res) => {
  const msg = { text: req.body.message, time: new Date().toISOString() };

  messages.push(msg);

  // In local development, the subscriber and the publisher can be the same server instance.
  // In a load balanced production environment, they could be separate instances.
  console.log("Publishing message:", msg);

  await pubClient.publish("new_message", JSON.stringify(msg));
  res.sendStatus(201); // Created
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
