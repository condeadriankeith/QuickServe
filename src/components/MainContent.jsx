import React, { useState, useEffect, useRef } from 'react';
import { FaPlus, FaUtensils, FaHamburger, FaWineGlass, FaShoppingBasket, FaMinus, FaPlusCircle, FaTimes, FaExclamationTriangle, FaEdit } from 'react-icons/fa';
import OrderCard from './OrderCard';
import EditOrderModal from './EditOrderModal';
import './MainContent.css';
import menu from './menuData';
import { io } from 'socket.io-client';
import { AnimatePresence, motion } from 'framer-motion';

const categories = [
  { label: 'Appetizers', value: 'Appetizer', icon: <FaUtensils /> },
  { label: 'Mains', value: 'Main', icon: <FaHamburger /> },
  { label: 'Drinks', value: 'Drink', icon: <FaWineGlass /> },
];

const MainContent = ({ 
  tab, 
  orders, 
  onAddOrder, 
  onStartPreparing, 
  onComplete, 
  onEditOrder,
  onUpdateOrder,
  editingOrder,
  nextOrderId, 
  activeCategory, 
  onCategoryChange,
  onCancelOrder,
  role
}) => {
  const today = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = today.toLocaleDateString(undefined, options);

  const [showModal, setShowModal] = useState(false);
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [basketCount, setBasketCount] = useState(0);
  const [orderItems, setOrderItems] = useState([]);
  const [form, setForm] = useState({
    category: 'Appetizer',
    item: menu['Appetizer'][0].name,
    quantity: 1,
    customer: '',
    type: 'Dine-in',
    table: '',
    specialInstructions: '',
  });
  const [showEditModal, setShowEditModal] = useState(false); // for order editing
  const [showAdminEditModal, setShowAdminEditModal] = useState(false); // for admin food item editing
  const [editingOrderState, setEditingOrderState] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Admin menu management state
  const [newMenuItem, setNewMenuItem] = useState({ name: '', img: '', category: 'Appetizer' });
  const [menuState, setMenuState] = useState(menu); // local state for menu
  const [socket, setSocket] = useState(null);
  const menuLoadedRef = useRef(false);

  // Add state for modals and edit mode
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [addLoading, setAddLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [editError, setEditError] = useState('');

  // Effect to handle editing an order
  useEffect(() => {
    if (editingOrder) {
      // Set up the form with the editing order data
      setForm(prev => ({
        ...prev,
        customer: editingOrder.customer,
        type: editingOrder.type,
        table: editingOrder.table || '',
        category: editingOrder.category
      }));
      // Only set items for this card/category
      setOrderItems(editingOrder.items);
      // Calculate basket count
      const count = editingOrder.items.reduce((total, item) => total + item.quantity, 0);
      setBasketCount(count);
      // Show the order summary in edit mode
      setShowOrderSummary(true);
      setIsEditMode(true);
    }
  }, [editingOrder]);

  // Only clear table number when switching to Take out
  React.useEffect(() => {
    if (form.type !== 'Dine-in') {
      setForm(f => ({ ...f, table: '' }));
    }
    // eslint-disable-next-line
  }, [form.type]);

  // When category changes, reset item to first in that category
  React.useEffect(() => {
    setForm(f => ({ ...f, item: menu[f.category][0].name }));
    // eslint-disable-next-line
  }, [form.category]);

  useEffect(() => {
    // Connect to backend socket.io server
    const s = io('http://localhost:4000');
    setSocket(s);
    // Listen for menu updates
    s.on('menu', (menuFromServer) => {
      setMenuState(menuFromServer);
      menuLoadedRef.current = true;
    });
    // On first mount, fetch menu via REST (for refresh/SSR)
    fetch('http://localhost:4000/menu')
      .then(res => res.json())
      .then(data => {
        if (!menuLoadedRef.current) setMenuState(data);
      });
    // Cleanup
    return () => s.disconnect();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleGallerySelect = (itemName) => {
    setForm(f => ({ ...f, item: itemName }));
  };

  const handleQuantity = (delta) => {
    setForm(f => ({ ...f, quantity: Math.max(1, Number(f.quantity) + delta) }));
  };

  const handleAddToBasket = () => {
    const menuItem = (menuState[form.category] || []).find(i => i.name === form.item);
    if (menuItem && menuItem.stock < form.quantity) {
      alert(`Insufficient stock! Only ${menuItem.stock} left.`);
      return;
    }
    setBasketCount(prev => prev + form.quantity);
    // Find if item already exists in the orderItems array
    const existingItemIndex = orderItems.findIndex(item => item.name === form.item && item.category === form.category);
    // Get price from menu
    const price = menuItem ? menuItem.price : 0;
    if (existingItemIndex >= 0) {
      // Update existing item quantity
      const updatedItems = [...orderItems];
      updatedItems[existingItemIndex].quantity += form.quantity;
      // Ensure price is up to date
      updatedItems[existingItemIndex].price = price;
      setOrderItems(updatedItems);
    } else {
      // Add new item
      setOrderItems([...orderItems, {
        name: form.item,
        quantity: form.quantity,
        category: form.category,
        price
      }]);
    }
    // Reset quantity to 1 after adding
    setForm(f => ({ ...f, quantity: 1 }));
  };

  const handleViewBasket = () => {
    if (basketCount > 0) {
      if (isEditMode) {
        // In edit mode, we've added/modified items in `orderItems` (which holds all items for the order)
        // and potentially updated `form` for customer details etc.
        // We want to pass this new state back to EditOrderModal.
        setEditingOrderState(prevState => {
          if (tab === 'active') {
            // Combine edited items for current category with unedited items from other categories
            const itemsFromOtherCategories = (prevState.items || []).filter(item => item.category !== activeCategory);
            const itemsForActiveCategory = orderItems;
            return {
              ...prevState,
              items: [...itemsFromOtherCategories, ...itemsForActiveCategory],
              customer: form.customer,
              type: form.type,
              table: form.table,
              specialInstructions: form.specialInstructions,
            };
          } else {
            // Pending: just use all items
            return {
              ...prevState,
              items: orderItems,
              customer: form.customer,
              type: form.type,
              table: form.table,
              specialInstructions: form.specialInstructions,
            };
          }
        });
        setShowModal(false);      // Close item gallery modal
        setShowEditModal(true);   // Reopen EditOrderModal with updated data
        // setShowOrderSummary(false); // Not relevant here
        // setIsEditMode(true); // Already true
      } else {
        // In new order mode, open the order summary
        setShowOrderSummary(true);
        setShowModal(false);
        setIsEditMode(false);
      }
    }
  };

  const handleBackToOrderModal = () => {
    setShowOrderSummary(false);
    setShowModal(true);
  };

  const handleRemoveItem = (itemName) => {
    // Find the item in the orderItems array
    const itemIndex = orderItems.findIndex(item => item.name === itemName);
    if (itemIndex === -1) return;

    const item = orderItems[itemIndex];
    
    // Decrease the basket count
    setBasketCount(prev => prev - item.quantity);
    
    // Remove the item from orderItems
    const updatedItems = [...orderItems];
    updatedItems.splice(itemIndex, 1);
    setOrderItems(updatedItems);
  };

  const handleNewOrder = (e) => {
    e.preventDefault();
    // Ensure all items have price (do NOT merge again)
    const itemsWithPrice = orderItems.map(item => {
      if (typeof item.price === 'number') return item;
      const menuItem = (menuState[item.category] || []).find(i => i.name === item.name);
      return { ...item, price: menuItem ? menuItem.price : 0 };
    });
    if (isEditMode && editingOrder) {
      // Update existing order (preserve id and orderGroupId)
      const updatedOrder = {
        ...editingOrder,
        table: form.type === 'Dine-in' ? form.table : '',
        items: itemsWithPrice,
        customer: form.customer,
        type: form.type,
        specialInstructions: form.specialInstructions,
        time: today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      onUpdateOrder(updatedOrder);
    } else {
      // Create new order
      const newOrder = {
        id: nextOrderId.toString(),
        urgent: false,
        table: form.type === 'Dine-in' ? form.table : '',
        time: today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        items: itemsWithPrice,
        specialInstructions: form.specialInstructions,
        customer: form.customer,
        type: form.type,
      };
      onAddOrder(newOrder);
    }
    // Reset state
    setShowOrderSummary(false);
    setBasketCount(0);
    setOrderItems([]);
    setForm({ category: 'Appetizer', item: menu['Appetizer'][0].name, quantity: 1, customer: '', type: 'Dine-in', table: '', specialInstructions: '' });
    setIsEditMode(false);
  };

  // When rendering the order summary modal, only show items for this card/category
  const groupedItems = orderItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  // Filtered menu items based on search
  const filteredMenuItems = (menuState[form.category] || []).filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  let title = 'Order Management';
  let subtitle = `${formattedDate} • ${orders.length} Active Orders`;
  if (tab === 'pending') {
    title = 'Pending Orders';
    subtitle = `${formattedDate} • ${orders.length} Pending Orders`;
  } else if (tab === 'completed') {
    title = 'Completed Orders';
    subtitle = `${formattedDate} • ${orders.length} Completed Orders`;
  }

  // Function to get category label
  const getCategoryLabel = (value) => {
    const category = categories.find(cat => cat.value === value);
    return category ? category.label : value;
  };

  // When edit button is clicked on an order card
  const handleEditOrder = (id) => {
    // Always use the full order object from the orders array
    const orderToEdit = orders.find(o => o.id === id);
    if (orderToEdit) {
      setEditingOrderState(orderToEdit);
      setShowEditModal(true);
    }
  };

  // When user wants to browse menu from edit modal
  const handleBrowseMenuFromEdit = () => {
    if (!editingOrderState) {
      console.error("No order selected for editing when trying to browse menu.");
      return;
    }

    console.log("DEBUG: handleBrowseMenuFromEdit - MainContent activeCategory:", activeCategory, "editingOrderState:", editingOrderState);

    // Use MainContent's activeCategory (the current tab) to set the form's category
    const categoryToSet = activeCategory;
    const itemsInCategory = menu[categoryToSet] || [];
    const defaultItemName = itemsInCategory.length > 0 ? itemsInCategory[0].name : '';

    setForm(prev => ({
      ...prev,
      customer: editingOrderState.customer,
      type: editingOrderState.type,
      table: editingOrderState.table || '',
      category: categoryToSet, 
      item: defaultItemName, 
      specialInstructions: editingOrderState.specialInstructions || ''
    }));

    // In pending tab, show all items in the basket; in active tab, only show current category
    if (tab === 'pending') {
      setOrderItems(editingOrderState.items || []);
      setBasketCount((editingOrderState.items || []).reduce((total, item) => total + item.quantity, 0));
    } else {
      const itemsForActiveCategory = (editingOrderState.items || []).filter(item => item.category === activeCategory);
      setOrderItems(itemsForActiveCategory);
      setBasketCount(itemsForActiveCategory.reduce((total, item) => total + item.quantity, 0));
    }
    
    // Transition modals
    setShowEditModal(false); // Close EditOrderModal
    setShowModal(true);      // Open item gallery modal (main order modal)
    setIsEditMode(true);     // Set it to edit mode
    setShowOrderSummary(false); // Ensure summary is not shown
  };

  // Add menu item (admin only)
  const handleAddMenuItem = (e) => {
    e.preventDefault();
    if (!newMenuItem.name.trim() || !newMenuItem.img.trim()) return;
    if (socket) {
      socket.emit('addMenuItem', {
        category: newMenuItem.category,
        item: { name: newMenuItem.name, img: newMenuItem.img, price: newMenuItem.price, stock: newMenuItem.stock }
      });
    }
    setNewMenuItem({ name: '', img: '', category: newMenuItem.category });
  };

  // Delete menu item (admin only)
  const handleDeleteMenuItem = (category, name) => {
    if (socket) {
      socket.emit('removeMenuItem', { category, name });
    }
  };

  // Admin menu management UI
  const renderAdminMenuControls = () => (
    <div className="admin-menu-controls" style={{ marginBottom: 24, background: '#f9f9f9', padding: 16, borderRadius: 8 }}>
      <h3>Add Menu Item</h3>
      <form onSubmit={handleAddMenuItem} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={newMenuItem.category} onChange={e => setNewMenuItem(n => ({ ...n, category: e.target.value }))}>
          {categories.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
        <input type="text" placeholder="Name" value={newMenuItem.name} onChange={e => setNewMenuItem(n => ({ ...n, name: e.target.value }))} required />
        <input type="text" placeholder="Image URL" value={newMenuItem.img} onChange={e => setNewMenuItem(n => ({ ...n, img: e.target.value }))} required />
        <input type="number" placeholder="Price (₱)" value={newMenuItem.price || ''} min={1} required onChange={e => setNewMenuItem(n => ({ ...n, price: Number(e.target.value) }))} style={{ width: 90 }} />
        <input type="number" placeholder="Stock" value={newMenuItem.stock || ''} min={0} required onChange={e => setNewMenuItem(n => ({ ...n, stock: Number(e.target.value) }))} style={{ width: 70 }} />
        <button type="submit">Add</button>
      </form>
      <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>To delete an item, click the trash icon next to it in the menu list below.</p>
    </div>
  );

  // Helper: fetch image from Pexels API
  async function fetchFoodImage(foodName) {
    const apiKey = 'S6YsEWf484ZrbOFrIVqU92AGsBlpMX8MomXebcBPmzUw9Wk8lhc1kKOV';
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(foodName)}&per_page=1`;
    const res = await fetch(url, { headers: { Authorization: apiKey } });
    if (!res.ok) return '';
    const data = await res.json();
    return data.photos?.[0]?.src?.medium || '';
  }

  // Add food item handler (admin)
  const handleAddFoodItem = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError('');
    try {
      const img = await fetchFoodImage(newMenuItem.name);
      if (!img) throw new Error('No image found for this food name.');
      if (socket) {
        socket.emit('addMenuItem', {
          category: newMenuItem.category,
          item: { name: newMenuItem.name, img, price: newMenuItem.price, stock: newMenuItem.stock }
        });
      }
      setNewMenuItem({ name: '', img: '', category: newMenuItem.category });
      setShowAddModal(false);
    } catch (err) {
      setAddError(err.message || 'Failed to add food item.');
    } finally {
      setAddLoading(false);
    }
  };

  // Edit food item handler (admin)
  const handleEditFoodItem = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    try {
      let img = editTarget.img;
      if (editTarget.name !== editTarget.originalName) {
        img = await fetchFoodImage(editTarget.name) || img;
      }
      if (socket) {
        socket.emit('editMenuItem', {
          category: editTarget.category,
          originalName: editTarget.originalName,
          newItem: { name: editTarget.name, img, price: editTarget.price }
        });
      }
      setShowAdminEditModal(false);
      setEditTarget(null);
    } catch (err) {
      setEditError(err.message || 'Failed to edit food item.');
    } finally {
      setEditLoading(false);
    }
  };

  // Delete food item handler (admin)
  const handleDeleteFoodItem = () => {
    if (socket) {
      socket.emit('removeMenuItem', { category: editTarget.category, name: editTarget.originalName });
    }
    setShowAdminEditModal(false);
    setEditTarget(null);
  };

  // When opening Add Food Item modal, set category to activeCategory
  const openAddFoodItemModal = () => {
    setNewMenuItem(n => ({ ...n, category: activeCategory }));
    setShowAddModal(true);
  };

  // Admin right panel UI
  if (role === 'admin') {
    const currentCategory = categories.find(cat => cat.value === activeCategory);
    const items = menuState[activeCategory] || [];
    return (
      <main className="main-content admin-menu-panel">
        <div className="admin-header-row">
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 32, fontWeight: 700, margin: 0 }}>
              {currentCategory.icon} {currentCategory.label}
            </h1>
            <div className="subtitle" style={{ fontSize: 15, marginTop: 4 }}>{formattedDate} • {items.length} items</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="admin-edit-btn" style={{ background: isEditMode ? 'var(--primary-color)' : '#fff', color: isEditMode ? '#fff' : 'var(--primary-color)', border: '2px solid var(--primary-color)', borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setIsEditMode(v => !v)}>
              <FaEdit /> Edit
            </button>
            <button className="admin-add-btn" style={{ background: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', boxShadow: '0 2px 8px rgba(244,93,34,0.08)', transition: 'all 0.2s' }} onClick={openAddFoodItemModal}>
              <FaPlus /> Add Food Item
            </button>
          </div>
        </div>
        <div className="admin-menu-search-row" style={{ marginBottom: 18 }}>
          <input
            type="text"
            placeholder={`Search ${currentCategory.label.toLowerCase()}...`}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="menu-search"
            style={{ width: '100%', padding: '12px 18px', borderRadius: 18, border: '1.5px solid #e0e0e0', fontSize: '1.1rem', background: '#f7f7fa', color: 'var(--text-color)', outline: 'none', boxShadow: '0 1px 4px rgba(36,107,253,0.04)', transition: 'box-shadow 0.2s' }}
          />
        </div>
        <div className="admin-menu-items-grid animated-grid">
          {items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())).map((item, idx) => (
            <motion.div
              key={item.name}
              className={`admin-menu-item-card animated-card${isEditMode ? ' edit-mode' : ''}`}
              style={{ animationDelay: `${idx * 60}ms` }}
              onClick={() => isEditMode && (setEditTarget({ ...item, category: activeCategory, originalName: item.name }), setShowAdminEditModal(true))}
              layout
              initial={false}
              transition={{
                type: 'spring',
                stiffness: 90,
                damping: 32,
                delay: 0.05
              }}
            >
              <img src={item.img} alt={item.name} className="admin-menu-item-img" />
              <div className="admin-menu-item-name">
                {item.name}
                <span style={{ color: '#888', fontWeight: 500, fontSize: 13 }}>₱{item.price ?? (menu[item.category]?.find(m => m.name === item.name)?.price || 0)}</span>
                <span style={{ display: 'block', fontSize: '0.8em', color: '#666' }}>Stock: {item.stock}</span>
              </div>
              {isEditMode && (
                <div className="admin-stock-controls" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button 
                    className="qty-btn qty-btn-minus" 
                    onClick={(e) => { e.stopPropagation(); socket.emit('updateStock', { category: activeCategory, name: item.name, stock: item.stock - 1, role: 'admin' }); }}
                    style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #ddd', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <FaMinus size={12} />
                  </button>
                  <button 
                    className="qty-btn qty-btn-plus" 
                    onClick={(e) => { e.stopPropagation(); socket.emit('updateStock', { category: activeCategory, name: item.name, stock: item.stock + 1, role: 'admin' }); }}
                    style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #ddd', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <FaPlus size={12} />
                  </button>
                </div>
              )}
              {isEditMode && <span className="admin-menu-item-edit-icon"><FaEdit /></span>}
            </motion.div>
          ))}
        </div>
        {/* Add Food Item Modal */}
        {showAddModal && (
          <div className="modal-bg fade-in">
            <div className="modal" style={{ minWidth: 340, maxWidth: 400, margin: 'auto', borderRadius: 16, padding: 32, background: '#fff', boxShadow: '0 8px 32px rgba(36,107,253,0.10)' }}>
              <h2 style={{ marginBottom: 18 }}>Add Food Item</h2>
              <form onSubmit={handleAddFoodItem}>
                <input type="text" placeholder="Name" value={newMenuItem.name} onChange={e => setNewMenuItem(n => ({ ...n, name: e.target.value }))} required style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: '1.1rem', marginBottom: 16 }} />
                <input type="number" placeholder="Price (₱)" value={newMenuItem.price || ''} min={1} required onChange={e => setNewMenuItem(n => ({ ...n, price: Number(e.target.value) }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: '1.1rem', marginBottom: 16 }} />
                <input type="number" placeholder="Stock" value={newMenuItem.stock || ''} min={0} required onChange={e => setNewMenuItem(n => ({ ...n, stock: Number(e.target.value) }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: '1.1rem', marginBottom: 16 }} />
                {addError && <div style={{ color: 'red', marginBottom: 8 }}>{addError}</div>}
                <button type="submit" disabled={addLoading} style={{ background: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 600, fontSize: 16, cursor: 'pointer', width: '100%', marginBottom: 8 }}>{addLoading ? 'Adding...' : 'Add'}</button>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ background: '#eee', color: '#333', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 600, fontSize: 16, cursor: 'pointer', width: '100%' }}>Cancel</button>
              </form>
            </div>
          </div>
        )}
        {/* Edit Food Item Modal */}
        {showAdminEditModal && editTarget && (
          <div className="modal-bg fade-in">
            <div className="modal" style={{ minWidth: 340, maxWidth: 400, margin: 'auto', borderRadius: 16, padding: 32, background: '#fff', boxShadow: '0 8px 32px rgba(36,107,253,0.10)' }}>
              <h2 style={{ marginBottom: 18 }}>Edit Food Item</h2>
              <form onSubmit={handleEditFoodItem}>
                <input type="text" placeholder="Food name" value={editTarget.name} onChange={e => setEditTarget(t => ({ ...t, name: e.target.value }))} required style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.1px solid #e0e0e0', fontSize: '1.1rem', marginBottom: 16 }} />
                <input type="text" placeholder="Image URL" value={editTarget.img} onChange={e => setEditTarget(t => ({ ...t, img: e.target.value }))} required style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.1px solid #e0e0e0', fontSize: '1.1rem', marginBottom: 16 }} />
                <input type="number" placeholder="Price (₱)" value={editTarget.price || ''} min={1} required onChange={e => setEditTarget(t => ({ ...t, price: Number(e.target.value) }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.1px solid #e0e0e0', fontSize: '1.1rem', marginBottom: 16 }} />
                {editError && <div style={{ color: 'red', marginBottom: 8 }}>{editError}</div>}
                <button type="submit" disabled={editLoading} style={{ background: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 600, fontSize: 16, cursor: 'pointer', width: '100%', marginBottom: 8 }}>{editLoading ? 'Saving...' : 'Save'}</button>
                <button type="button" onClick={handleDeleteFoodItem} style={{ background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 600, fontSize: 16, cursor: 'pointer', width: '100%', marginBottom: 8 }}>Delete</button>
                <button type="button" onClick={() => setShowAdminEditModal(false)} style={{ background: '#eee', color: '#333', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 600, fontSize: 16, cursor: 'pointer', width: '100%' }}>Cancel</button>
              </form>
            </div>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="main-content">
      <div className="content-header">
        <div className="title-section">
          <h1>{title}</h1>
          <p className="subtitle">{subtitle}</p>
        </div>
        {tab === 'pending' && (
          <button className="new-order-btn" onClick={() => {
            setForm({ category: 'Appetizer', item: menu['Appetizer'][0].name, quantity: 1, customer: '', type: 'Dine-in', table: '', specialInstructions: '' });
            setOrderItems([]);
            setBasketCount(0);
            setShowModal(true);
            setShowOrderSummary(false);
            setIsEditMode(false);
            setShowEditModal(false);
            setEditingOrderState(null);
          }}>
            <FaPlus /> New Order
          </button>
        )}
      </div>
      {tab === 'active' && (
        <div className="category-tabs">
          {categories.map((cat) => (
            <button 
              key={cat.value}
              className={`tab-btn${activeCategory === cat.value ? ' active' : ''}`}
              onClick={() => onCategoryChange(cat.value)}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      )}
      {role === 'admin' && renderAdminMenuControls()}
      <div className="orders-grid">
        {/* Pending and Completed: show all orders as single card with all items */}
        {(tab === 'pending' || tab === 'completed') && (
          <AnimatePresence key={tab}>
            {orders.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#aaa', fontSize: '1.2rem', marginTop: '40px' }}>
                No orders yet.
              </div>
            ) : (
              orders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  tab={tab}
                  onStartPreparing={onStartPreparing}
                  onComplete={onComplete}
                  onEditOrder={() => handleEditOrder(order.id)}
                  disableExitAnimation={false}
                />
              ))
            )}
          </AnimatePresence>
        )}
        {/* Active: show orders split by category as before */}
        {tab === 'active' && (
          <AnimatePresence key={tab}>
            {orders.filter(order =>
              order.items.some(item => item.category === activeCategory)
            ).length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#aaa', fontSize: '1.2rem', marginTop: '40px' }}>
                No {getCategoryLabel(activeCategory)} orders yet.
              </div>
            ) : (
              orders.filter(order =>
                order.items.some(item => item.category === activeCategory)
              ).map(order => (
                <OrderCard
                  key={order.id + '-' + activeCategory}
                  order={{
                    ...order,
                    items: order.items.filter(item => item.category === activeCategory),
                    category: activeCategory
                  }}
                  tab={tab}
                  onStartPreparing={onStartPreparing}
                  onComplete={onComplete}
                  onEditOrder={() => handleEditOrder(order.id)}
                  disableExitAnimation={false}
                />
              ))
            )}
          </AnimatePresence>
        )}
      </div>

      {showEditModal && editingOrderState && (
        <>
          {console.log('DEBUG: Opening EditOrderModal with (editingOrderState):', editingOrderState)}
          <EditOrderModal
            order={editingOrderState}
            onUpdateOrder={onUpdateOrder}
            onClose={() => { setShowEditModal(false); setEditingOrderState(null); }}
            onBrowseMenu={handleBrowseMenuFromEdit}
            onDeleteOrder={tab === 'pending' ? onCancelOrder : undefined}
            activeCategory={activeCategory}
            tab={tab}
          />
        </>
      )}

      {showModal && !showEditModal && (
        <div className="modal-bg">
          <div className="modal modal-horizontal">
            {/* Left Panel */}
            <div className="modal-left">
              <form onSubmit={handleNewOrder} className="modal-form-horizontal">
                <label>
                  Category
                  <select name="category" value={form.category} onChange={handleInputChange} required 
                    disabled={isEditMode && tab === 'active'}>
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Item Name
                  <input name="item" value={form.item} readOnly />
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#f0f0f0',
                    color: '#333',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    marginTop: '8px',
                    fontWeight: '500',
                    fontSize: '1em',
                    width: '100%'
                  }}>
                    <span>Stock:</span>
                    <span style={{ fontWeight: '600' }}>{(menuState[form.category] || []).find(i => i.name === form.item)?.stock || 0}</span>
                  </div>
                </label>
                <label>
                  Quantity
                  <div className="quantity-container">
                    <button 
                      type="button" 
                      className="qty-btn qty-btn-minus" 
                      onClick={() => handleQuantity(-1)}
                      data-testid="decrease-qty"
                      aria-label="Decrease quantity"
                    >
                      <FaMinus />
                    </button>
                    <span className="qty-value">{form.quantity}</span>
                    <button 
                      type="button" 
                      className="qty-btn qty-btn-plus" 
                      onClick={() => handleQuantity(1)}
                      data-testid="increase-qty"
                      aria-label="Increase quantity"
                    >
                      <FaPlus />
                    </button>
                  </div>
                </label>
              </form>
              <div className="modal-actions-horizontal" style={{ marginTop: 'auto' }}>
                <button 
                  type="button" 
                  className="modal-submit-horizontal" 
                  onClick={handleAddToBasket}
                >
                  <FaShoppingBasket style={{ marginRight: 12, fontSize: 28 }} /> Add to Order
                </button>
                <button type="button" className="modal-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </div>
            {/* Right Panel */}
            <div className="modal-right">
              <input
                type="text"
                className="food-search-input"
                placeholder="Search food..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  marginBottom: 18,
                  padding: '10px 16px',
                  borderRadius: '18px',
                  border: '1.5px solid #e0e0e0',
                  fontSize: '1.05rem',
                  background: '#f7f7fa',
                  color: 'var(--text-color)',
                  outline: 'none',
                  boxShadow: '0 1px 4px rgba(36,107,253,0.04)'
                }}
              />
              <div className="gallery-grid animated-grid">
                {filteredMenuItems.map((item, idx) => (
                  <motion.button
                    key={item.name}
                    className={`gallery-item animated-card${form.item === item.name ? ' selected' : ''}${isEditMode ? ' edit-mode' : ''}`}
                    type="button"
                    style={{ animationDelay: `${idx * 60}ms` }}
                    onClick={() => handleGallerySelect(item.name)}
                    layout
                    initial={false}
                    transition={{
                      type: 'spring',
                      stiffness: 90,
                      damping: 32,
                      delay: 0.05
                    }}
                  >
                    <img src={item.img} alt={item.name} />
                    <span className="food-label">
                      {item.name}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
            <div className="basket-container">
              <button 
                type="button" 
                className="basket-button"
                aria-label="View basket"
                onClick={handleViewBasket}
              >
                <FaShoppingBasket />
                {basketCount > 0 && <span className="basket-count">{basketCount}</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {showOrderSummary && !isEditMode && (
        <div className="modal-bg">
          <div className="modal order-summary-modal">
            <h2>Order Summary</h2>
            {/* Only show for new orders */}
            <div className="order-summary-content">
              {Object.keys(groupedItems).length === 0 ? (
                <p className="empty-basket">Your basket is empty</p>
              ) : (
                <div className="order-items-list">
                  {Object.entries(groupedItems).map(([category, items]) => (
                    <div key={category} className="order-category-group">
                      <h3>{category === 'Appetizer' ? 'Appetizers' : 
                           category === 'Main' ? 'Mains' : 'Drinks'}</h3>
                      {items.map((item, index) => (
                        <div key={index} className="order-item-row">
                          <span className="order-item-name">{item.name} <span style={{ color: '#888', fontWeight: 500, fontSize: 13 }}>₱{item.price ?? (menu[category]?.find(m => m.name === item.name)?.price || 0)}</span></span>
                          <div className="item-quantity-controls">
                            <span className="order-item-quantity">×{item.quantity}</span>
                            <span className="order-item-total" style={{ marginLeft: 8, color: '#246bfd', fontWeight: 600, fontSize: 14 }}>₱{(item.price ?? (menu[category]?.find(m => m.name === item.name)?.price || 0)) * item.quantity}</span>
                            <button 
                              className="remove-item-btn" 
                              aria-label="Remove item"
                              onClick={() => handleRemoveItem(item.name)}
                            >
                              <FaTimes />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
              
              <div className="order-summary-form">
                <label>
                  Customer Name
                  <input 
                    type="text" 
                    name="customer" 
                    value={form.customer} 
                    onChange={handleInputChange}
                    placeholder="Enter customer name"
                  />
                </label>
                
                <label>
                  Order Type
                  <select name="type" value={form.type} onChange={handleInputChange}>
                    <option value="Dine-in">Dine-in</option>
                    <option value="Take out">Take out</option>
                  </select>
                </label>
                
                {form.type === 'Dine-in' && (
                  <label>
                    Table Number
                    <input 
                      type="number" 
                      name="table" 
                      value={form.table} 
                      onChange={handleInputChange}
                      min="1"
                      max="50"
                    />
                  </label>
                )}
                <div className="special-instructions-row" style={{ background: 'rgba(255, 204, 0, 0.1)', borderRadius: '8px', padding: '12px', margin: '12px 0', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ color: '#f4932a', fontSize: '1.3em', marginTop: '2px' }}>
                    <FaExclamationTriangle />
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#f4932a', marginBottom: '4px' }}>Special Instructions</div>
                    <textarea
                      name="specialInstructions"
                      value={form.specialInstructions}
                      onChange={handleInputChange}
                      placeholder="e.g. No onions, extra ginger"
                      rows={2}
                      style={{ width: '100%', borderRadius: '6px', border: '1.5px solid #ffe0a3', background: '#fffbe6', padding: '8px', fontSize: '1em', resize: 'vertical' }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="order-summary-actions">
                <button 
                  type="button" 
                  className="confirm-order-btn"
                  onClick={handleNewOrder}
                  disabled={basketCount === 0}
                >
                  Confirm Order
                </button>
                <button 
                  type="button" 
                  className="back-btn"
                  onClick={handleBackToOrderModal}
                >
                  Back to Order
                </button>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 17, marginTop: 12, color: 'var(--primary-color)' }}>
              Subtotal: ₱{Object.values(groupedItems).flat().reduce((sum, item) => sum + (item.price ?? (menu[item.category]?.find(m => m.name === item.name)?.price || 0)) * item.quantity, 0)}
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default MainContent;
