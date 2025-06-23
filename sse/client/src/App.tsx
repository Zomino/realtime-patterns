import { useEffect, useState } from "react";

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
    const eventSource = new EventSource("http://localhost:3000/events");

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received SSE data:", data);
        setMessages((prevMessages) => [...prevMessages, ...data]);
      } catch (error) {
        console.error("Error parsing SSE data:", error);
      }
    };

    return () => {
      eventSource.close(); // Close the EventSource connection on unmount
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
      <h1>SSE Demo</h1>
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
