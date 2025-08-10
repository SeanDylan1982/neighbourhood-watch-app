import { useState, useEffect } from 'react';

const useViewPreference = (storageKey, defaultView = 'grid') => {
  const [currentView, setCurrentView] = useState(() => {
    // Get initial value from localStorage or use default
    const saved = localStorage.getItem(storageKey);
    return saved || defaultView;
  });

  const handleViewChange = (view) => {
    setCurrentView(view);
    localStorage.setItem(storageKey, view);
  };

  return [currentView, handleViewChange];
};

export default useViewPreference;