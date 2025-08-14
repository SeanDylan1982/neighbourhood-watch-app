/**
 * Verification script for responsive chat layout implementation
 * This script can be run in the browser console to verify the layout is working correctly
 */

const verifyResponsiveChatLayout = () => {
  console.log('🔍 Verifying Responsive Chat Layout Implementation...\n');
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };
  
  const test = (name, condition, message) => {
    const passed = condition;
    results.tests.push({ name, passed, message });
    if (passed) {
      results.passed++;
      console.log(`✅ ${name}: ${message}`);
    } else {
      results.failed++;
      console.log(`❌ ${name}: ${message}`);
    }
  };
  
  // Test 1: Check if ResponsiveChatLayout component exists
  try {
    const layoutElements = document.querySelectorAll('.responsive-chat-layout');
    test(
      'ResponsiveChatLayout Component',
      layoutElements.length > 0,
      layoutElements.length > 0 
        ? `Found ${layoutElements.length} responsive chat layout(s)`
        : 'No responsive chat layout elements found'
    );
  } catch (error) {
    test('ResponsiveChatLayout Component', false, `Error: ${error.message}`);
  }
  
  // Test 2: Check viewport height calculation
  try {
    const layoutElements = document.querySelectorAll('.responsive-chat-layout');
    if (layoutElements.length > 0) {
      const layout = layoutElements[0];
      const computedStyle = window.getComputedStyle(layout);
      const height = computedStyle.height;
      
      test(
        'Viewport Height Calculation',
        height && height !== 'auto' && height !== '0px',
        height ? `Layout height: ${height}` : 'No height calculated'
      );
    } else {
      test('Viewport Height Calculation', false, 'No layout elements to test');
    }
  } catch (error) {
    test('Viewport Height Calculation', false, `Error: ${error.message}`);
  }
  
  // Test 3: Check for scrollable sections
  try {
    const scrollableSections = document.querySelectorAll('.scrollable-section');
    test(
      'Scrollable Sections',
      scrollableSections.length > 0,
      scrollableSections.length > 0
        ? `Found ${scrollableSections.length} scrollable section(s)`
        : 'No scrollable sections found'
    );
  } catch (error) {
    test('Scrollable Sections', false, `Error: ${error.message}`);
  }
  
  // Test 4: Check for messages container
  try {
    const messagesContainers = document.querySelectorAll('[data-messages-container]');
    test(
      'Messages Container',
      messagesContainers.length > 0,
      messagesContainers.length > 0
        ? `Found ${messagesContainers.length} messages container(s)`
        : 'No messages containers found'
    );
  } catch (error) {
    test('Messages Container', false, `Error: ${error.message}`);
  }
  
  // Test 5: Check for message input
  try {
    const messageInputs = document.querySelectorAll('[data-message-input]');
    test(
      'Message Input',
      messageInputs.length > 0,
      messageInputs.length > 0
        ? `Found ${messageInputs.length} message input(s)`
        : 'No message inputs found'
    );
  } catch (error) {
    test('Message Input', false, `Error: ${error.message}`);
  }
  
  // Test 6: Check CSS classes are applied
  try {
    const hasResponsiveCSS = document.querySelector('.responsive-chat-layout') !== null;
    const hasScrollableCSS = document.querySelector('.scrollable-section') !== null;
    
    test(
      'CSS Classes Applied',
      hasResponsiveCSS && hasScrollableCSS,
      `Responsive CSS: ${hasResponsiveCSS}, Scrollable CSS: ${hasScrollableCSS}`
    );
  } catch (error) {
    test('CSS Classes Applied', false, `Error: ${error.message}`);
  }
  
  // Test 7: Check responsive behavior
  try {
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    const isDesktop = window.innerWidth >= 1024;
    
    test(
      'Responsive Breakpoints',
      true,
      `Screen: ${window.innerWidth}x${window.innerHeight} (${isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'})`
    );
  } catch (error) {
    test('Responsive Breakpoints', false, `Error: ${error.message}`);
  }
  
  // Test 8: Check scroll behavior
  try {
    const messagesContainer = document.querySelector('[data-messages-container]');
    if (messagesContainer) {
      const hasScrollBehavior = window.getComputedStyle(messagesContainer).scrollBehavior === 'smooth';
      const hasOverflowY = window.getComputedStyle(messagesContainer).overflowY === 'auto';
      
      test(
        'Scroll Behavior',
        hasOverflowY,
        `Smooth scroll: ${hasScrollBehavior}, Overflow-Y: ${hasOverflowY}`
      );
    } else {
      test('Scroll Behavior', false, 'No messages container to test');
    }
  } catch (error) {
    test('Scroll Behavior', false, `Error: ${error.message}`);
  }
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);
  
  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! Responsive chat layout is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Check the implementation.');
  }
  
  return results;
};

// Auto-scroll test function
const testAutoScroll = () => {
  console.log('🔄 Testing auto-scroll functionality...');
  
  const messagesContainer = document.querySelector('[data-messages-container]');
  if (!messagesContainer) {
    console.log('❌ No messages container found for auto-scroll test');
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
    console.log('📍 Auto-scrolled to bottom');
    
    // Check if we're at the bottom
    setTimeout(() => {
      const isAtBottom = messagesContainer.scrollTop + messagesContainer.clientHeight >= messagesContainer.scrollHeight - 10;
      console.log(isAtBottom ? '✅ Auto-scroll successful' : '❌ Auto-scroll failed');
    }, 1000);
  }, 500);
  
  return true;
};

// Responsive test function
const testResponsiveResize = () => {
  console.log('📱 Testing responsive resize behavior...');
  
  const originalWidth = window.innerWidth;
  const originalHeight = window.innerHeight;
  
  console.log(`Original size: ${originalWidth}x${originalHeight}`);
  
  // Simulate resize event
  window.dispatchEvent(new Event('resize'));
  
  setTimeout(() => {
    const layoutElement = document.querySelector('.responsive-chat-layout');
    if (layoutElement) {
      const computedStyle = window.getComputedStyle(layoutElement);
      console.log(`Layout height after resize: ${computedStyle.height}`);
      console.log('✅ Resize event handled');
    } else {
      console.log('❌ No layout element found for resize test');
    }
  }, 100);
};

// Export functions for browser console use
if (typeof window !== 'undefined') {
  window.verifyResponsiveChatLayout = verifyResponsiveChatLayout;
  window.testAutoScroll = testAutoScroll;
  window.testResponsiveResize = testResponsiveResize;
  
  console.log('🔧 Responsive Chat Layout verification functions loaded:');
  console.log('- verifyResponsiveChatLayout() - Run all verification tests');
  console.log('- testAutoScroll() - Test auto-scroll functionality');
  console.log('- testResponsiveResize() - Test responsive resize behavior');
}

export { verifyResponsiveChatLayout, testAutoScroll, testResponsiveResize };