import React, { useEffect, useRef, useState } from 'react';
import axios from '../api/axios';
import { useSocket } from '../context/SocketContext';

const ChatBox = ({ user, contact, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { socket, onlineUsers } = useSocket();
  const typingTimeout = useRef(null);
  const typingSent = useRef(false);

  // Load chat history
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const res = await axios.get(`/messages/${contact._id}`);
        setMessages(res.data);
      } catch (err) {
        console.error('Failed to load messages', err);
      }
    };

    if (contact) {
      loadMessages();
    }
  }, [contact]);

  // Receive messages + typing indicators
  useEffect(() => {
    if (!socket || !contact) return;

    const handleMessage = (msg) => {
      if (msg.senderId === contact._id) {
        setMessages((prev) => [...prev, msg]);
        // Emit delivered if message is for me
        socket.emit('message:delivered', {
          messageId: msg._id,
          receiverId: msg.senderId,
        });
      }
    };

    const handleDelivered = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, status: 'delivered' } : m
        )
      );
    };

    const handleSeen = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, status: 'seen' } : m
        )
      );
    };

    const handleTypingStart = ({ senderId }) => {
      if (senderId === contact._id) setIsTyping(true);
    };

    const handleTypingStop = ({ senderId }) => {
      if (senderId === contact._id) setIsTyping(false);
    };

    socket.on('message:receive', handleMessage);
    socket.on('message:delivered', handleDelivered);
    socket.on('message:seen', handleSeen);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);

    return () => {
      socket.off('message:receive', handleMessage);
      socket.off('message:delivered', handleDelivered);
      socket.off('message:seen', handleSeen);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contact]);

  // Emit typing status (improved)
  useEffect(() => {
    if (!socket || !contact) return;

    if (text.trim().length > 0 && !typingSent.current) {
      socket.emit('typing:start', { receiverId: contact._id });
      typingSent.current = true;
    }

    if (typingTimeout.current) clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(() => {
      if (typingSent.current) {
        socket.emit('typing:stop', { receiverId: contact._id });
        typingSent.current = false;
      }
    }, 1000);

    return () => {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, contact, socket]);

  // Stop typing when message is sent
  const sendMessage = async () => {
    if (!text.trim()) return;

    const msg = {
      receiverId: contact._id,
      message: text,
      type: 'text'
    };

    try {
      const res = await axios.post('/messages/send', msg);
      setMessages((prev) => [...prev, res.data]);
      socket.emit('message:send', res.data);
      setText('');
      // Stop typing immediately after sending
      if (typingSent.current) {
        socket.emit('typing:stop', { receiverId: contact._id });
        typingSent.current = false;
      }
    } catch (err) {
      console.error('Message send failed', err);
    }
  };

  // Mark messages as seen when chat is open and messages are from contact
  useEffect(() => {
    if (!socket || !contact) return;
    const unseen = messages.filter(
      (m) => m.senderId === contact._id && m.status !== 'seen'
    );
    if (unseen.length > 0) {
      unseen.forEach((msg) => {
        socket.emit('message:seen', {
          messageId: msg._id,
          receiverId: msg.senderId,
        });
      });
    }
    // eslint-disable-next-line
  }, [messages, contact, socket]);

  // Helper: format time (show exact date and time from DB)
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    // Format: YYYY-MM-DD HH:mm:ss
    const pad = n => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  // Helper: WhatsApp-style status emoji
  const getTick = (msg) => {
    if (msg.senderId !== user._id) return null;
    if (msg.status === 'seen') {
      return <span className="chatbox-tick chatbox-tick-seen">✔✔</span>;
    }
    if (msg.status === 'delivered') {
      return <span className="chatbox-tick chatbox-tick-delivered">✔✔</span>;
    }
    return <span className="chatbox-tick">✔</span>;
  };

  // Scroll to bottom on new messages
  const messagesEndRef = useRef(null);
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Esc key closes chat
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose && onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Helper: check if contact is online
  const isContactOnline = onlineUsers && contact && onlineUsers.includes(contact._id);

  return (
    <div className="chatbox">
      {/* Header */}
      <div className="chatbox-header" style={{ position: 'relative' }}>
        <div className="chatbox-header-avatar">
          {contact.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()}
        </div>
        <div className="chatbox-header-info">
          <div className="chatbox-header-name">{contact.name}</div>
          <div className="chatbox-header-status">
            {isContactOnline ? (
              <span className="chatbox-header-online">online</span>
            ) : (
              <span>offline</span>
            )}
          </div>
        </div>
        {/* Close button (visible on mobile and desktop) */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: '#888',
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: 0,
            marginLeft: 'auto'
          }}
          aria-label="Close chat"
          title="Close chat"
        >
          ×
        </button>
      </div>
      {/* Messages */}
      <div className="chatbox-messages">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`chatbox-message-row ${m.senderId === user._id ? 'chatbox-message-row-own' : ''}`}
          >
            <div
              className={`chatbox-message-bubble ${m.senderId === user._id ? 'chatbox-message-bubble-own' : ''}`}
            >
              <span>{m.message}</span>
              <span className="chatbox-message-meta">
                {formatTime(m.createdAt || m.timestamp)}
                {getTick(m)}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      {/* Typing indicator */}
      {isTyping && (
        <div className="chatbox-typing">{contact.name} is typing...</div>
      )}
      {/* Input */}
      <div className="chatbox-input-row">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your message..."
          className="chatbox-input"
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="chatbox-send-btn"
          aria-label="Send"
          disabled={!text.trim()}
        >
          {/* WhatsApp-style paper plane SVG */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path d="M3.4 20.29L20.29 12.01C21.07 11.63 21.07 10.51 20.29 10.13L3.4 1.85C2.62 1.47 1.77 2.19 2.01 3.03L4.43 11.01C4.52 11.3 4.52 11.61 4.43 11.9L2.01 19.88C1.77 20.72 2.62 21.44 3.4 21.06V20.29Z"
              fill="currentColor"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
