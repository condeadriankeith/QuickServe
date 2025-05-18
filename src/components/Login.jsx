import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaSpinner } from 'react-icons/fa';
import './Login.css';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [targetPos, setTargetPos] = useState({ x: 50, y: 50 });
  const [gradientPos, setGradientPos] = useState({ x: 50, y: 50 });
  const [autoAnimate, setAutoAnimate] = useState(true);
  const rafRef = useRef();
  const timeRef = useRef(0);
  const navigate = useNavigate();

  useEffect(() => {
    const bg = document.querySelector('.login-bg');
    if (!bg) return;
    const handleMouseMove = (e) => {
      const rect = bg.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setTargetPos({ x, y });
      setAutoAnimate(false);
    };
    const handleMouseEnter = () => setAutoAnimate(false);
    const handleMouseLeave = () => setAutoAnimate(true);
    bg.addEventListener('mousemove', handleMouseMove);
    bg.addEventListener('mouseenter', handleMouseEnter);
    bg.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      bg.removeEventListener('mousemove', handleMouseMove);
      bg.removeEventListener('mouseenter', handleMouseEnter);
      bg.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  useEffect(() => {
    const animate = () => {
      setGradientPos((prev) => {
        let x = prev.x;
        let y = prev.y;
        if (autoAnimate) {
          timeRef.current += 0.012;
          x = 50 + 30 * Math.cos(timeRef.current);
          y = 50 + 30 * Math.sin(timeRef.current * 0.8);
          setTargetPos({ x, y });
        }
        const lerp = (a, b, t) => a + (b - a) * t;
        x = lerp(prev.x, targetPos.x, 0.12);
        y = lerp(prev.y, targetPos.y, 0.12);
        const bg = document.querySelector('.login-bg');
        if (bg) {
          bg.style.setProperty('--gradient-x', `${x}%`);
          bg.style.setProperty('--gradient-y', `${y}%`);
        }
        return { x, y };
      });
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [targetPos, autoAnimate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { // Simulate async login
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
      setLoading(false);
    }, 900);
  };

  return (
    <div className="login-bg">
      <div className="login-container">
        <h1 className="login-title">QuickServe</h1>
        <form className="login-box" onSubmit={handleSubmit} autoComplete="off">
          <h2>Login</h2>
          <div className="input-group icon-input-group">
            <label htmlFor="username">Username</label>
            <div className="input-icon-wrapper">
              <FaUser className="input-icon" />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                placeholder="Enter username"
              />
            </div>
          </div>
          <div className="input-group icon-input-group">
            <label htmlFor="password">Password</label>
            <div className="input-icon-wrapper">
              <FaLock className="input-icon" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                placeholder="Enter password"
              />
              <button
                type="button"
                className="show-password-btn"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          {error && <div className="login-error">{error}</div>}
          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? <FaSpinner className="spinner" /> : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login; 