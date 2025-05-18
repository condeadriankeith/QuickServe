import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaMoon, FaSun } from 'react-icons/fa';
import { useTheme } from '../ThemeContext';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // For demo gradient animation
  const [gradientPos, setGradientPos] = useState({ x: '50%', y: '50%' });
  useEffect(() => {
    const handleMouseMove = (e) => {
      // Only move gradient a little for subtle effect
      const x = ((e.clientX / window.innerWidth) * 30) + 35;
      const y = ((e.clientY / window.innerHeight) * 30) + 35;
      setGradientPos({ x: `${x}%`, y: `${y}%` });
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Custom gradient animation using CSS variables
  useEffect(() => {
    document.documentElement.style.setProperty('--gradient-x', gradientPos.x);
    document.documentElement.style.setProperty('--gradient-y', gradientPos.y);
  }, [gradientPos]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (username && password) {
      if (password === 'admin123') {
        onLogin('admin');
        navigate('/');
      } else if (password === 'server123') {
        onLogin('server');
        navigate('/');
      } else {
        setError('Invalid password. Try "admin123" or "server123".');
      }
    } else {
      setError('Please enter both username and password.');
    }
  };

  return (
    <div className="login-bg">
      <div className="theme-toggle-container">
        <button className="login-theme-toggle" onClick={toggleTheme}>
          {theme === 'dark' ? <FaSun className="theme-toggle-icon" /> : <FaMoon className="theme-toggle-icon" />}
        </button>
      </div>
      <div className="login-title">
        <img src="https://cdn-icons-png.flaticon.com/512/3427/3427703.png" alt="QuickServe" className="login-logo" />
        <h1>QuickServe</h1>
      </div>
      <div className="login-box">
        <h2>Staff Login</h2>
        {error && <div className="login-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <div className="input-icon-wrapper">
              <FaUser className="input-icon" />
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
              />
            </div>
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className="input-icon-wrapper">
              <FaLock className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
              />
              <button
                type="button"
                className="show-password-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <button type="submit" className="login-btn">Log In</button>
        </form>
      </div>
    </div>
  );
};

export default Login; 