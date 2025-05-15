import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === 'server1' && password === '1234') {
      setError('');
      onLogin('server');
      navigate('/');
    } else if (username === 'admin' && password === 'admin') {
      setError('');
      onLogin('admin');
      navigate('/');
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="login-bg">
      <div className="login-container">
        <h1 className="login-title">QuickServe</h1>
        <form className="login-box" onSubmit={handleSubmit}>
          <h2>Login</h2>
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          {error && <div className="login-error">{error}</div>}
          <button className="login-btn" type="submit">Log In</button>
        </form>
      </div>
    </div>
  );
};

export default Login; 