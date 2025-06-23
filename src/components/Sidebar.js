import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import { useSocket } from '../context/SocketContext';

const Sidebar = ({ user, onSelectContact, onLogout }) => {
  const [contacts, setContacts] = useState([]);
  const [lastMessages, setLastMessages] = useState({});
  const [profileOpen, setProfileOpen] = useState(false);
  const { onlineUsers } = useSocket();

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await axios.get('/users/contacts');
        setContacts(res.data);

        // Fetch last message for each contact
        const lastMsgObj = {};
        await Promise.all(
          res.data.map(async (contact) => {
            try {
              const msgRes = await axios.get(`/messages/${contact._id}`);
              const msgs = msgRes.data;
              if (msgs && msgs.length > 0) {
                lastMsgObj[contact._id] = msgs[msgs.length - 1].message;
              }
            } catch {}
          })
        );
        setLastMessages(lastMsgObj);
      } catch (err) {
        console.error('Error loading contacts', err);
      }
    };
    fetchContacts();
  }, []);

  const isOnline = (id) => onlineUsers.includes(id);

  // Helper: get initials
  const getInitials = (name) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();

  return (
    <div className="sidebar">
      {/* WhatsApp-style profile avatar at top */}
      <div className="sidebar-profilebar">
        <button
          className="sidebar-profilebar-avatar"
          onClick={() => setProfileOpen(true)}
          title="Profile"
        >
          {getInitials(user.name)}
        </button>
        <span className="sidebar-app-title" style={{
          color: '#00a884',
          fontWeight: 600,
          fontSize: '1.25rem',
          marginLeft: '16px',
          letterSpacing: '1px'
        }}>
          WhatsApp Clone
        </span>
      </div>
      {/* Profile Modal */}
      {profileOpen && (
        <div className="sidebar-profile-modal" onClick={() => setProfileOpen(false)}>
          <div className="sidebar-profile-modal-content" onClick={e => e.stopPropagation()}>
            <div className="sidebar-profile-modal-avatar">
              {getInitials(user.name)}
            </div>
            <div className="sidebar-profile-modal-name">{user.name}</div>
            <div className="sidebar-profile-modal-email">{user.email}</div>
            <button
              className="sidebar-profile-modal-logout"
              onClick={onLogout}
            >
              Logout
            </button>
            <button
              className="sidebar-profile-modal-close"
              onClick={() => setProfileOpen(false)}
              title="Close"
            >×</button>
          </div>
        </div>
      )}
      <div className="sidebar-header">
        <h3>Chats</h3>
      </div>
      <div className="sidebar-contacts">
        {contacts.map(contact => (
          <div
            key={contact._id}
            onClick={() => onSelectContact(contact)}
            className="sidebar-contact"
          >
            <div className="sidebar-contact-avatar-wrapper">
              <div className="sidebar-contact-avatar">
                {getInitials(contact.name)}
              </div>
              {isOnline(contact._id) && (
                <span className="sidebar-contact-online"></span>
              )}
            </div>
            <div className="sidebar-contact-info">
              <div className="sidebar-contact-name">{contact.name}</div>
              <div className="sidebar-contact-lastmsg">
                {lastMessages[contact._id] || 'No messages yet'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
