import React, { useState } from 'react';
import axios from '../api/axios';


const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const loginHandler = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/auth/login', { email, password });
      localStorage.setItem('jwt', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLogin(res.data.user);
    } catch (err) {
      alert(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-logo">
          <span role="img" aria-label="logo">💬</span>
        </div>
        <h2 className="auth-title">Login to WhatsApp</h2>
        <form onSubmit={loginHandler} className="auth-form">
          <input
            type="email"
            placeholder="Email"
            onChange={e => setEmail(e.target.value)}
            required
            className="auth-input"
          />
          <input
            type="password"
            placeholder="Password"
            onChange={e => setPassword(e.target.value)}
            required
            className="auth-input"
          />
          <button
            type="submit"
            className="auth-btn"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

