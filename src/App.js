import React, { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatPage from './pages/ChatPage';

const App = () => {
  const [user, setUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  // Store user in localStorage on login/register
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('jwt');
    }
  }, [user]);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('jwt');
  };

  if (!user) {
    return showRegister ? (
      <>
        <RegisterPage onRegister={setUser} />
        <button
          onClick={() => setShowRegister(false)}
          className="auth-switch-btn"
        >
          Already have an account?
        </button>
      </>
    ) : (
      <>
        <LoginPage onLogin={setUser} />
        <button
          onClick={() => setShowRegister(true)}
          className="auth-switch-btn"
        >
          Create new account
        </button>
      </>
    );
  }

  return <ChatPage user={user} onLogout={handleLogout} />;
};

export default App;
