import React, { useState } from 'react';
import { FaCheck, FaPause, FaPencilAlt, FaExclamationTriangle, FaUser, FaRegClock, FaTable, FaUtensils, FaHamburger, FaWineGlass, FaPlay, FaTimes } from 'react-icons/fa';
import { MdOutlineRestaurant } from 'react-icons/md';
import './OrderCard.css';
import { motion } from 'framer-motion';

const OrderCard = ({ order, tab, onStartPreparing, onComplete, onEditOrder, disableExitAnimation }) => {
  const { id, orderGroupId, status, urgent, table, time, items, specialInstructions, customer, type, category } = order;
  const [isPaused, setIsPaused] = useState(false);

  // Get the display ID (either the group ID or the base part of the ID)
  const displayId = id;
  
  // Get category icon
  const getCategoryIcon = () => {
    switch(category) {
      case 'Appetizer':
        return <FaUtensils className="category-icon appetizer" />;
      case 'Main':
        return <FaHamburger className="category-icon main" />;
      case 'Drink':
        return <FaWineGlass className="category-icon drink" />;
      default:
        return null;
    }
  };

  const handlePauseToggle = () => {
    setIsPaused(prev => !prev);
  };

  const handleEdit = () => {
    if (onEditOrder) {
      onEditOrder(id);
    }
  };

  // For active tab, show Complete X/Y logic
  const isActive = tab === 'active';
  const isPending = tab === 'pending';
  const isCompleted = tab === 'completed';
  const completedCategories = order.completedCategories || [];
  // Always use 1 if categories is undefined (single-category orders)
  const totalCategories = order.categories ? order.categories.length : 1;
  // For single-category orders, fallback to the order's category
  const currentCategory = order.category || (order.items[0] && order.items[0].category);
  const isCategoryCompleted = isActive && completedCategories.includes(currentCategory);
  const completedCount = completedCategories.length;

  // Animation variants for framer-motion
  const cardVariants = {
    initial: { opacity: 0, y: 40, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    exit: disableExitAnimation ? {} : { opacity: 0, scale: 0.7, y: 20, transition: { duration: 0.18, ease: [0.4, 0, 0.2, 1] } },
    hover: { scale: 1.03, boxShadow: '0 8px 32px rgba(36,107,253,0.10)' },
    tap: { scale: 0.98 },
  };

  // For pending tab, show all items. For active tab, show only items for the current category.
  let displayItems = items || [];
  if (tab === 'active' && category) {
    displayItems = displayItems.filter(item => item.category === category);
  }
  // Merge items by name and category to prevent duplicate display
  const mergedItemsMap = {};
  displayItems.forEach(item => {
    const key = item.name + '||' + item.category;
    if (!mergedItemsMap[key]) {
      mergedItemsMap[key] = { ...item };
    } else {
      mergedItemsMap[key].quantity += item.quantity;
    }
  });
  const mergedItems = Object.values(mergedItemsMap);

  return (
    <motion.div
      className={`order-card${status === 'new' ? ' new' : ''}${id === '1234' ? ' orange-outline' : ''} ${isActive ? 'active' : ''} ${isPending ? 'pending' : ''} ${isCompleted ? 'completed' : ''}`}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover="hover"
      whileTap="tap"
      layout
      layoutId={`order-card-${id}`}
      style={{
        borderRadius: 24,
        boxShadow: isActive ? '0 8px 32px rgba(36,107,253,0.10)' : '0 2px 8px rgba(0,0,0,0.10)',
        transition: 'border-radius 0.35s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.35s cubic-bezier(0.23, 1, 0.32, 1)'
      }}
    >
      <div className="card-header">
        <div className="order-id-and-tags">
          <span className="order-id">Order <span className="order-hash">#{displayId}</span></span>
          {isPending && <span className="tag new">New</span>}
          {isActive && urgent && <span className="tag urgent">Urgent</span>}
          {isActive && <span className="tag preparing">Preparing</span>}
        </div>
        <div className="status-tags">
          {getCategoryIcon()}
        </div>
      </div>

      <div className="order-details">
        <div className="table-info">
          <FaTable />
          <span>Table {table}</span>
          <span style={{ margin: '0 4px', fontWeight: 700 }}>&bull;</span>
          <FaRegClock />
          <span className="time" style={{ marginLeft: '0' }}>{time}</span>
        </div>

        <div className={`order-items${!specialInstructions ? ' no-special' : ''}`}>
          {mergedItems.map((item, index) => (
            <div key={item.name + '-' + item.category} className="item">
              <span className="item-name">{item.name}</span>
              <span className="item-quantity">×{item.quantity}</span>
            </div>
          ))}
        </div>

        {specialInstructions && (
          <div className="special-instructions">
            <div className="instructions-header">
              <FaExclamationTriangle />
              <span>Special Instructions</span>
            </div>
            <p>{specialInstructions}</p>
          </div>
        )}
      </div>

      <div className="card-footer">
        <div className="customer-type-row" style={{ alignItems: 'flex-start' }}>
          <div className="customer-action-col" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexGrow: 1 }}>
            <div className="customer">
              <span className="customer-avatar">
                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(customer)}&background=246BFD&color=fff`} alt={customer} />
              </span>
              <span>{customer}</span>
            </div>
            <div className="action-buttons" style={{ marginTop: 'auto', paddingTop: '20px' }}>
              {isPending && (
                <button className="btn-start" onClick={() => onStartPreparing(id)}>
                  <FaPencilAlt /> Start Preparing
                </button>
              )}
              {isActive && !isPaused && (
                <button
                  className="btn-complete"
                  onClick={() => onComplete(id, currentCategory)}
                  disabled={isCategoryCompleted}
                >
                  <FaCheck /> Complete {completedCount}/{totalCategories}
                </button>
              )}
              {isActive && isPaused && (
                <button className="btn-continue" onClick={handlePauseToggle}>
                  <FaPlay /> Continue
                </button>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <span className="order-type" style={{ whiteSpace: 'nowrap' }}>
              Order Type: {type}
            </span>
            <div className="edit-pause-buttons" style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              {isActive && (
                <>
                  <button className="btn-icon" onClick={handleEdit}>
                    <FaPencilAlt />
                  </button>
                  {!isPaused && (
                    <button className="btn-icon" onClick={handlePauseToggle}>
                      <FaPause />
                    </button>
                  )}
                </>
              )}
              {isPending && (
                <button className="btn-icon" onClick={handleEdit}>
                  <FaPencilAlt />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default OrderCard;
