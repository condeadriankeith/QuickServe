import React, { useState, useEffect, useMemo } from 'react';
import { FaShoppingBasket, FaMinus, FaPlus, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import './MainContent.css';
import menu from './menuData'; // Import the menu from a shared file
import { motion, AnimatePresence } from 'framer-motion';

const EditOrderModal = ({ order, onUpdateOrder, onClose, onBrowseMenu, onDeleteOrder, activeCategory, tab }) => {
  const [orderItems, setOrderItems] = useState([]);
  const [form, setForm] = useState({
    customer: '',
    type: 'Dine-in',
    table: '',
    specialInstructions: '',
  });
  const [basketCount, setBasketCount] = useState(0);

  useEffect(() => {
    if (order) {
      console.log('DEBUG: EditOrderModal opened for order:', order);
      setForm({
        customer: order.customer,
        type: order.type,
        table: order.table || '',
        specialInstructions: order.specialInstructions || '',
      });
      // Show all items if in pending tab, otherwise filter by activeCategory
      if (tab === 'pending') {
        setOrderItems(order.items);
        setBasketCount(order.items.reduce((total, item) => total + item.quantity, 0));
      } else if (tab === 'active') {
        setOrderItems(order.items.filter(item => item.category === activeCategory));
        setBasketCount(order.items.filter(item => item.category === activeCategory).reduce((total, item) => total + item.quantity, 0));
      }
    }
    return () => {
      console.log('DEBUG: EditOrderModal closed');
    };
  }, [order, activeCategory, tab]);

  const orderTotal = useMemo(() => {
    return (order.items || []).reduce((sum, item) => sum + ((item.price ?? (menu[item.category]?.find(m => m.name === item.name)?.price || 0)) * item.quantity), 0);
  }, [order]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleQuantity = (itemName, delta) => {
    setOrderItems(items => items.map(item =>
      item.name === itemName ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ));
    setBasketCount(count => count + delta);
  };

  const handleRemoveItem = (itemName) => {
    const item = orderItems.find(i => i.name === itemName);
    if (!item) return;
    setOrderItems(items => items.filter(i => i.name !== itemName));
    setBasketCount(count => count - item.quantity);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const today = new Date();

    // order.items contains all original items from the order prop
    // The local `orderItems` state in EditOrderModal contains only items for the activeCategory,
    // potentially modified (quantity changes, removals) or new additions for that category.

    let allUpdatedItems;
    if (tab === 'pending') {
      // Save all items as edited (pending: all items editable)
      allUpdatedItems = orderItems;
    } else if (tab === 'active') {
      // Only update the current category, keep other categories unchanged
      const itemsFromOtherCategories = order.items.filter(item => item.category !== activeCategory);
      const itemsForActiveCategory = orderItems;
      allUpdatedItems = [...itemsFromOtherCategories, ...itemsForActiveCategory];
    }

    const updatedOrder = {
      ...order, // Base properties: id, original status, etc.
      customer: form.customer,
      type: form.type,
      table: form.type === 'Dine-in' ? form.table : '',
      specialInstructions: form.specialInstructions,
      items: allUpdatedItems, // Use the correctly merged list of all items
      time: order.time, // Preserve original order time unless explicitly changed by business logic
      // updatedAt will be set by App.jsx
    };
    onUpdateOrder(updatedOrder);
    onClose();
  };

  const handleAddToBasket = (item) => {
    try {
      console.log('DEBUG: Adding item to basket:', item);
      // ... existing logic for adding item to basket ...
    } catch (e) {
      console.error('ERROR in handleAddToBasket:', e);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="modal-bg fade-in"
        layout
        style={{
          borderRadius: 24,
          boxShadow: '0 8px 32px rgba(36,107,253,0.10)',
          transition: 'border-radius 0.35s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.35s cubic-bezier(0.23, 1, 0.32, 1)'
        }}
      >
        <motion.div
          className="modal order-summary-modal"
          initial={{ scale: 0.95, y: 40, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: -40, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className="order-summary-content">
            {console.log('EditOrderModal rendered, onBrowseMenu:', typeof onBrowseMenu)}
            {orderItems.length === 0 ? (
              <p className="empty-basket">Your basket is empty</p>
            ) : (
              <div className="order-items-list">
                {orderItems.map((item, idx) => (
                  <div key={idx} className="order-item-row" style={{ alignItems: 'center', gap: 10 }}>
                    <img
                      src={(() => {
                        const found = menu[item.category]?.find(m => m.name === item.name);
                        return found ? found.img : '';
                      })()}
                      alt={item.name}
                      style={{ width: 38, height: 38, borderRadius: 8, objectFit: 'cover', marginRight: 10, background: '#f3f3f3', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                    />
                    <span className="order-item-name">{item.name} <span style={{ color: '#888', fontWeight: 500, fontSize: 13 }}>₱{item.price ?? (menu[item.category]?.find(m => m.name === item.name)?.price || 0)}</span></span>
                    <div className="item-quantity-controls">
                      <button className="qty-btn qty-btn-minus" onClick={() => handleQuantity(item.name, -1)} disabled={item.quantity <= 1}><FaMinus /></button>
                      <span className="order-item-quantity">×{item.quantity}</span>
                      <span className="order-item-total" style={{ marginLeft: 8, color: '#246bfd', fontWeight: 600, fontSize: 14 }}>₱{(item.price ?? (menu[item.category]?.find(m => m.name === item.name)?.price || 0)) * item.quantity}</span>
                      <button className="remove-item-btn" onClick={() => handleRemoveItem(item.name)}><FaTimes /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="order-total">
              Total: ₱{orderTotal}
            </div>
            <div className="order-summary-form">
              <label>
                Customer Name
                <input type="text" name="customer" value={form.customer} onChange={handleInputChange} placeholder="Enter customer name" />
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
                  <input type="number" name="table" value={form.table} onChange={handleInputChange} min="1" max="50" />
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
              <button type="button" className="confirm-order-btn" onClick={handleSave} disabled={basketCount === 0}>Save Order</button>
              <button type="button" className="back-btn" onClick={onClose}>Cancel</button>
              <button type="button" className="back-btn" onClick={onBrowseMenu}>Add Food Item</button>
              {onDeleteOrder && (
                <button
                  type="button"
                  className="modal-cancel"
                  style={{ color: '#ff3b30', borderColor: '#ff3b30', marginTop: 12 }}
                  onClick={() => { onDeleteOrder(order.id); onClose(); }}
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EditOrderModal; 