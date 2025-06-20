import { useEffect, useState } from "react";

const POLLING_INTERVAL = 5000;

interface Message {
  text: string;
  time: string;
}

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const fetchMessages = () => {
      return fetch("http://localhost:3000/messages")
        .then((res) => res.json())
        .then((data) => setMessages(data.messages))
        .catch((err) => console.error("Polling error:", err));
    };

    fetchMessages(); // Initial fetch

    const interval = setInterval(fetchMessages, POLLING_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const sendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!input.trim()) return;

    return fetch("http://localhost:3000/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input }),
    })
      .then(() => setInput("")) // Clear input after sending
      .catch((err) => console.error("Error sending message:", err));
  };

  return (
    <main>
      <h1>Polling Demo</h1>
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
            [{new Date(m.time).toLocaleTimeString()}] {m.text}
          </li>
        ))}
      </ul>
    </main>
  );
}

export default App;
