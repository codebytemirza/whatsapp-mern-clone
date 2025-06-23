import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const SocketProvider = ({ user, children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (user) {
      const s = io('http://localhost:5000');
      setSocket(s);
      s.emit('user:online', user._id);

      s.on('user:online', (userId) => {
        setOnlineUsers(prev => [...new Set([...prev, userId])]);
      });

      s.on('user:offline', (userId) => {
        setOnlineUsers(prev => prev.filter(id => id !== userId));
      });

      // Listen for initial online users list
      s.on('online:users', (users) => {
        setOnlineUsers(users);
      });

      return () => {
        s.disconnect();
      };
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);