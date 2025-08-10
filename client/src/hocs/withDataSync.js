import React from 'react';
import useDataSync from '../hooks/useDataSync';
import DataSyncIndicator from '../components/Common/DataSyncIndicator';
import OfflineOperationManager from '../components/Common/OfflineOperationManager';

/**
 * Higher-order component that provides data synchronization capabilities
 * to a component, including optimistic updates, offline operation queueing,
 * and conflict resolution
 * 
 * @param {React.Component} WrappedComponent - Component to wrap
 * @param {Object} options - Configuration options
 * @param {string} options.resourceType - Type of resource to sync
 * @param {string} options.endpoint - API endpoint for the resource
 * @param {Object} options.conflictOptions - Conflict resolution options
 * @param {boolean} options.showSyncIndicator - Whether to show sync indicator
 * @param {boolean} options.showOfflineManager - Whether to show offline manager
 * @returns {React.Component} Wrapped component with data sync capabilities
 */
const withDataSync = (WrappedComponent, options = {}) => {
  const {
    resourceType,
    endpoint,
    conflictOptions = {},
    showSyncIndicator = true,
    showOfflineManager = true
  } = options;
  
  const WithDataSync = (props) => {
    const dataSync = useDataSync({
      resourceType,
      endpoint,
      conflictOptions,
      onDataChange: props.onDataChange,
      onError: props.onError,
      filter: props.filter
    });
    
    const {
      data,
      loading,
      error,
      syncStatus,
      pendingOperations,
      conflicts,
      fetchData,
      createItem,
      updateItem,
      deleteItem,
      processQueue
    } = dataSync;
    
    return (
      <>
        <WrappedComponent
          {...props}
          data={data}
          loading={loading}
          error={error}
          fetchData={fetchData}
          createItem={createItem}
          updateItem={updateItem}
          deleteItem={deleteItem}
          syncStatus={syncStatus}
          pendingOperations={pendingOperations}
          conflicts={conflicts}
        />
        
        {showSyncIndicator && (
          <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}>
            <DataSyncIndicator
              syncStatus={syncStatus}
              pendingOperations={pendingOperations}
              conflicts={conflicts}
              onProcessQueue={processQueue}
            />
          </div>
        )}
        
        {showOfflineManager && (
          <OfflineOperationManager onProcessQueue={processQueue} />
        )}
      </>
    );
  };
  
  WithDataSync.displayName = `WithDataSync(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  
  return WithDataSync;
};

export default withDataSync;