import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKitchenSet } from '@fortawesome/free-solid-svg-icons';
import { FaBell } from 'react-icons/fa';
import './Header.css';

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

const Header = ({ notifications = [], unreadCount = 0, notifPopupOpen = false, setNotifPopupOpen = () => {}, onLogout }) => {
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const notifBtnRef = useRef(null);
  const notifPopupRef = useRef(null);
  const [bellAnim, setBellAnim] = useState(false);
  const prevNotifCount = useRef(notifications.length);

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
    if (onLogout) onLogout();
  };

  return (
    <header className="header">
      <div className="logo">
        <img src="https://cdn-icons-png.flaticon.com/512/3427/3427703.png" alt="Cooking Pot" className="cookingpot-icon white-icon" style={{ width: 28, height: 28, objectFit: 'contain' }} />
        <h1>QuickServe</h1>
      </div>
      <div className="user-actions">
        <button
          className="notification-btn"
          ref={notifBtnRef}
          onClick={() => {
            setNotifPopupOpen(v => !v);
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
        <div className="avatar" style={{ position: 'relative' }}>
          <img
            src="https://ui-avatars.com/api/?name=User&background=246BFD&color=fff"
            alt="User"
            style={{ cursor: 'pointer' }}
            onClick={() => setLogoutModalOpen(true)}
          />
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
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
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
                  background: '#eee',
                  color: '#333',
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
