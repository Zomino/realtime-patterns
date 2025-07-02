import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";

interface Message {
  text: string;
  time: string;
  server?: string;
}

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to the Socket.IO server
    const socket = io("http://localhost:3000");
    socketRef.current = socket;

    // Receive the full message history on connect
    socket.on("messages", (msgs: Message[]) => {
      setMessages(msgs);
    });

    // Receive new messages in real-time
    socket.on("message", (msg: Message) => {
      console.log("Received message:", msg);
      setMessages((prev) => [...prev, msg]);
    });

    // Request initial messages (optional, if server doesn't emit on connect)
    socket.emit("messages");

    return () => {
      socket.disconnect();
    };
  }, []);

  const sendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!input.trim()) return;

    return fetch("http://localhost:8080/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input }),
    })
      .then(() => setInput("")) // Clear input after sending
      .catch((err) => console.error("Error sending message:", err));
  };

  const testHttp = async () => {
    try {
      const response = await fetch("http://localhost:8080/test");
      if (!response.ok) {
        throw new Error("HTTP test failed");
      }
      const data = await response.json();
      window.alert(`HTTP test successful: ${data.message}`);
    } catch (error) {
      console.error("HTTP test error:", error);
    }
  };


  return (
    <main>
      <h1>WebSockets (Socket.IO) Real-Time Messaging Demo</h1>
      <form onSubmit={sendMessage}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message"
        />
        <button type="submit">Send</button>
      </form>
      <ul>
        {messages.map((m, i) => (
          <li key={i}>
            [{new Date(m.time).toLocaleTimeString()}] {m.text}{" "}
            {m.server ? `(${m.server})` : ""}
          </li>
        ))}
      </ul>
      <button onClick={testHttp}>Test HTTP</button>
    </main>
  );
}

export default App;
