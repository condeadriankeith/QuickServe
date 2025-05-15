import React from 'react';
import { FaBolt, FaCheckCircle, FaUtensils, FaHamburger, FaWineGlass } from 'react-icons/fa';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock } from '@fortawesome/free-solid-svg-icons';
import './Sidebar.css';

const Sidebar = ({ activeTab, onTabChange, counts, role, todayStats }) => {
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

  if (role === 'admin') {
    return (
      <aside className="sidebar">
        <nav className="sidebar-nav">
          <div
            className={`nav-item${activeTab === 'Appetizer' ? ' active' : ''}`}
            onClick={() => onTabChange('Appetizer')}
            style={{ cursor: 'pointer' }}
          >
            <FaUtensils className="nav-icon" />
            <span className="nav-text">Appetizers</span>
          </div>
          <div
            className={`nav-item${activeTab === 'Main' ? ' active' : ''}`}
            onClick={() => onTabChange('Main')}
            style={{ cursor: 'pointer' }}
          >
            <FaHamburger className="nav-icon" />
            <span className="nav-text">Mains</span>
          </div>
          <div
            className={`nav-item${activeTab === 'Drink' ? ' active' : ''}`}
            onClick={() => onTabChange('Drink')}
            style={{ cursor: 'pointer' }}
          >
            <FaWineGlass className="nav-icon" />
            <span className="nav-text">Drinks</span>
          </div>
        </nav>
        {renderStats()}
      </aside>
    );
  }
  // Default (server) view
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <div
          className={`nav-item${activeTab === 'active' ? ' active' : ''}`}
          onClick={() => onTabChange('active')}
          style={{ cursor: 'pointer' }}
        >
          <FaBolt className="nav-icon" />
          <span className="nav-text">Active Orders</span>
          <span className="badge">{counts.active}</span>
        </div>
        <div
          className={`nav-item${activeTab === 'pending' ? ' active' : ''}`}
          onClick={() => onTabChange('pending')}
          style={{ cursor: 'pointer' }}
        >
          <FontAwesomeIcon icon={faClock} className="nav-icon" />
          <span className="nav-text">Pending</span>
          <span className="count">{counts.pending}</span>
        </div>
        <div
          className={`nav-item${activeTab === 'completed' ? ' active' : ''}`}
          onClick={() => onTabChange('completed')}
          style={{ cursor: 'pointer' }}
        >
          <FaCheckCircle className="nav-icon green" />
          <span className="nav-text">Completed</span>
          <span className="count green">{counts.completed}</span>
        </div>
      </nav>
      {renderStats()}
    </aside>
  );
};

export default Sidebar;
