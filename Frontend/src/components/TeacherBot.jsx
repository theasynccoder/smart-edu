import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Loader, User, Bot } from 'lucide-react';

const TeacherBot = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { type: 'bot', content: 'Hello! I can help you find student information. Try asking about a student by name, class, or roll number.' }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const formatStudentData = (student) => {
    if (!student) return 'No student found.';
    return (
      <div className="student-card">
        <div className="student-name">{student.name}</div>
        <div className="student-grid">
          <div className="student-field">
            <span className="field-label">Roll No</span>
            <span className="field-value">{student.roll_no}</span>
          </div>
          <div className="student-field">
            <span className="field-label">Class</span>
            <span className="field-value">{student.class}</span>
          </div>
          <div className="student-field">
            <span className="field-label">Email</span>
            <span className="field-value">{student.email}</span>
          </div>
          <div className="student-field">
            <span className="field-label">Phone</span>
            <span className="field-value">{student.phone_no}</span>
          </div>
          {student.address && (
            <div className="student-field full-width">
              <span className="field-label">Address</span>
              <span className="field-value">{student.address}</span>
            </div>
          )}
          {student.dob && (
            <div className="student-field">
              <span className="field-label">Date of Birth</span>
              <span className="field-value">{new Date(student.dob).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const addBotMessage = (content) => {
    setMessages(prev => [...prev, { type: 'bot', content }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setMessages(prev => [...prev, { type: 'user', content: userText }]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post(`${import.meta.env.VITE_CHATBOT_URL}/query`, {
      });

      const students = response.data.results;
      const noStudentsMessage = response.data.message;

      if (noStudentsMessage) {
        addBotMessage(noStudentsMessage);
      } else if (students && students.length > 0) {
        if (students.length === 1) {
          addBotMessage('Here is the student I found:');
        } else {
          addBotMessage(`I found ${students.length} students:`);
        }
        students.forEach((student) => {
          setMessages(prev => [...prev, { type: 'bot', content: formatStudentData(student) }]);
        });
      } else {
        addBotMessage("No students found matching your query. Try asking differently, e.g. 'show students in class 10A' or 'find Rahul'.");
      }
    } catch (err) {
      console.error('Chatbot error:', err);
      addBotMessage('Sorry, I encountered an error. Please make sure the chatbot server is running and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-icon">
          <Bot size={22} />
        </div>
        <div>
          <h1 className="chat-header-title">Student Information Assistant</h1>
          <p className="chat-header-subtitle">Ask me about any student</p>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message-row ${message.type}`}>
            <div className="message-avatar">
              {message.type === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className="message-bubble">
              {typeof message.content === 'string' ? message.content : message.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="message-row bot">
            <div className="message-avatar">
              <Bot size={16} />
            </div>
            <div className="message-bubble typing-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-area">
        <form onSubmit={handleSubmit} className="chat-form">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about a student (e.g. 'show students in class 10A')"
            className="chat-input"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="chat-send-btn"
          >
            {loading ? <Loader size={18} className="spin" /> : <Send size={18} />}
          </button>
        </form>
      </div>

      <style>{`
        .chat-container {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #f0f4f8;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .chat-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          background: linear-gradient(135deg, #2563eb, #4f46e5);
          color: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }

        .chat-header-icon {
          background: rgba(255,255,255,0.2);
          border-radius: 50%;
          padding: 8px;
          display: flex;
        }

        .chat-header-title {
          font-size: 17px;
          font-weight: 600;
          margin: 0;
        }

        .chat-header-subtitle {
          font-size: 12px;
          opacity: 0.8;
          margin: 2px 0 0;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .message-row {
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }

        .message-row.user {
          flex-direction: row-reverse;
        }

        .message-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .message-row.bot .message-avatar {
          background: #e0e7ff;
          color: #4f46e5;
        }

        .message-row.user .message-avatar {
          background: #2563eb;
          color: white;
        }

        .message-bubble {
          max-width: 70%;
          padding: 10px 14px;
          border-radius: 16px;
          font-size: 14px;
          line-height: 1.5;
          word-break: break-word;
        }

        .message-row.bot .message-bubble {
          background: white;
          color: #1e293b;
          border-top-left-radius: 4px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }

        .message-row.user .message-bubble {
          background: #2563eb;
          color: white;
          border-top-right-radius: 4px;
        }

        /* Student card inside bot bubble */
        .student-card {
          min-width: 240px;
        }

        .student-name {
          font-size: 15px;
          font-weight: 700;
          color: #1e40af;
          margin-bottom: 10px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e0e7ff;
        }

        .student-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .student-field {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .student-field.full-width {
          grid-column: span 2;
        }

        .field-label {
          font-size: 11px;
          font-weight: 600;
          color: #6366f1;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .field-value {
          font-size: 13px;
          color: #334155;
          font-weight: 500;
        }

        /* Typing indicator */
        .typing-dots {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 12px 16px;
        }

        .typing-dots span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #94a3b8;
          animation: dot-bounce 1.2s ease-in-out infinite;
        }

        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes dot-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }

        /* Input area */
        .chat-input-area {
          padding: 12px 16px;
          background: white;
          border-top: 1px solid #e2e8f0;
        }

        .chat-form {
          display: flex;
          gap: 8px;
          max-width: 800px;
          margin: 0 auto;
        }

        .chat-input {
          flex: 1;
          padding: 10px 16px;
          border: 1.5px solid #e2e8f0;
          border-radius: 24px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
          background: #f8fafc;
        }

        .chat-input:focus {
          border-color: #2563eb;
          background: white;
        }

        .chat-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .chat-send-btn {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: none;
          background: #2563eb;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          flex-shrink: 0;
        }

        .chat-send-btn:hover:not(:disabled) {
          background: #1d4ed8;
          transform: scale(1.05);
        }

        .chat-send-btn:disabled {
          background: #94a3b8;
          cursor: not-allowed;
          transform: none;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Scrollbar */
        .chat-messages::-webkit-scrollbar { width: 4px; }
        .chat-messages::-webkit-scrollbar-track { background: transparent; }
        .chat-messages::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
      `}</style>
    </div>
  );
};

export default TeacherBot;