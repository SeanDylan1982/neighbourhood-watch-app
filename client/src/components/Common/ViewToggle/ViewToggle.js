import React from 'react';
import FluentIcon from '../Icons/FluentIcon';
import './ViewToggle.css';

const ViewToggle = ({ currentView, onViewChange, storageKey }) => {
  const handleViewChange = (view) => {
    onViewChange(view);
    // Persist preference to localStorage
    if (storageKey) {
      localStorage.setItem(storageKey, view);
    }
  };

  return (
    <div className="view-toggle">
      <button
        className={`view-toggle__button ${currentView === 'grid' ? 'view-toggle__button--active' : ''}`}
        onClick={() => handleViewChange('grid')}
        aria-label="Grid view"
        title="Grid view"
      >
        <FluentIcon name="Grid" size={16} />
      </button>
      <button
        className={`view-toggle__button ${currentView === 'list' ? 'view-toggle__button--active' : ''}`}
        onClick={() => handleViewChange('list')}
        aria-label="List view"
        title="List view"
      >
        <FluentIcon name="List" size={16} />
      </button>
    </div>
  );
};

export default ViewToggle;