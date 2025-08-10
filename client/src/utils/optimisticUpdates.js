/**
 * Optimistic Updates Utility
 * 
 * This utility provides functions for managing optimistic UI updates,
 * allowing the UI to update immediately before server confirmation
 * and handling rollbacks if the server operation fails.
 */

// Map to store optimistic updates by resource type and ID
const optimisticUpdatesMap = new Map();

/**
 * Register an optimistic update
 * @param {string} resourceType - Type of resource (e.g., 'message', 'report')
 * @param {string} resourceId - ID of the resource
 * @param {Object} originalData - Original data before update
 * @param {Object} optimisticData - Data after optimistic update
 * @returns {string} Update ID
 */
export const registerOptimisticUpdate = (resourceType, resourceId, originalData, optimisticData) => {
  const updateId = `${resourceType}-${resourceId}-${Date.now()}`;
  
  // Store update information
  optimisticUpdatesMap.set(updateId, {
    resourceType,
    resourceId,
    originalData,
    optimisticData,
    timestamp: Date.now(),
    status: 'pending' // pending, confirmed, rolled-back
  });
  
  // Dispatch event for listeners
  window.dispatchEvent(new CustomEvent('optimistic:update-registered', {
    detail: {
      updateId,
      resourceType,
      resourceId,
      optimisticData
    }
  }));
  
  return updateId;
};

/**
 * Confirm an optimistic update (server operation succeeded)
 * @param {string} updateId - ID of the update to confirm
 * @param {Object} serverData - Actual data from server
 * @returns {boolean} True if update was found and confirmed
 */
export const confirmOptimisticUpdate = (updateId, serverData) => {
  if (!optimisticUpdatesMap.has(updateId)) {
    return false;
  }
  
  const update = optimisticUpdatesMap.get(updateId);
  update.status = 'confirmed';
  update.serverData = serverData;
  update.confirmedAt = Date.now();
  
  // Dispatch event for listeners
  window.dispatchEvent(new CustomEvent('optimistic:update-confirmed', {
    detail: {
      updateId,
      resourceType: update.resourceType,
      resourceId: update.resourceId,
      serverData
    }
  }));
  
  // Clean up after confirmation
  setTimeout(() => {
    optimisticUpdatesMap.delete(updateId);
  }, 5000);
  
  return true;
};

/**
 * Roll back an optimistic update (server operation failed)
 * @param {string} updateId - ID of the update to roll back
 * @param {Error} error - Error that caused the rollback
 * @returns {boolean} True if update was found and rolled back
 */
export const rollbackOptimisticUpdate = (updateId, error) => {
  if (!optimisticUpdatesMap.has(updateId)) {
    return false;
  }
  
  const update = optimisticUpdatesMap.get(updateId);
  update.status = 'rolled-back';
  update.error = error;
  update.rolledBackAt = Date.now();
  
  // Dispatch event for listeners
  window.dispatchEvent(new CustomEvent('optimistic:update-rolled-back', {
    detail: {
      updateId,
      resourceType: update.resourceType,
      resourceId: update.resourceId,
      originalData: update.originalData,
      error
    }
  }));
  
  // Clean up after rollback
  setTimeout(() => {
    optimisticUpdatesMap.delete(updateId);
  }, 5000);
  
  return true;
};

/**
 * Get all pending optimistic updates for a resource type
 * @param {string} resourceType - Type of resource
 * @returns {Array} Array of pending updates
 */
export const getPendingUpdatesForType = (resourceType) => {
  const updates = [];
  
  optimisticUpdatesMap.forEach((update, updateId) => {
    if (update.resourceType === resourceType && update.status === 'pending') {
      updates.push({
        updateId,
        ...update
      });
    }
  });
  
  return updates;
};

/**
 * Get optimistic data for a resource if it exists
 * @param {string} resourceType - Type of resource
 * @param {string} resourceId - ID of the resource
 * @returns {Object|null} Optimistic data or null if not found
 */
export const getOptimisticData = (resourceType, resourceId) => {
  let result = null;
  
  optimisticUpdatesMap.forEach(update => {
    if (update.resourceType === resourceType && 
        update.resourceId === resourceId && 
        update.status === 'pending') {
      result = update.optimisticData;
    }
  });
  
  return result;
};

/**
 * Check if a resource has pending optimistic updates
 * @param {string} resourceType - Type of resource
 * @param {string} resourceId - ID of the resource
 * @returns {boolean} True if resource has pending updates
 */
export const hasOptimisticUpdates = (resourceType, resourceId) => {
  return getOptimisticData(resourceType, resourceId) !== null;
};

/**
 * Apply optimistic updates to a collection of resources
 * @param {string} resourceType - Type of resources
 * @param {Array} resources - Collection of resources
 * @returns {Array} Resources with optimistic updates applied
 */
export const applyOptimisticUpdatesToCollection = (resourceType, resources) => {
  if (!resources || !Array.isArray(resources)) {
    return resources;
  }
  
  return resources.map(resource => {
    const optimisticData = getOptimisticData(resourceType, resource.id);
    return optimisticData || resource;
  });
};