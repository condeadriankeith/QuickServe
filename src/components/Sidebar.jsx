import React from 'react';
import { FaBolt, FaCheckCircle, FaUtensils, FaHamburger, FaWineGlass } from 'react-icons/fa';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock } from '@fortawesome/free-solid-svg-icons';
import './Sidebar.css';

const Sidebar = ({ activeTab, onTabChange, counts, role, todayStats, sidebarOpen, setSidebarOpen }) => {
  // Statistics Segment (bottom panel)
  const renderStats = () => {
    if (!todayStats) return null;
    const { date, dayOfWeek, totalOrders, completedOrders, cancelledOrders, topItems, avgCompletionTime, totalSales, numTransactions, lowStockItems } = todayStats;
    return (
      <div className="sidebar-stats animated-stats">
        <div className="stats-header">
          <span className="stats-title">Today's Stats</span>
          <span className="stats-date">{date} ({dayOfWeek})</span>
        </div>
        <div className="stats-section">
          <div className="stats-label">Orders</div>
          <div className="stats-row"><span>Total:</span><span>{totalOrders}</span></div>
          <div className="stats-row"><span>Completed:</span><span>{completedOrders}</span></div>
          <div className="stats-row"><span>Cancelled:</span><span>{cancelledOrders}</span></div>
          <div className="stats-row"><span>Top Items:</span><span>{topItems && topItems.length > 0 ? topItems.map((item, i) => <span key={i} className="top-item">{item}</span>) : '-'}</span></div>
          <div className="stats-row"><span>Avg. Completion:</span><span>{avgCompletionTime}</span></div>
        </div>
        <div className="stats-section">
          <div className="stats-label">Sales</div>
          <div className="stats-row"><span>Total Sales:</span><span>₱{totalSales}</span></div>
          <div className="stats-row"><span>Transactions:</span><span>{numTransactions}</span></div>
        </div>
        {lowStockItems && lowStockItems.length > 0 && (
          <div className="stats-section">
            <div className="stats-label" style={{ color: '#ff3b30' }}>Low-Stock Food Items</div>
            {lowStockItems.map((item, i) => (
              <div className="stats-row" key={item.category + '-' + item.name}>
                <span>{item.name} <span style={{ color: '#888', fontWeight: 500, fontSize: 12 }}>({item.category})</span></span>
                <span style={{ color: '#ff3b30', fontWeight: 700 }}>{item.stock} left</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Close sidebar on mobile when clicking outside
  React.useEffect(() => {
    if (!sidebarOpen) return;
    function handleClick(e) {
      const sidebar = document.querySelector('.sidebar');
      if (sidebar && !sidebar.contains(e.target)) {
        setSidebarOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [sidebarOpen, setSidebarOpen]);

  if (role === 'admin') {
    return (
      <>
        {/* Overlay for mobile */}
        {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}
        <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
          <div className="sidebar-section-title">Menu</div>
          <nav className="sidebar-nav">
            <div
              className={`nav-item${activeTab === 'Appetizer' ? ' active' : ''}`}
              onClick={() => { onTabChange('Appetizer'); setSidebarOpen(false); }}
              style={{ cursor: 'pointer' }}
            >
              <FaUtensils className="nav-icon" />
              <span className="nav-text">Appetizers</span>
            </div>
            <div
              className={`nav-item${activeTab === 'Main' ? ' active' : ''}`}
              onClick={() => { onTabChange('Main'); setSidebarOpen(false); }}
              style={{ cursor: 'pointer' }}
            >
              <FaHamburger className="nav-icon" />
              <span className="nav-text">Mains</span>
            </div>
            <div
              className={`nav-item${activeTab === 'Drink' ? ' active' : ''}`}
              onClick={() => { onTabChange('Drink'); setSidebarOpen(false); }}
              style={{ cursor: 'pointer' }}
            >
              <FaWineGlass className="nav-icon" />
              <span className="nav-text">Drinks</span>
            </div>
          </nav>
          {renderStats()}
        </aside>
      </>
    );
  }
  // Default (server) view
  return (
    <>
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-section-title">Orders</div>
        <nav className="sidebar-nav">
          <div
            className={`nav-item${activeTab === 'active' ? ' active' : ''}`}
            onClick={() => { onTabChange('active'); setSidebarOpen(false); }}
            style={{ cursor: 'pointer' }}
          >
            <FaBolt className="nav-icon" />
            <span className="nav-text">Active Orders</span>
            <span className="badge">{counts.active}</span>
          </div>
          <div
            className={`nav-item${activeTab === 'pending' ? ' active' : ''}`}
            onClick={() => { onTabChange('pending'); setSidebarOpen(false); }}
            style={{ cursor: 'pointer' }}
          >
            <FontAwesomeIcon icon={faClock} className="nav-icon" />
            <span className="nav-text">Pending</span>
            <span className="count">{counts.pending}</span>
          </div>
          <div
            className={`nav-item${activeTab === 'completed' ? ' active' : ''}`}
            onClick={() => { onTabChange('completed'); setSidebarOpen(false); }}
            style={{ cursor: 'pointer' }}
          >
            <FaCheckCircle className="nav-icon green" />
            <span className="nav-text">Completed</span>
            <span className="count green">{counts.completed}</span>
          </div>
        </nav>
        {renderStats()}
      </aside>
    </>
  );
};

export default Sidebar;
