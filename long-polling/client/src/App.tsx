import { useEffect, useState } from "react";

const RETRY_INTERVAL = 5000;

interface Message {
  text: string;
  time: string;
}

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  // In production, this would be probably be abstracted into a custom hook or service.
  // We would probably need to have all events (i.e., not just messages) fetched in a single setTimeout, to avoid overloading the server.
  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;

    const fetchMessages = () => {
      return fetch("http://localhost:3000/messages")
        .then((res) => res.json())
        .then((data) => {
          setMessages(data.messages);
          setTimeout(fetchMessages, RETRY_INTERVAL); // Immediately schedule the next fetch
        })
        .catch((err) => {
          console.error("Polling error:", err);
          console.log("Retrying in 5 seconds...");
          timeout = setTimeout(fetchMessages, RETRY_INTERVAL); // Schedule the next fetch
        });
    };

    fetchMessages(); // Initial fetch

    return () => {
      if (timeout) clearTimeout(timeout); // Clear the timeout on unmount
    };
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
      <h1>Long-Polling Demo</h1>
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
