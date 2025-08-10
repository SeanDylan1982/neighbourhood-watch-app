/**
 * Offline Operation Queue
 * 
 * This utility manages a queue of operations that need to be performed when the application
 * is offline. When the connection is restored, these operations are executed in order.
 */

// Queue storage key in localStorage
const QUEUE_STORAGE_KEY = 'offline_operation_queue';

/**
 * Get the current operation queue from localStorage
 * @returns {Array} Array of queued operations
 */
export const getQueue = () => {
  try {
    const queueData = localStorage.getItem(QUEUE_STORAGE_KEY);
    return queueData ? JSON.parse(queueData) : [];
  } catch (error) {
    console.error('Error retrieving offline operation queue:', error);
    return [];
  }
};

/**
 * Save the operation queue to localStorage
 * @param {Array} queue - The queue to save
 */
export const saveQueue = (queue) => {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Error saving offline operation queue:', error);
  }
};

/**
 * Add an operation to the queue
 * @param {Object} operation - The operation to queue
 * @param {string} operation.type - Operation type (e.g., 'create', 'update', 'delete')
 * @param {string} operation.resource - Resource type (e.g., 'message', 'report')
 * @param {string} operation.endpoint - API endpoint for the operation
 * @param {string} operation.method - HTTP method (GET, POST, PUT, DELETE)
 * @param {Object} operation.data - Operation data payload
 * @param {Object} operation.metadata - Additional metadata (timestamp, user, etc.)
 * @returns {string} Operation ID
 */
export const addToQueue = (operation) => {
  const queue = getQueue();
  
  // Generate unique ID for the operation
  const operationId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Add operation to queue with metadata
  const queuedOperation = {
    id: operationId,
    ...operation,
    metadata: {
      ...(operation.metadata || {}),
      queuedAt: new Date().toISOString(),
      attempts: 0
    }
  };
  
  queue.push(queuedOperation);
  saveQueue(queue);
  
  // Dispatch event for listeners
  window.dispatchEvent(new CustomEvent('offline:operation-queued', { 
    detail: queuedOperation 
  }));
  
  return operationId;
};

/**
 * Remove an operation from the queue
 * @param {string} operationId - ID of the operation to remove
 * @returns {boolean} True if operation was found and removed
 */
export const removeFromQueue = (operationId) => {
  const queue = getQueue();
  const initialLength = queue.length;
  
  const filteredQueue = queue.filter(op => op.id !== operationId);
  
  if (filteredQueue.length !== initialLength) {
    saveQueue(filteredQueue);
    
    // Dispatch event for listeners
    window.dispatchEvent(new CustomEvent('offline:operation-removed', { 
      detail: { operationId } 
    }));
    
    return true;
  }
  
  return false;
};

/**
 * Update an operation in the queue
 * @param {string} operationId - ID of the operation to update
 * @param {Object} updates - Updates to apply to the operation
 * @returns {boolean} True if operation was found and updated
 */
export const updateOperation = (operationId, updates) => {
  const queue = getQueue();
  let updated = false;
  
  const updatedQueue = queue.map(op => {
    if (op.id === operationId) {
      updated = true;
      return { ...op, ...updates };
    }
    return op;
  });
  
  if (updated) {
    saveQueue(updatedQueue);
    
    // Dispatch event for listeners
    window.dispatchEvent(new CustomEvent('offline:operation-updated', { 
      detail: { operationId, updates } 
    }));
  }
  
  return updated;
};

/**
 * Clear the entire operation queue
 */
export const clearQueue = () => {
  saveQueue([]);
  
  // Dispatch event for listeners
  window.dispatchEvent(new CustomEvent('offline:queue-cleared'));
};

/**
 * Get the number of operations in the queue
 * @returns {number} Queue length
 */
export const getQueueLength = () => {
  return getQueue().length;
};

/**
 * Process the operation queue by executing each operation
 * @param {Function} processOperation - Function to process a single operation
 * @param {Object} options - Processing options
 * @param {boolean} options.removeOnSuccess - Remove operations from queue on success
 * @param {boolean} options.stopOnError - Stop processing on first error
 * @param {number} options.maxAttempts - Maximum number of attempts per operation
 * @returns {Promise<Object>} Processing results
 */
export const processQueue = async (processOperation, options = {}) => {
  const {
    removeOnSuccess = true,
    stopOnError = false,
    maxAttempts = 3
  } = options;
  
  const queue = getQueue();
  const results = {
    total: queue.length,
    successful: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };
  
  if (queue.length === 0) {
    return results;
  }
  
  // Dispatch event for listeners
  window.dispatchEvent(new CustomEvent('offline:processing-started', { 
    detail: { queueLength: queue.length } 
  }));
  
  const updatedQueue = [...queue];
  
  for (let i = 0; i < updatedQueue.length; i++) {
    const operation = updatedQueue[i];
    
    // Skip operations that have exceeded max attempts
    if (operation.metadata.attempts >= maxAttempts) {
      results.skipped++;
      continue;
    }
    
    try {
      // Update attempt count
      operation.metadata.attempts++;
      operation.metadata.lastAttempt = new Date().toISOString();
      
      // Process the operation
      await processOperation(operation);
      
      // Remove from queue if successful
      if (removeOnSuccess) {
        removeFromQueue(operation.id);
      }
      
      results.successful++;
      
      // Dispatch event for listeners
      window.dispatchEvent(new CustomEvent('offline:operation-processed', { 
        detail: { operation, success: true } 
      }));
    } catch (error) {
      results.failed++;
      results.errors.push({
        operationId: operation.id,
        error: error.message,
        operation
      });
      
      // Update operation with error info
      updateOperation(operation.id, {
        metadata: {
          ...operation.metadata,
          lastError: error.message,
          lastErrorTime: new Date().toISOString()
        }
      });
      
      // Dispatch event for listeners
      window.dispatchEvent(new CustomEvent('offline:operation-processed', { 
        detail: { operation, success: false, error } 
      }));
      
      if (stopOnError) {
        break;
      }
    }
  }
  
  // Dispatch event for listeners
  window.dispatchEvent(new CustomEvent('offline:processing-completed', { 
    detail: results 
  }));
  
  return results;
};