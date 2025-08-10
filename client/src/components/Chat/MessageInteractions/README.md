# Message Interactions Components

This directory contains components for handling message interactions in the chat system, including reactions, replies, and context menus.

## Components

### ReactionPicker

A component that displays a picker with common emoji reactions for messages.

#### Features
- 6 common reactions: 👍😂😮❤️😢😡
- Shows existing reaction counts
- Highlights reactions from current user
- Proper positioning and responsive behavior
- Keyboard navigation support
- Click-outside-to-close functionality

#### Usage

```jsx
import ReactionPicker from './ReactionPicker';

const MyComponent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleReact = (messageId, reactionType) => {
    // Handle reaction logic
    console.log(`Reacting to ${messageId} with ${reactionType}`);
  };

  return (
    <ReactionPicker
      messageId="message-123"
      existingReactions={[
        { type: 'thumbs_up', users: ['user1', 'user2'], count: 2 },
        { type: 'heart', users: ['user3'], count: 1 }
      ]}
      currentUserId="user1"
      onReact={handleReact}
      onClose={() => setIsVisible(false)}
      position={position}
      isVisible={isVisible}
    />
  );
};
```

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `messageId` | string | Yes | ID of the message being reacted to |
| `existingReactions` | array | No | Array of existing reactions |
| `currentUserId` | string | Yes | ID of the current user |
| `onReact` | function | Yes | Callback when a reaction is selected |
| `onClose` | function | Yes | Callback to close the picker |
| `position` | object | Yes | Position object with x and y coordinates |
| `isVisible` | boolean | No | Whether the picker is visible |

### ReplyPreview

A component that displays a quoted message preview for replies.

#### Features
- Quoted message excerpt with truncation
- Visual connection line to original message
- Sender name display
- Media type indicators for non-text messages
- Close button to cancel reply
- Responsive design for mobile and desktop

#### Usage

```jsx
import ReplyPreview from './ReplyPreview';

const MyComponent = () => {
  const replyTo = {
    id: 'message-123',
    content: 'This is the original message',
    senderName: 'John Doe',
    type: 'text'
  };

  return (
    <ReplyPreview
      replyTo={replyTo}
      onClose={() => console.log('Reply cancelled')}
      maxLength={100}
      showCloseButton={true}
      variant="default"
      position="top"
    />
  );
};
```

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `replyTo` | object | Yes | Original message data |
| `onClose` | function | Yes | Callback to close/cancel reply |
| `maxLength` | number | No | Maximum excerpt length (default: 100) |
| `showCloseButton` | boolean | No | Show close button (default: true) |
| `className` | string | No | Additional CSS classes |
| `variant` | string | No | Style variant: 'default', 'compact', 'inline' |
| `position` | string | No | Position: 'top', 'bottom', 'inline' |

### useReply Hook

A custom hook for managing reply state and functionality.

#### Features
- Reply state management
- Reply preview generation
- Auto-focus on input when replying
- Reply cancellation
- Integration with message input

#### Usage

```jsx
import useReply from '../../../hooks/useReply';

const MyComponent = () => {
  const {
    replyTo,
    isReplying,
    startReply,
    cancelReply,
    clearReply,
    getReplyData,
    getReplyContext,
    isValidReply,
    inputRef
  } = useReply();

  const handleReply = (message) => {
    startReply(message);
  };

  return (
    <div>
      {isReplying && (
        <ReplyPreview
          replyTo={replyTo}
          onClose={cancelReply}
        />
      )}
      <input ref={inputRef} />
    </div>
  );
};
```

### MessageInputWithReply

An enhanced message input component that integrates reply functionality.

#### Features
- Reply preview integration
- Message composition with reply context
- Keyboard shortcuts (Enter to send, Escape to cancel reply)
- Auto-focus and auto-resize
- Attachment and emoji buttons
- Loading states and error handling

#### Usage

```jsx
import MessageInputWithReply from './MessageInputWithReply';

const ChatWindow = () => {
  const handleSendMessage = async (messageData) => {
    console.log('Sending:', messageData);
    // Handle message sending
  };

  return (
    <MessageInputWithReply
      onSendMessage={handleSendMessage}
      placeholder="Type a message..."
      showAttachButton={true}
      showEmojiButton={true}
      maxLength={1000}
      onAttachClick={() => console.log('Attach clicked')}
      onEmojiClick={() => console.log('Emoji clicked')}
      onTypingStart={() => console.log('Started typing')}
      onTypingStop={() => console.log('Stopped typing')}
    />
  );
};
```

### MessageReactions

A component that displays existing reactions on a message with count badges and user tooltips.

#### Features
- Reaction display with emoji and count
- User tooltips showing who reacted
- Click to add/remove reactions
- Highlighted reactions for current user
- Responsive design for mobile and desktop
- Animation for reaction changes
- Accessibility support

#### Usage

```jsx
import MessageReactions from './MessageReactions';

const MyComponent = () => {
  const reactions = [
    { type: 'thumbs_up', users: ['user-1', 'user-2'], count: 2 },
    { type: 'heart', users: ['user-3'], count: 1 }
  ];

  const handleReactionClick = (messageId, reactionType) => {
    console.log('Reaction clicked:', messageId, reactionType);
  };

  return (
    <MessageReactions
      messageId="message-123"
      reactions={reactions}
      currentUserId="user-1"
      onReactionClick={handleReactionClick}
      showUserTooltips={true}
      maxVisibleReactions={6}
      size="medium"
      variant="default"
    />
  );
};
```

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `messageId` | string | Yes | ID of the message |
| `reactions` | array | Yes | Array of reaction objects |
| `currentUserId` | string | Yes | ID of the current user |
| `onReactionClick` | function | No | Callback when reaction is clicked |
| `onReactionHover` | function | No | Callback when reaction is hovered |
| `maxVisibleReactions` | number | No | Maximum reactions to show (default: 6) |
| `showUserTooltips` | boolean | No | Show user tooltips (default: true) |
| `animateChanges` | boolean | No | Animate reaction changes (default: true) |
| `className` | string | No | Additional CSS classes |
| `size` | string | No | Size variant: 'small', 'medium', 'large' |
| `variant` | string | No | Style variant: 'default', 'compact', 'minimal' |
| `allowToggle` | boolean | No | Allow reaction toggling (default: true) |
| `disabled` | boolean | No | Disable all interactions (default: false) |

### useMessageReactions Hook

A custom hook for managing message reactions state and functionality.

#### Features
- Reaction state management
- Optimistic updates for immediate feedback
- Real-time reaction synchronization
- Reaction validation and error handling
- User reaction tracking
- Reaction analytics and metrics

#### Usage

```jsx
import useMessageReactions from '../../../hooks/useMessageReactions';

const MyComponent = () => {
  const {
    reactions,
    isLoading,
    error,
    toggleReaction,
    hasUserReacted,
    getReactionCount,
    getTotalReactionCount,
    getReactionStats
  } = useMessageReactions('message-123', initialReactions, 'user-1');

  const handleToggleReaction = async (messageId, reactionType) => {
    // API call to toggle reaction
    const response = await fetch(`/api/messages/${messageId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ type: reactionType })
    });
    return response.json();
  };

  return (
    <div>
      <MessageReactions
        messageId="message-123"
        reactions={reactions}
        currentUserId="user-1"
        onReactionClick={(messageId, reactionType) => 
          toggleReaction(reactionType, handleToggleReaction)
        }
        disabled={isLoading}
      />
      {error && <div>Error: {error}</div>}
    </div>
  );
};
```

### useReactionPicker Hook

A custom hook for managing reaction picker state and positioning.

#### Features
- Automatic positioning based on trigger element
- Overflow prevention (keeps picker on screen)
- Window resize and scroll handling
- Toggle functionality

#### Usage

```jsx
import useReactionPicker from '../../../hooks/useReactionPicker';

const MyComponent = () => {
  const {
    isVisible,
    position,
    targetMessageId,
    showReactionPicker,
    hideReactionPicker,
    toggleReactionPicker
  } = useReactionPicker();

  const handleShowPicker = (messageId, triggerElement) => {
    showReactionPicker(messageId, triggerElement);
  };

  return (
    <div>
      <button 
        ref={buttonRef}
        onClick={(e) => handleShowPicker('message-123', e.currentTarget)}
      >
        React
      </button>
      
      <ReactionPicker
        messageId={targetMessageId}
        isVisible={isVisible}
        position={position}
        onClose={hideReactionPicker}
        // ... other props
      />
    </div>
  );
};
```

### MessageWithReactions

An example component showing how to integrate ReactionPicker with MessageMenu and message bubbles.

#### Features
- Complete message bubble with reactions display
- Context menu integration (right-click/long-press)
- Reaction picker integration
- WhatsApp-style design
- Mobile and desktop support

#### Usage

```jsx
import MessageWithReactions from './MessageWithReactions';

const ChatWindow = () => {
  const message = {
    id: 'message-123',
    content: 'Hello world!',
    senderId: 'user-2',
    timestamp: new Date(),
    type: 'text',
    status: 'read',
    reactions: [
      { type: 'thumbs_up', users: ['user-1'], count: 1 }
    ]
  };

  return (
    <MessageWithReactions
      message={message}
      chatType="group"
      currentUserId="user-1"
      onReact={(messageId, reactionType) => {
        // Handle reaction
      }}
      onReply={(messageId) => {
        // Handle reply
      }}
      // ... other handlers
    />
  );
};
```

## Styling

### CSS Classes

#### ReactionPicker
- `.reaction-picker` - Main container
- `.reaction-picker-content` - Content wrapper
- `.reaction-button` - Individual reaction buttons
- `.reaction-emoji` - Emoji display
- `.reaction-count` - Count badge
- `.reaction-picker-arrow` - Positioning arrow

#### MessageWithReactions
- `.message-with-reactions` - Main container
- `.message-bubble` - Message bubble
- `.own-message` / `.other-message` - Message alignment
- `.message-reactions` - Reactions container
- `.reaction-badge` - Individual reaction display
- `.user-reacted` - Highlighted user reactions

### Theming

Both components support:
- Dark mode via `prefers-color-scheme: dark`
- High contrast mode via `prefers-contrast: high`
- Reduced motion via `prefers-reduced-motion: reduce`
- Mobile optimizations via media queries

## Accessibility

### Keyboard Navigation
- Escape key closes reaction picker
- Tab navigation between reaction buttons
- Proper focus management

### Screen Readers
- ARIA labels for all interactive elements
- Descriptive button titles
- Proper semantic markup

### Touch Support
- Long-press gesture support for mobile
- Touch-friendly button sizes
- Proper touch event handling

## Testing

### Unit Tests
- Component rendering tests
- Interaction tests (click, keyboard, touch)
- Props validation tests
- Edge case handling

### Integration Tests
- Menu and picker integration
- Hook functionality tests
- Event handling tests

### Accessibility Tests
- Keyboard navigation tests
- Screen reader compatibility
- Focus management tests

## Performance Considerations

### Optimizations
- Event listener cleanup on unmount
- Debounced positioning updates
- Minimal re-renders with proper memoization
- Efficient DOM queries

### Best Practices
- Use React.memo for pure components
- Implement proper cleanup in useEffect
- Avoid unnecessary state updates
- Use CSS transforms for animations

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+
- Mobile browsers with touch support

## Common Patterns

### Basic Reaction Picker

```jsx
const BasicReactionPicker = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef(null);

  const showPicker = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        x: rect.left + rect.width / 2,
        y: rect.top
      });
      setIsVisible(true);
    }
  };

  return (
    <>
      <button ref={buttonRef} onClick={showPicker}>
        React
      </button>
      <ReactionPicker
        messageId="message-123"
        isVisible={isVisible}
        position={position}
        onClose={() => setIsVisible(false)}
        onReact={(messageId, reaction) => {
          console.log('Reacted:', messageId, reaction);
        }}
        currentUserId="user-1"
      />
    </>
  );
};
```

### With Custom Hook

```jsx
const WithCustomHook = () => {
  const {
    isVisible,
    position,
    targetMessageId,
    showReactionPicker,
    hideReactionPicker
  } = useReactionPicker();

  return (
    <>
      <button 
        onClick={(e) => showReactionPicker('message-123', e.currentTarget)}
      >
        React
      </button>
      <ReactionPicker
        messageId={targetMessageId}
        isVisible={isVisible}
        position={position}
        onClose={hideReactionPicker}
        onReact={(messageId, reaction) => {
          console.log('Reacted:', messageId, reaction);
        }}
        currentUserId="user-1"
      />
    </>
  );
};
```

## Troubleshooting

### Common Issues

1. **Picker not positioning correctly**
   - Ensure trigger element has proper getBoundingClientRect
   - Check for CSS transforms affecting positioning
   - Verify scroll offset calculations

2. **Click outside not working**
   - Check event listener attachment
   - Verify ref is properly set
   - Ensure proper cleanup on unmount

3. **Reactions not updating**
   - Verify onReact callback is called
   - Check existingReactions prop format
   - Ensure proper state management

4. **Mobile gestures not working**
   - Check touch event listeners
   - Verify long-press timing
   - Test on actual devices

### Debug Tips

1. Use React DevTools to inspect component state
2. Check console for event listener errors
3. Verify CSS positioning with browser dev tools
4. Test with different screen sizes and orientations