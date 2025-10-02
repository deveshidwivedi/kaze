import React from 'react';

const ChatMessage = ({ message, isUser }) => {
  return (
    <div className={`message ${isUser ? 'user' : 'assistant'}`}>
      {message}
    </div>
  );
};

export default ChatMessage;
