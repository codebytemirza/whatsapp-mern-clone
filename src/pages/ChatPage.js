import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ChatBox from '../components/ChatBox';
import { SocketProvider } from '../context/SocketContext';

const ChatPage = ({ user, onLogout }) => {
  const [selectedContact, setSelectedContact] = useState(null);

  return (
    <SocketProvider user={user}>
      <div className="main-chat-layout">
        <Sidebar user={user} onSelectContact={setSelectedContact} onLogout={onLogout} />
        <div className="main-chat-panel">
          {selectedContact ? (
            <ChatBox
              user={user}
              contact={selectedContact}
              onClose={() => setSelectedContact(null)}
            />
          ) : (
            <div className="main-chat-placeholder">
              Select a contact to start chatting
            </div>
          )}
        </div>
      </div>
    </SocketProvider>
  );
};

export default ChatPage;
