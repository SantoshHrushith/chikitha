import { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { sender: "You", text: input }];
    setMessages([...newMessages, { sender: "Chikitsa", text: "", loading: true }]);
    setLoading(true);
    const Input = input.trim();
    setInput("");
    try {
      const res = await axios.post("http://localhost:8000/chat", {
        question: input,
      });

      const answer = res.data.answer || "No response.";
      // Replace the last loading message with the answer
      setMessages([
        ...newMessages,
        { sender: "Chikitsa", text: answer }
      ]);
    } catch (err) {
      setMessages([
        ...newMessages,
        { sender: "Chikitsa", text: "Error: Could not connect." }
      ]);
    }
   setLoading(false);
    
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
            <img
              src={msg.sender === "You" ? "/user.webp" : "/bot.png"}
              alt={msg.sender}
              className="avatar"
            />
            <div className="message-bubble">
              {msg.loading ? (
                <span className="loader"></span>
              ) : (
                msg.text
              )}
            </div>
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
          disabled={loading}
        />
        <button onClick={sendMessage} className="send-button" disabled={loading}>Send</button>
      </div>
    </div>
  );
}

export default App;