import { useState } from 'react';
import axios from 'axios';
import './App.css'; // ✅ Import the CSS

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { sender: "You", text: input }];
    setMessages(newMessages);

    try {
      const res = await axios.post("http://localhost:8000/chat", {
        question: input,
      });

      const answer = res.data.answer || "No response.";
      setMessages([...newMessages, { sender: "Chikitsa", text: answer }]);
    } catch (err) {
      setMessages([...newMessages, { sender: "Chikitsa", text: "Error: Could not connect." }]);
    }

    setInput("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="chat-container">
      <h1 className="title">🩺 Chikitsa - Medical Chatbot</h1>

      <div className="chat-window">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-message ${msg.sender === "You" ? "user" : "bot"}`}>
            <strong>{msg.sender}:</strong> {msg.text}
          </div>
        ))}
      </div>

      <div className="input-container">
        <input
          type="text"
          value={input}
          placeholder="Ask your medical question..."
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          className="input-box"
        />
        <button onClick={sendMessage} className="send-button">Send</button>
      </div>
    </div>
  );
}

export default App;
