import React, { useState, useRef, useEffect } from 'react';

export default function ChatBox({ isOpen, onClose, messages, onSendMessage, employeeName, user }) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage('');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed right-0 top-0 h-screen bg-white shadow-xl transition-transform duration-300 ease-in-out transform 
        ${isOpen ? 'translate-x-0' : 'translate-x-full'} w-80 flex flex-col border-l`}
    >
      {/* Header */}
      <div className="p-3 bg-blue-500 text-white flex justify-between items-center">
        <h3 className="font-semibold">Chat with {employeeName}</h3>
        <button onClick={onClose} className="text-white hover:text-gray-200">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`max-w-[75%] p-2 rounded-lg ${
              msg.senderId === user?.uid
                ? 'bg-blue-500 text-white ml-auto rounded-br-none'
                : 'bg-gray-100 text-gray-800 rounded-bl-none'
            }`}
          >
            <p className="text-sm">{msg.text}</p>
            <span className={`text-xs ${msg.senderId === user?.uid ? 'text-blue-50' : 'text-gray-500'}`}>
              {new Date(msg.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
