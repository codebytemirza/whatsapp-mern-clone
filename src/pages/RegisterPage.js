import React, { useState } from 'react';
import axios from '../api/axios';

const RegisterPage = ({ onRegister }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const registerHandler = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/auth/register', { name, email, password });
      localStorage.setItem('jwt', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onRegister(res.data.user);
    } catch (err) {
      alert(err.response?.data?.error || 'Register failed');
    }
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-logo">
          <span role="img" aria-label="logo">💬</span>
        </div>
        <h2 className="auth-title">Create WhatsApp Account</h2>
        <form onSubmit={registerHandler} className="auth-form">
          <input
            type="text"
            placeholder="Name"
            onChange={e => setName(e.target.value)}
            required
            className="auth-input"
          />
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
            Register
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;

