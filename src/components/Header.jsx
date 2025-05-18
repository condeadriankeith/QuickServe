import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKitchenSet } from '@fortawesome/free-solid-svg-icons';
import { FaBell, FaMoon, FaSun } from 'react-icons/fa';
import './Header.css';
import { useTheme } from '../ThemeContext';

function timeAgo(timestamp) {
  const now = Date.now();
  const seconds = Math.floor((now - timestamp) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours} hour${hours > 1 ? 's' : ''} ago`;
}

const Header = ({ notifications = [], unreadCount = 0, notifPopupOpen = false, setNotifPopupOpen = () => {}, onLogout, onSidebarToggle, sidebarOpen }) => {
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [profilePopupOpen, setProfilePopupOpen] = useState(false);
  const notifBtnRef = useRef(null);
  const notifPopupRef = useRef(null);
  const profileRef = useRef(null);
  const profilePopupRef = useRef(null);
  const [bellAnim, setBellAnim] = useState(false);
  const prevNotifCount = useRef(notifications.length);
  const { theme, toggleTheme } = useTheme();

  // Close notification popup on outside click
  useEffect(() => {
    if (!notifPopupOpen) return;
    function handleClick(e) {
      if (
        notifPopupRef.current &&
        !notifPopupRef.current.contains(e.target) &&
        notifBtnRef.current &&
        !notifBtnRef.current.contains(e.target)
      ) {
        setNotifPopupOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [notifPopupOpen]);

  // Close profile popup on outside click
  useEffect(() => {
    if (!profilePopupOpen) return;
    function handleClick(e) {
      if (
        profilePopupRef.current &&
        !profilePopupRef.current.contains(e.target) &&
        profileRef.current &&
        !profileRef.current.contains(e.target)
      ) {
        setProfilePopupOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [profilePopupOpen]);

  // Animate bell on every new notification
  useEffect(() => {
    if (notifications.length > prevNotifCount.current) {
      setBellAnim(false); // reset first to allow re-trigger
      setTimeout(() => setBellAnim(true), 10); // short delay to re-add class
    }
    prevNotifCount.current = notifications.length;
  }, [notifications.length]);

  const handleLogoutClick = () => {
    setLogoutModalOpen(false);
    setProfilePopupOpen(false);
    if (onLogout) onLogout();
  };

  return (
    <header className="header">
      <div className="logo">
        {/* Hamburger toggle for mobile, left of logo/title */}
        <button
          className="sidebar-toggle"
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          onClick={onSidebarToggle}
        >
          <span style={{ display: 'inline-block', width: 28, height: 28 }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect y="5" width="28" height="3" rx="1.5" fill="#fff" />
              <rect y="12.5" width="28" height="3" rx="1.5" fill="#fff" />
              <rect y="20" width="28" height="3" rx="1.5" fill="#fff" />
            </svg>
          </span>
        </button>
        <img src="https://cdn-icons-png.flaticon.com/512/3427/3427703.png" alt="Cooking Pot" className="cookingpot-icon white-icon" style={{ width: 28, height: 28, objectFit: 'contain' }} />
        <h1>QuickServe</h1>
      </div>
      <div className="user-actions">
        <button
          className="notification-btn"
          ref={notifBtnRef}
          onClick={() => {
            setNotifPopupOpen(v => !v);
            setProfilePopupOpen(false);
          }}
        >
          {unreadCount > 0 && (
            <span className="notif-pill animate-pill-in">
              <span className="notif-pill-count">{unreadCount}</span>
            </span>
          )}
          <FaBell className={bellAnim ? 'bell-animate' : ''} onAnimationEnd={() => setBellAnim(false)} />
        </button>
        {notifPopupOpen && (
          <div className="notif-popup animate-in" ref={notifPopupRef}>
            <div className="notif-popup-header">Notifications</div>
            {notifications.length === 0 && <div className="notif-empty">No notifications</div>}
            <ul className="notif-list">
              {notifications.slice().reverse().map(n => (
                <li key={n.id} className={`notif-item${n.read ? '' : ' unread'}`}> 
                  <div className="notif-message">{n.message}</div>
                  <div className="notif-time">{timeAgo(n.timestamp)}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="avatar" style={{ position: 'relative' }} ref={profileRef}>
          <img
            src="https://ui-avatars.com/api/?name=User&background=246BFD&color=fff"
            alt="User"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setProfilePopupOpen(v => !v);
              setNotifPopupOpen(false);
            }}
          />
          {profilePopupOpen && (
            <div className="profile-popup" ref={profilePopupRef}>
              <button className="theme-toggle-btn" onClick={toggleTheme}>
                {theme === 'dark' ? (
                  <>
                    <FaSun className="theme-icon" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <FaMoon className="theme-icon" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>
              <button className="logout-btn" onClick={() => setLogoutModalOpen(true)}>
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Centered logout modal */}
      {logoutModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.35)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div
            style={{
              background: theme === 'dark' ? '#23242a' : '#fff',
              color: theme === 'dark' ? '#f3f3f3' : '#333',
              borderRadius: 12,
              boxShadow: theme === 'dark' ? '0 8px 32px rgba(0,0,0,0.65)' : '0 8px 32px rgba(0,0,0,0.18)',
              padding: '24px',
              width: 320,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'fadeScaleIn 0.28s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            <div style={{fontSize: 14, marginBottom: 12, textAlign: 'center', width: '100%'}}>Are you sure you want to log out?</div>
            <div style={{
              display: 'flex',
              gap: 12,
              width: '100%',
              alignItems: 'stretch',
              justifyContent: 'center',
              height: 56,
            }}>
              <button
                style={{
                  background: theme === 'dark' ? '#18191c' : '#eee',
                  color: theme === 'dark' ? '#f3f3f3' : '#333',
                  fontSize: 16,
                  fontWeight: 500,
                  borderRadius: 6,
                  padding: 0,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.18s',
                  width: '50%',
                  height: '100%',
                  display: 'block',
                }}
                onClick={() => setLogoutModalOpen(false)}
              >
                Cancel
              </button>
              <button
                style={{
                  background: '#F45D22',
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 700,
                  borderRadius: 6,
                  padding: 0,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.18s',
                  width: '50%',
                  height: '100%',
                  display: 'block',
                }}
                onClick={handleLogoutClick}
              >
                Log Out
              </button>
            </div>
          </div>
          {/* Modal animation keyframes */}
          <style>{`
            @keyframes fadeScaleIn {
              0% { opacity: 0; transform: scale(0.92); }
              100% { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </div>
      )}
    </header>
  );
};

export default Header;
