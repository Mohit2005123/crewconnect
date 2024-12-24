import React, { useState, useRef, useEffect } from 'react';

export default function ChatBox({ isOpen, onClose, messages, onSendMessage, employeeName, user, width, onWidthChange }) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }; 

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen]);
  

  useEffect(() => {
    const handleMouseDown = (e) => {
      if (e.target === dragRef.current) {
        setIsDragging(true);
      }
    };

    const handleMouseMove = (e) => {
      if (isDragging) {
        const newWidth = window.innerWidth - e.clientX;
        // Limit width between 280px and 600px
        const limitedWidth = Math.min(Math.max(newWidth, 280), 600);
        onWidthChange(limitedWidth);
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onWidthChange]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage('');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Drag handle */}
      <div
        ref={dragRef}
        className="fixed top-[64px] bottom-0 w-1 bg-gray-300 hover:bg-blue-500 cursor-ew-resize z-50"
        style={{ left: `calc(100% - ${width}px)` }}
        onMouseDown={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
      />

      <div 
        className="fixed right-0 top-[64px] h-[calc(100vh-64px)] bg-white shadow-xl border-l flex flex-col"
        style={{ width: `${width}px` }}
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
    </>
  );
}
