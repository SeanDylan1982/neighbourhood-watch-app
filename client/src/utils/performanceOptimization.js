import { memo, useMemo, useCallback } from 'react';

/**
 * Performance optimization utilities for React components
 */

/**
 * Higher-order component for memoizing components with custom comparison
 * @param {React.Component} Component - Component to memoize
 * @param {Function} areEqual - Custom comparison function
 * @returns {React.Component} Memoized component
 */
export const withMemo = (Component, areEqual) => {
  return memo(Component, areEqual);
};

/**
 * Custom comparison function for chat list items
 * @param {Object} prevProps - Previous props
 * @param {Object} nextProps - Next props
 * @returns {boolean} Whether props are equal
 */
export const chatListItemPropsAreEqual = (prevProps, nextProps) => {
  // Compare essential props that affect rendering
  return (
    prevProps.chat?.id === nextProps.chat?.id &&
    prevProps.chat?.name === nextProps.chat?.name &&
    prevProps.chat?.lastMessage?.id === nextProps.chat?.lastMessage?.id &&
    prevProps.chat?.lastMessage?.content === nextProps.chat?.lastMessage?.content &&
    prevProps.chat?.unreadCount === nextProps.chat?.unreadCount &&
    prevProps.chat?.isOnline === nextProps.chat?.isOnline &&
    prevProps.selectedChatId === nextProps.selectedChatId &&
    prevProps.onChatSelect === nextProps.onChatSelect &&
    prevProps.onChatAction === nextProps.onChatAction
  );
};

/**
 * Custom comparison function for message bubbles
 * @param {Object} prevProps - Previous props
 * @param {Object} nextProps - Next props
 * @returns {boolean} Whether props are equal
 */
export const messageBubblePropsAreEqual = (prevProps, nextProps) => {
  return (
    prevProps.message?.id === nextProps.message?.id &&
    prevProps.message?.content === nextProps.message?.content &&
    prevProps.message?.status === nextProps.message?.status &&
    prevProps.message?.reactions?.length === nextProps.message?.reactions?.length &&
    prevProps.isOwn === nextProps.isOwn &&
    prevProps.showAvatar === nextProps.showAvatar &&
    prevProps.showTimestamp === nextProps.showTimestamp
  );
};

/**
 * Hook for memoizing expensive calculations
 * @param {Function} factory - Function that returns the calculated value
 * @param {Array} deps - Dependencies array
 * @returns {*} Memoized value
 */
export const useExpensiveCalculation = (factory, deps) => {
  return useMemo(factory, deps);
};

/**
 * Hook for memoizing event handlers
 * @param {Function} callback - Callback function
 * @param {Array} deps - Dependencies array
 * @returns {Function} Memoized callback
 */
export const useStableCallback = (callback, deps) => {
  return useCallback(callback, deps);
};

/**
 * Debounce function for performance optimization
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {boolean} immediate - Whether to execute immediately
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait, immediate) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
};

/**
 * Throttle function for performance optimization
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Utility to check if an object has changed (shallow comparison)
 * @param {Object} obj1 - First object
 * @param {Object} obj2 - Second object
 * @returns {boolean} Whether objects are different
 */
export const hasObjectChanged = (obj1, obj2) => {
  if (obj1 === obj2) return false;
  if (!obj1 || !obj2) return true;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return true;
  
  for (let key of keys1) {
    if (obj1[key] !== obj2[key]) return true;
  }
  
  return false;
};

/**
 * Utility to check if an array has changed (shallow comparison)
 * @param {Array} arr1 - First array
 * @param {Array} arr2 - Second array
 * @returns {boolean} Whether arrays are different
 */
export const hasArrayChanged = (arr1, arr2) => {
  if (arr1 === arr2) return false;
  if (!arr1 || !arr2) return true;
  if (arr1.length !== arr2.length) return true;
  
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return true;
  }
  
  return false;
};

/**
 * Performance monitoring utility
 */
export class PerformanceMonitor {
  static measurements = new Map();
  
  static start(label) {
    this.measurements.set(label, performance.now());
  }
  
  static end(label) {
    const startTime = this.measurements.get(label);
    if (startTime) {
      const duration = performance.now() - startTime;
      console.log(`Performance: ${label} took ${duration.toFixed(2)}ms`);
      this.measurements.delete(label);
      return duration;
    }
    return null;
  }
  
  static measure(label, fn) {
    this.start(label);
    const result = fn();
    this.end(label);
    return result;
  }
  
  static async measureAsync(label, fn) {
    this.start(label);
    const result = await fn();
    this.end(label);
    return result;
  }
}

/**
 * Memory usage monitoring utility
 */
export class MemoryMonitor {
  static logMemoryUsage(label = 'Memory Usage') {
    if (performance.memory) {
      const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory;
      console.log(`${label}:`, {
        used: `${(usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
      });
    }
  }
  
  static getMemoryUsage() {
    if (performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
    }
    return null;
  }
}