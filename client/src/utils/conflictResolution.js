/**
 * Conflict Resolution Utility
 * 
 * This utility provides functions for detecting and resolving conflicts
 * that may occur when multiple users modify the same data concurrently.
 */

/**
 * Conflict resolution strategies
 */
export const ConflictStrategy = {
  CLIENT_WINS: 'client_wins',
  SERVER_WINS: 'server_wins',
  LAST_WRITE_WINS: 'last_write_wins',
  MERGE: 'merge',
  MANUAL: 'manual'
};

/**
 * Default conflict resolution strategy by resource type
 */
const DEFAULT_STRATEGIES = {
  message: ConflictStrategy.LAST_WRITE_WINS,
  report: ConflictStrategy.MERGE,
  notice: ConflictStrategy.LAST_WRITE_WINS,
  chatGroup: ConflictStrategy.MERGE,
  privateChat: ConflictStrategy.LAST_WRITE_WINS,
  user: ConflictStrategy.MERGE,
  default: ConflictStrategy.SERVER_WINS
};

/**
 * Check if there's a conflict between client and server versions
 * @param {Object} clientData - Client version of the data
 * @param {Object} serverData - Server version of the data
 * @param {Object} options - Conflict detection options
 * @param {Array} options.ignoreFields - Fields to ignore when comparing
 * @param {Function} options.customComparator - Custom comparison function
 * @returns {boolean} True if conflict detected
 */
export const detectConflict = (clientData, serverData, options = {}) => {
  const { ignoreFields = [], customComparator = null } = options;
  
  // Use custom comparator if provided
  if (customComparator) {
    return customComparator(clientData, serverData);
  }
  
  // Check if versions exist and differ
  if (clientData.version && serverData.version) {
    return clientData.version !== serverData.version;
  }
  
  // Check if updatedAt timestamps exist and differ
  if (clientData.updatedAt && serverData.updatedAt) {
    return new Date(clientData.updatedAt).getTime() !== new Date(serverData.updatedAt).getTime();
  }
  
  // Deep comparison of objects excluding ignored fields
  return !objectsEqual(clientData, serverData, ignoreFields);
};

/**
 * Deep comparison of objects
 * @param {Object} obj1 - First object
 * @param {Object} obj2 - Second object
 * @param {Array} ignoreFields - Fields to ignore
 * @returns {boolean} True if objects are equal
 */
const objectsEqual = (obj1, obj2, ignoreFields = []) => {
  if (obj1 === obj2) return true;
  if (!obj1 || !obj2) return false;
  
  const keys1 = Object.keys(obj1).filter(key => !ignoreFields.includes(key));
  const keys2 = Object.keys(obj2).filter(key => !ignoreFields.includes(key));
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    const val1 = obj1[key];
    const val2 = obj2[key];
    
    if (ignoreFields.includes(key)) continue;
    
    const areObjects = isObject(val1) && isObject(val2);
    
    if (areObjects && !objectsEqual(val1, val2, ignoreFields)) {
      return false;
    }
    
    if (!areObjects && val1 !== val2) {
      return false;
    }
  }
  
  return true;
};

/**
 * Check if value is an object
 * @param {*} obj - Value to check
 * @returns {boolean} True if value is an object
 */
const isObject = (obj) => {
  return obj !== null && typeof obj === 'object';
};

/**
 * Resolve a conflict between client and server versions
 * @param {Object} clientData - Client version of the data
 * @param {Object} serverData - Server version of the data
 * @param {string} resourceType - Type of resource
 * @param {string} strategy - Conflict resolution strategy
 * @param {Object} options - Resolution options
 * @param {Function} options.customMerge - Custom merge function
 * @param {Function} options.manualResolution - Manual resolution function
 * @returns {Object} Resolved data
 */
export const resolveConflict = async (
  clientData, 
  serverData, 
  resourceType, 
  strategy = null,
  options = {}
) => {
  const { customMerge = null, manualResolution = null } = options;
  
  // Use provided strategy or default for resource type
  const resolutionStrategy = strategy || 
    DEFAULT_STRATEGIES[resourceType] || 
    DEFAULT_STRATEGIES.default;
  
  switch (resolutionStrategy) {
    case ConflictStrategy.CLIENT_WINS:
      return clientData;
      
    case ConflictStrategy.SERVER_WINS:
      return serverData;
      
    case ConflictStrategy.LAST_WRITE_WINS:
      // Compare timestamps to determine which is newer
      const clientTime = new Date(clientData.updatedAt || clientData.timestamp || Date.now()).getTime();
      const serverTime = new Date(serverData.updatedAt || serverData.timestamp || 0).getTime();
      return clientTime >= serverTime ? clientData : serverData;
      
    case ConflictStrategy.MERGE:
      if (customMerge) {
        return customMerge(clientData, serverData);
      }
      return mergeObjects(clientData, serverData);
      
    case ConflictStrategy.MANUAL:
      if (manualResolution) {
        return await manualResolution(clientData, serverData);
      }
      // Default to server wins if no manual resolution function provided
      return serverData;
      
    default:
      return serverData;
  }
};

/**
 * Merge two objects
 * @param {Object} clientObj - Client object
 * @param {Object} serverObj - Server object
 * @returns {Object} Merged object
 */
const mergeObjects = (clientObj, serverObj) => {
  const result = { ...serverObj };
  
  // Merge properties from client object
  for (const [key, value] of Object.entries(clientObj)) {
    // Skip metadata fields
    if (['id', '_id', 'createdAt', 'updatedAt', 'version'].includes(key)) {
      continue;
    }
    
    // If both have the property and they're objects, merge recursively
    if (isObject(value) && isObject(serverObj[key])) {
      result[key] = mergeObjects(value, serverObj[key]);
    } 
    // For arrays, prefer client version if modified
    else if (Array.isArray(value) && Array.isArray(serverObj[key])) {
      // Simple array comparison - if lengths or any elements differ, use client version
      const arraysEqual = value.length === serverObj[key].length && 
        value.every((val, idx) => JSON.stringify(val) === JSON.stringify(serverObj[key][idx]));
      
      result[key] = arraysEqual ? serverObj[key] : value;
    }
    // For primitive values, prefer client version if different
    else if (value !== undefined && value !== serverObj[key]) {
      result[key] = value;
    }
  }
  
  return result;
};

/**
 * Get conflict metadata for tracking
 * @param {Object} clientData - Client version of the data
 * @param {Object} serverData - Server version of the data
 * @param {string} resourceType - Type of resource
 * @param {string} resolution - Resolution strategy used
 * @returns {Object} Conflict metadata
 */
export const getConflictMetadata = (clientData, serverData, resourceType, resolution) => {
  return {
    resourceType,
    resourceId: clientData.id || serverData.id,
    detectedAt: new Date().toISOString(),
    clientVersion: clientData.version || null,
    serverVersion: serverData.version || null,
    clientTimestamp: clientData.updatedAt || null,
    serverTimestamp: serverData.updatedAt || null,
    resolutionStrategy: resolution,
    conflictFields: getConflictingFields(clientData, serverData)
  };
};

/**
 * Get list of fields that conflict between versions
 * @param {Object} clientData - Client version of the data
 * @param {Object} serverData - Server version of the data
 * @returns {Array} List of conflicting field paths
 */
const getConflictingFields = (clientData, serverData) => {
  const conflicts = [];
  
  const findConflicts = (client, server, path = '') => {
    if (!isObject(client) || !isObject(server)) {
      if (client !== server) {
        conflicts.push(path);
      }
      return;
    }
    
    const allKeys = new Set([...Object.keys(client), ...Object.keys(server)]);
    
    for (const key of allKeys) {
      const currentPath = path ? `${path}.${key}` : key;
      
      // Skip metadata fields
      if (['id', '_id', 'createdAt', 'updatedAt', 'version'].includes(key)) {
        continue;
      }
      
      const clientValue = client[key];
      const serverValue = server[key];
      
      if (isObject(clientValue) && isObject(serverValue)) {
        findConflicts(clientValue, serverValue, currentPath);
      } else if (Array.isArray(clientValue) && Array.isArray(serverValue)) {
        if (JSON.stringify(clientValue) !== JSON.stringify(serverValue)) {
          conflicts.push(currentPath);
        }
      } else if (clientValue !== serverValue) {
        conflicts.push(currentPath);
      }
    }
  };
  
  findConflicts(clientData, serverData);
  return conflicts;
};