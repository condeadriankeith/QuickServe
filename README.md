# QuickServe Restaurant Order Management Dashboard

A real-time restaurant order management system that helps track and manage orders for different parts of the restaurant.

## Updates
- Added compatibility fixes for iPhone 11 Safari browser to ensure proper popup display

## Real-Time Order Sync

This app now supports real-time order updates between admin and server views using a backend server with Express and Socket.io.

### How to Run

1. **Install dependencies** (if you haven't already):
   ```bash
   npm install
   ```

2. **Start the backend server** (in a separate terminal):
   ```bash
   node server/server.js
   ```
   The server runs on `http://localhost:4000` by default.

3. **Start the React app**:
   ```bash
   npm run dev
   ```

4. **Open multiple browser tabs/windows** as admin and server. Orders added/removed/updated in one view will instantly reflect in all others.

### How it Works
- The backend holds the source of truth for all orders in memory.
- The frontend connects to the backend using Socket.io and listens for order updates.
- When an order is added, updated, or removed, the change is broadcast to all connected clients in real time.

---

**Note:** This setup is for development/demo. For production, use a persistent database and secure the backend. 