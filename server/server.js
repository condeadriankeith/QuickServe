// Minimal Express + Socket.io server for real-time order management
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import menuData from './menuData.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// In-memory order store
let orders = [];

// In-memory menu store (start with a default menu)
let menu = menuData;

// Helper: find menu item by category and name
function findMenuItem(category, name) {
  return menu[category]?.find(item => item.name === name);
}

// REST endpoint to get all orders
app.get('/orders', (req, res) => {
  res.json(orders);
});

// REST endpoint to get menu
app.get('/menu', (req, res) => {
  res.json(menu);
});

// REST endpoint to update stock (admin only)
app.post('/menu/stock', (req, res) => {
  const { category, name, stock, role } = req.body;
  if (role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const item = findMenuItem(category, name);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  item.stock = stock;
  io.emit('menu', menu);
  res.json({ success: true, menu });
});

// Socket.io connection
io.on('connection', (socket) => {
  // Send current orders and menu to new client
  socket.emit('orders', orders);
  socket.emit('menu', menu);

  // Add order (with stock deduction)
  socket.on('addOrder', (order, callback) => {
    // Check stock for each item
    let outOfStock = null;
    for (const item of order.items) {
      const menuItem = findMenuItem(item.category, item.name);
      if (!menuItem || menuItem.stock < item.quantity) {
        outOfStock = item.name;
        break;
      }
    }
    if (outOfStock) {
      if (callback) callback({ error: `Insufficient stock for ${outOfStock}` });
      return;
    }
    // Deduct stock
    for (const item of order.items) {
      const menuItem = findMenuItem(item.category, item.name);
      if (menuItem) menuItem.stock -= item.quantity;
    }
    orders.push(order);
    io.emit('orders', orders);
    io.emit('menu', menu); // Broadcast stock update
    if (callback) callback({ success: true });
  });

  // Update order
  socket.on('updateOrder', (updatedOrder) => {
    // Find the previous order
    const prevOrder = orders.find(o => o.id === updatedOrder.id);
    // If status is being changed to 'cancelled' from something else, return stock
    if (prevOrder && prevOrder.status !== 'cancelled' && updatedOrder.status === 'cancelled') {
      for (const item of prevOrder.items) {
        const menuItem = findMenuItem(item.category, item.name);
        if (menuItem) menuItem.stock += item.quantity;
      }
      io.emit('menu', menu); // Broadcast stock update
    }
    orders = orders.map(o => o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o);
    io.emit('orders', orders);
  });

  // Remove order
  socket.on('removeOrder', (orderId) => {
    orders = orders.filter(o => o.id !== orderId);
    io.emit('orders', orders);
  });

  // Replace all orders (for bulk sync, if needed)
  socket.on('setOrders', (newOrders) => {
    orders = newOrders;
    io.emit('orders', orders);
  });

  // Add menu item
  socket.on('addMenuItem', ({ category, item }) => {
    if (!menu[category]) menu[category] = [];
    menu[category].push(item);
    io.emit('menu', menu);
  });

  // Edit menu item
  socket.on('editMenuItem', ({ category, originalName, newItem }) => {
    if (!menu[category]) return;
    menu[category] = menu[category].map(item =>
      item.name === originalName ? newItem : item
    );
    io.emit('menu', menu);
  });

  // Remove menu item
  socket.on('removeMenuItem', ({ category, name }) => {
    if (!menu[category]) return;
    menu[category] = menu[category].filter(item => item.name !== name);
    io.emit('menu', menu);
  });

  // Replace all menu (for bulk sync, if needed)
  socket.on('setMenu', (newMenu) => {
    menu = newMenu;
    io.emit('menu', menu);
  });

  // Admin: update stock
  socket.on('updateStock', ({ category, name, stock, role }) => {
    if (role !== 'admin') return;
    const item = findMenuItem(category, name);
    if (!item) return;
    item.stock = stock;
    io.emit('menu', menu);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Order server running on port ${PORT}`);
}); 