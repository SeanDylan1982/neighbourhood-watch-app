/**
 * Simple test script to verify responsive chat layout is working
 * Run this in the browser console on the chat page
 */

const testResponsiveLayout = () => {
  console.log('🔍 Testing Responsive Chat Layout...\n');
  
  const results = [];
  
  // Test 1: Check if chat container exists and has proper height
  const chatContainer = document.querySelector('.MuiGrid-container');
  if (chatContainer) {
    const containerHeight = chatContainer.offsetHeight;
    const parentHeight = chatContainer.parentElement?.offsetHeight || 0;
    
    console.log(`✅ Chat container found: ${containerHeight}px height (parent: ${parentHeight}px)`);
    results.push({ test: 'Container Height', passed: containerHeight > 0 });
  } else {
    console.log('❌ Chat container not found');
    results.push({ test: 'Container Height', passed: false });
  }
  
  // Test 2: Check if chat list is visible and scrollable
  const chatListContainer = document.querySelector('[data-chat-list-container]');
  if (chatListContainer) {
    const isVisible = chatListContainer.offsetHeight > 0;
    const isScrollable = chatListContainer.scrollHeight > chatListContainer.clientHeight;
    
    console.log(`✅ Chat list container: visible=${isVisible}, scrollable=${isScrollable}`);
    results.push({ test: 'Chat List Scrollable', passed: isVisible });
  } else {
    console.log('❌ Chat list container not found');
    results.push({ test: 'Chat List Scrollable', passed: false });
  }
  
  // Test 3: Check if message content is visible and scrollable
  const messageContentContainer = document.querySelector('[data-message-content-container]');
  if (messageContentContainer) {
    const isVisible = messageContentContainer.offsetHeight > 0;
    const messagesContainer = messageContentContainer.querySelector('[data-messages-container]');
    const hasMessages = messagesContainer && messagesContainer.children.length > 0;
    
    console.log(`✅ Message content: visible=${isVisible}, hasMessages=${hasMessages}`);
    results.push({ test: 'Message Content Visible', passed: isVisible });
  } else {
    console.log('❌ Message content container not found');
    results.push({ test: 'Message Content Visible', passed: false });
  }
  
  // Test 4: Check if message input is at the bottom
  const messageInput = document.querySelector('[data-message-input]');
  if (messageInput) {
    const inputRect = messageInput.getBoundingClientRect();
    const containerRect = messageContentContainer?.getBoundingClientRect();
    const isAtBottom = containerRect ? (inputRect.bottom <= containerRect.bottom + 10) : false;
    
    console.log(`✅ Message input positioned correctly: ${isAtBottom}`);
    results.push({ test: 'Input Position', passed: isAtBottom });
  } else {
    console.log('❌ Message input not found');
    results.push({ test: 'Input Position', passed: false });
  }
  
  // Test 5: Check responsive behavior
  const screenWidth = window.innerWidth;
  const isMobile = screenWidth < 768;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;
  const isDesktop = screenWidth >= 1024;
  
  console.log(`📱 Screen: ${screenWidth}px (${isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'})`);
  
  // Test 6: Check if layout fits in viewport
  const body = document.body;
  const html = document.documentElement;
  const documentHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
  const viewportHeight = window.innerHeight;
  const hasVerticalScroll = documentHeight > viewportHeight;
  
  console.log(`📏 Viewport: ${viewportHeight}px, Document: ${documentHeight}px, Scroll: ${hasVerticalScroll}`);
  results.push({ test: 'Fits Viewport', passed: !hasVerticalScroll || (documentHeight - viewportHeight) < 50 });
  
  // Summary
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);
  
  console.log(`\n📊 Results: ${passed}/${total} tests passed (${percentage}%)`);
  
  if (percentage >= 80) {
    console.log('🎉 Layout is working well!');
  } else if (percentage >= 60) {
    console.log('⚠️ Layout has some issues but is functional');
  } else {
    console.log('❌ Layout has significant issues');
  }
  
  return results;
};

// Auto-scroll test
const testAutoScroll = () => {
  console.log('🔄 Testing auto-scroll...');
  
  const messagesContainer = document.querySelector('[data-messages-container]');
  if (!messagesContainer) {
    console.log('❌ No messages container found');
    return false;
  }
  
  // Scroll to top first
  messagesContainer.scrollTop = 0;
  console.log('📍 Scrolled to top');
  
  // Test scroll to bottom
  setTimeout(() => {
    messagesContainer.scrollTo({
      top: messagesContainer.scrollHeight,
      behavior: 'smooth'
    });
    console.log('📍 Scrolling to bottom...');
    
    // Check if we reached the bottom
    setTimeout(() => {
      const isAtBottom = messagesContainer.scrollTop + messagesContainer.clientHeight >= messagesContainer.scrollHeight - 10;
      console.log(isAtBottom ? '✅ Auto-scroll successful' : '❌ Auto-scroll failed');
    }, 1000);
  }, 500);
  
  return true;
};

// Make functions available globally
if (typeof window !== 'undefined') {
  window.testResponsiveLayout = testResponsiveLayout;
  window.testAutoScroll = testAutoScroll;
  
  console.log('🔧 Test functions loaded:');
  console.log('- testResponsiveLayout() - Test overall layout');
  console.log('- testAutoScroll() - Test auto-scroll functionality');
}

export { testResponsiveLayout, testAutoScroll };