import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import Login from './components/Login';
import { FaUtensils, FaHamburger, FaWineGlass } from 'react-icons/fa';
import { io } from 'socket.io-client';

// --- Order Event Logging Utility ---
const ORDER_LOG_KEY = 'orderEventLogs';

function logOrderEvent(eventType, order) {
  const logs = JSON.parse(localStorage.getItem(ORDER_LOG_KEY) || '[]');
  logs.push({
    timestamp: new Date().toISOString(),
    event: eventType,
    orderId: order.id,
    orderGroupId: order.orderGroupId || null,
    status: order.status,
    table: order.table,
    customer: order.customer,
    type: order.type,
    items: order.items,
    specialInstructions: order.specialInstructions,
  });
  localStorage.setItem(ORDER_LOG_KEY, JSON.stringify(logs));
}

function Dashboard({ onLogout, role }) {
  const [activeTab, setActiveTab] = useState('active');
  const [activeCategory, setActiveCategory] = useState('Appetizer');
  const [orders, setOrders] = useState([]);
  const [editingOrder, setEditingOrder] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifPopupOpen, setNotifPopupOpen] = useState(false);
  const [socket, setSocket] = useState(null);
  const [menuState, setMenuState] = useState({});

  // Refs to always have latest state in interval
  const ordersRef = useRef(orders);
  const notificationsRef = useRef(notifications);

  useEffect(() => { ordersRef.current = orders; }, [orders]);
  useEffect(() => { notificationsRef.current = notifications; }, [notifications]);

  // Helper: get current timestamp
  const now = () => new Date().getTime();

  // On mount, migrate old urgent notifications in localStorage and state
  useEffect(() => {
    // Update notifications in localStorage if present
    const notifKey = 'notifications';
    const stored = localStorage.getItem(notifKey);
    if (stored) {
      let arr = [];
      try { arr = JSON.parse(stored); } catch {}
      let changed = false;
      arr = arr.map(n => {
        if (typeof n.message === 'string' && n.message.endsWith('is now marked as URGENT!')) {
          changed = true;
          return {
            ...n,
            message: `URGENT ORDER: Order #${n.orderId} has been Preparing for over 10 seconds!`
          };
        }
        return n;
      });
      if (changed) {
        localStorage.setItem(notifKey, JSON.stringify(arr));
      }
    }
    // Update notifications in state if present
    setNotifications(prev => prev.map(n =>
      typeof n.message === 'string' && n.message.endsWith('is now marked as URGENT!')
        ? { ...n, message: `URGENT ORDER: Order #${n.orderId} has been Preparing for over 10 seconds!` }
        : n
    ));
  }, []);

  useEffect(() => {
    // Connect to backend socket.io server
    const s = io('http://localhost:4000');
    setSocket(s);
    // Listen for order updates
    s.on('orders', (ordersFromServer) => {
      console.log('Received orders from server:', ordersFromServer); // DEBUG
      setOrders(ordersFromServer);
    });
    // Listen for menu updates
    s.on('menu', (menuFromServer) => {
      setMenuState(menuFromServer);
    });
    // Cleanup
    return () => s.disconnect();
  }, []);

  // Add new order (always as 'pending')
  const addOrder = (order) => {
    if (!socket) return;
    console.log('DEBUG: addOrder called with:', order);
    // Emit a single order with all items
    const newOrder = {
      ...order,
      id: order.id, // e.g., '1000'
      status: 'pending',
      createdAt: now(),
      updatedAt: now(),
    };
    socket.emit('addOrder', newOrder);
    logOrderEvent('created', newOrder);
  };

  // Move order to 'active' (preparing)
  const startPreparing = (id) => {
    if (!socket) return;
    const order = orders.find(o => o.id === id);
    if (order) {
      // Determine unique categories in the order
      const categories = Array.from(new Set(order.items.map(item => item.category)));
      const updated = {
        ...order,
        status: 'active',
        updatedAt: now(),
        completedCategories: [], // Track which categories are completed
        totalCategories: categories.length,
        categories, // Store the list for convenience
      };
      socket.emit('updateOrder', updated);
      logOrderEvent('started_preparing', updated);
    }
  };

  // Move order to 'completed' only when all categories are done
  const completeOrder = (id, category) => {
    if (!socket) return;
    const order = orders.find(o => o.id === id);
    if (order) {
      // Only for active orders with category tracking
      if (order.status === 'active' && order.categories) {
        const completedCategories = Array.isArray(order.completedCategories) ? [...order.completedCategories] : [];
        if (!completedCategories.includes(category)) {
          completedCategories.push(category);
        }
        // If all categories are completed, move to completed
        if (completedCategories.length === order.categories.length) {
          const updated = { ...order, status: 'completed', updatedAt: now(), completedCategories };
          socket.emit('updateOrder', updated);
          logOrderEvent('completed', updated);
        } else {
          // Otherwise, just update the completedCategories
          const updated = { ...order, completedCategories, updatedAt: now() };
          socket.emit('updateOrder', updated);
        }
      } else {
        // Fallback: if no category tracking, just complete
        const updated = { ...order, status: 'completed', updatedAt: now() };
        socket.emit('updateOrder', updated);
        logOrderEvent('completed', updated);
      }
    }
  };

  // Edit an existing order
  const editOrder = (id) => {
    const orderToEdit = orders.find(o => o.id === id);
    if (orderToEdit) {
      setEditingOrder(orderToEdit);
    }
  };

  // Update an existing order
  const updateOrder = (updatedOrder) => {
    if (!socket) return;
    socket.emit('updateOrder', { ...updatedOrder, updatedAt: now() });
    setEditingOrder(null);
    // Optionally log edit event if needed
    // logOrderEvent('edited', updatedOrder);
  };

  // Delete/cancel an order
  const cancelOrder = (id) => {
    if (!socket) return;
    const orderToCancel = orders.find(o => o.id === id);
    if (orderToCancel) {
      const cancelledOrder = { ...orderToCancel, status: 'cancelled', updatedAt: now() };
      socket.emit('updateOrder', cancelledOrder);
      logOrderEvent('cancelled', cancelledOrder);
    }
  };

  // Notification logic: check for pending and active orders > 10s (using refs for real-time updates)
  useEffect(() => {
    const interval = setInterval(() => {
      const currentOrders = ordersRef.current;
      const currentNotifications = notificationsRef.current;
      const newNotifs = [];
      let urgentOrderIds = [];
      currentOrders.forEach(order => {
        const orderTime = order.updatedAt || order.createdAt || now();
        const timeInStatus = (now() - orderTime) / 1000;
        // Find if a pending notification already exists for this order
        const hasPendingNotif = currentNotifications.some(n => n.orderId === order.id && n.message.includes('is still Pending'));
        // Find if an urgent notification already exists for this order
        const hasUrgentNotif = currentNotifications.some(n => n.orderId === order.id && n.message.includes('URGENT ORDER'));
        if (order.status === 'pending') {
          if (timeInStatus >= 10 && !hasPendingNotif) {
            newNotifs.push({
              id: `${order.id}-pending`,
              orderId: order.id,
              message: `Order #${order.id} is still Pending after 10 seconds!`,
              timestamp: now(),
              read: false,
            });
          }
        } else if (order.status === 'active') {
          if (timeInStatus >= 10) {
            urgentOrderIds.push(order.id);
            if (!hasUrgentNotif) {
              newNotifs.push({
                id: `${order.id}-urgent`,
                orderId: order.id,
                message: `URGENT ORDER: Order #${order.id} has been Preparing for over 10 seconds!`,
                timestamp: now(),
                read: false,
              });
            }
          }
        }
      });
      // Set urgent: true for active orders that are urgent
      if (urgentOrderIds.length > 0) {
        setOrders(prev => prev.map(o =>
          o.status === 'active' && urgentOrderIds.includes(o.id) && !o.urgent
            ? { ...o, urgent: true }
            : o
        ));
      }
      if (newNotifs.length > 0) {
        setNotifications(prev => [...prev, ...newNotifs]);
        setUnreadCount(prev => prev + newNotifs.length);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []); // Only run once

  // Mark notifications as read when popup is opened
  useEffect(() => {
    if (notifPopupOpen) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } else {
      setUnreadCount(notifications.filter(n => !n.read).length);
    }
  }, [notifPopupOpen]);

  // Filter orders for each tab and category
  const filterOrders = (status, category) => {
    return orders.filter(o => {
      // First filter by status
      const statusMatch = o.status === status;
      // For active tab, show the order for each category it contains
      if (status === 'active' && o.status === 'active') {
        return o.items.some(item => item.category === category);
      }
      // For pending/completed, show as before
      if (status !== 'active') {
        return statusMatch && o.items.some(item => item.category === category);
      }
      return false;
    });
  };

  // In pending tab, show all pending orders regardless of activeCategory
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const activeOrders = filterOrders('active', activeCategory);
  const completedOrders = filterOrders('completed', activeCategory);

  // Calculate the next order ID (group ID)
  const getNextOrderId = () => {
    if (orders.length === 0) return 1000;
    
    // Extract base IDs without category suffix
    const baseIds = orders.map(o => {
      const parts = o.id.split('-');
      return parseInt(parts[0], 10);
    });
    
    return Math.max(...baseIds) + 1;
  };

  // --- Today's Statistics Calculation ---
  const getTodayStats = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    const dayOfWeek = today.toLocaleDateString(undefined, { weekday: 'long' });
    const dateDisplay = today.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

    // Only orders created today
    const isToday = (order) => {
      const d = new Date(order.createdAt || order.time || 0);
      return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
    };
    const todayOrders = orders.filter(isToday);
    const totalOrders = todayOrders.length;
    const completedOrders = todayOrders.filter(o => o.status === 'completed').length;
    const cancelledOrders = todayOrders.filter(o => o.status === 'cancelled').length;
    // Top 3 ordered items
    const itemCounts = {};
    todayOrders.forEach(order => {
      (order.items || []).forEach(item => {
        itemCounts[item.name] = (itemCounts[item.name] || 0) + (item.quantity || 1);
      });
    });
    const topItems = Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);
    // Average time to complete (from createdAt to updatedAt for completed orders)
    const completionTimes = todayOrders
      .filter(o => o.status === 'completed' && o.createdAt && o.updatedAt)
      .map(o => o.updatedAt - o.createdAt)
      .filter(t => t > 0);
    const avgCompletionTime = completionTimes.length > 0
      ? `${Math.round(completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length / 1000)}s`
      : '-';
    // Sales: sum up all completed orders' total (assuming each item has a price)
    let totalSales = 0;
    let numTransactions = 0;
    todayOrders.forEach(order => {
      if (order.status === 'completed') {
        let orderTotal = 0;
        (order.items || []).forEach(item => {
          orderTotal += (item.price || 0) * (item.quantity || 1);
        });
        if (orderTotal > 0) {
          totalSales += orderTotal;
          numTransactions++;
        }
      }
    });
    totalSales = totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    // Low-stock food items (stock <= 5)
    let lowStockItems = [];
    Object.entries(menuState).forEach(([category, items]) => {
      items.forEach(item => {
        if (item.stock <= 5) {
          lowStockItems.push({
            name: item.name,
            category,
            stock: item.stock
          });
        }
      });
    });
    return {
      date: dateDisplay,
      dayOfWeek,
      totalOrders,
      completedOrders,
      cancelledOrders,
      topItems,
      avgCompletionTime,
      totalSales,
      numTransactions,
      lowStockItems,
    };
  };
  const todayStats = getTodayStats();

  // Low-stock notification logic
  useEffect(() => {
    if (!menuState) return;
    let notified = JSON.parse(localStorage.getItem('lowStockNotified') || '{}');
    let newNotifs = [];
    Object.entries(menuState).forEach(([category, items]) => {
      items.forEach(item => {
        if (item.stock <= 5 && !notified[category + '||' + item.name]) {
          newNotifs.push({
            id: `lowstock-${category}-${item.name}`,
            message: `Low stock: ${item.name} (${category}) only ${item.stock} left!`,
            timestamp: now(),
            read: false,
          });
          notified[category + '||' + item.name] = true;
        }
      });
    });
    if (newNotifs.length > 0) {
      setNotifications(prev => [...prev, ...newNotifs]);
      setUnreadCount(prev => prev + newNotifs.length);
      localStorage.setItem('lowStockNotified', JSON.stringify(notified));
    }
  }, [menuState]);

  useEffect(() => {
    console.log('DEBUG: Current orders state:', orders);
  }, [orders]);

  let content;
  if (activeTab === 'active') {
    content = <MainContent
      tab="active"
      orders={activeOrders}
      onStartPreparing={startPreparing}
      onComplete={completeOrder}
      onAddOrder={addOrder}
      onEditOrder={editOrder}
      onUpdateOrder={updateOrder}
      onCancelOrder={cancelOrder}
      editingOrder={editingOrder}
      nextOrderId={getNextOrderId()}
      activeCategory={activeCategory}
      onCategoryChange={setActiveCategory}
      role={role}
    />;
  } else if (activeTab === 'pending') {
    content = <MainContent
      tab="pending"
      orders={pendingOrders}
      onStartPreparing={startPreparing}
      onComplete={completeOrder}
      onAddOrder={addOrder}
      onEditOrder={editOrder}
      onUpdateOrder={updateOrder}
      onCancelOrder={cancelOrder}
      editingOrder={editingOrder}
      nextOrderId={getNextOrderId()}
      activeCategory={activeCategory}
      onCategoryChange={setActiveCategory}
      role={role}
    />;
  } else if (activeTab === 'completed') {
    content = <MainContent
      tab="completed"
      orders={completedOrders}
      onStartPreparing={startPreparing}
      onComplete={completeOrder}
      onAddOrder={addOrder}
      onEditOrder={editOrder}
      onUpdateOrder={updateOrder}
      onCancelOrder={cancelOrder}
      editingOrder={editingOrder}
      nextOrderId={getNextOrderId()}
      activeCategory={activeCategory}
      onCategoryChange={setActiveCategory}
      role={role}
    />;
  }

  return (
    <div className="app-container">
      <Header 
        notifications={notifications}
        unreadCount={unreadCount}
        notifPopupOpen={notifPopupOpen}
        setNotifPopupOpen={setNotifPopupOpen}
        onLogout={onLogout}
      />
      <div className="content-wrapper">
        <Sidebar
          activeTab={role === 'admin' ? activeCategory : activeTab}
          onTabChange={role === 'admin' ? setActiveCategory : setActiveTab}
          counts={
            role === 'server'
              ? {
                  active: orders.filter(o => o.status === 'active').length,
                  pending: orders.filter(o => o.status === 'pending').length,
                  completed: orders.filter(o => o.status === 'completed' && o.items.some(item => item.category === activeCategory)).length
                }
              : {
                  active: orders.filter(o => o.status === 'active').length,
                  pending: orders.filter(o => o.status === 'pending').length,
                  completed: orders.filter(o => o.status === 'completed').length
                }
          }
          role={role}
          todayStats={todayStats}
        />
        {content}
      </div>
    </div>
  );
}

function App() {
  // Remove persistent authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState(null); // 'admin' or 'server'

  const handleLogin = (userRole) => {
    setIsAuthenticated(true);
    setRole(userRole);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setRole(null);
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Dashboard onLogout={handleLogout} role={role} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
