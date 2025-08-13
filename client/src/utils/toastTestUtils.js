/**
 * Utility functions for testing toast notifications
 */

export const testToastFormats = (showToast) => {
  console.log('Testing toast formats...');
  
  // Test 1: Legacy format (message, type)
  console.log('1. Testing legacy format: showToast(message, type)');
  showToast('Legacy format test - Success', 'success');
  
  setTimeout(() => {
    console.log('2. Testing legacy format: showToast(message, type, duration)');
    showToast('Legacy format with custom duration', 'warning', 3000);
  }, 1000);
  
  // Test 2: Object format
  setTimeout(() => {
    console.log('3. Testing object format: showToast({ message, type, duration })');
    showToast({
      message: 'Object format test with custom settings',
      type: 'info',
      duration: 7000
    });
  }, 2000);
  
  // Test 3: Object format with action
  setTimeout(() => {
    console.log('4. Testing object format with action button');
    showToast({
      message: 'This toast has an action button',
      type: 'error',
      duration: 10000,
      action: {
        label: 'Retry',
        onClick: () => {
          console.log('Action button clicked!');
          showToast('Action executed successfully!', 'success');
        }
      }
    });
  }, 3000);
  
  // Test 4: Multiple toasts at once
  setTimeout(() => {
    console.log('5. Testing multiple toasts');
    showToast('First toast', 'info');
    showToast('Second toast', 'success');
    showToast('Third toast', 'warning');
  }, 4000);
};

export const testToastPositioning = (showToast) => {
  console.log('Testing toast positioning and stacking...');
  
  // Create multiple toasts with different durations to test stacking
  const messages = [
    { message: 'Toast 1 - Should appear first', type: 'info', duration: 8000 },
    { message: 'Toast 2 - Should stack below first', type: 'success', duration: 6000 },
    { message: 'Toast 3 - Should stack below second', type: 'warning', duration: 4000 },
    { message: 'Toast 4 - Should stack below third', type: 'error', duration: 2000 }
  ];
  
  messages.forEach((toast, index) => {
    setTimeout(() => {
      showToast(toast);
    }, index * 500);
  });
};

export const testToastDismissal = (showToast) => {
  console.log('Testing toast dismissal...');
  
  // Test auto-dismiss
  showToast({
    message: 'This toast will auto-dismiss in 2 seconds',
    type: 'info',
    duration: 2000
  });
  
  // Test manual dismiss
  setTimeout(() => {
    showToast({
      message: 'This toast requires manual dismissal (click X)',
      type: 'warning',
      duration: 0 // No auto-dismiss
    });
  }, 1000);
};

export const testContentModerationToasts = (showToast) => {
  console.log('Testing content moderation specific toasts...');
  
  // Simulate content moderation actions
  const moderationActions = [
    { message: 'Content approved successfully', type: 'success' },
    { message: 'Content archived successfully', type: 'warning' },
    { message: 'Content removed successfully', type: 'error' },
    { message: 'Moderation reason is required for archiving', type: 'error' },
    { message: 'Invalid action or content selection', type: 'error' },
    { message: 'Failed to approve content', type: 'error' }
  ];
  
  moderationActions.forEach((toast, index) => {
    setTimeout(() => {
      showToast(toast.message, toast.type);
    }, index * 1000);
  });
};

export default {
  testToastFormats,
  testToastPositioning,
  testToastDismissal,
  testContentModerationToasts
};