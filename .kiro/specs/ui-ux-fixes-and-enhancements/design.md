# Design Document

## Overview

This design document outlines the technical approach for implementing comprehensive UI/UX fixes and enhancements across the neighbourhood watch application. The solution focuses on fixing broken functionality, implementing consistent design patterns, and enhancing user experience through improved navigation, notifications, and content display.

## Architecture

### Component Structure

The application follows a React-based architecture with the following key areas that will be enhanced:

```
client/src/
├── components/
│   ├── Common/
│   │   ├── Toast/           # New toast notification system
│   │   ├── Layout/          # Enhanced layout components with logo
│   │   ├── ViewToggle/      # Grid/List view toggle component
│   │   └── ImageModal/      # Image display modal
│   ├── Admin/
│   │   └── ContentModeration.js  # Fix existing errors
│   ├── Search/
│   │   └── SearchResults.js      # Fix back button
│   ├── Contacts/
│   │   └── EmergencyContacts.js  # Fix tab errors
│   ├── Notifications/
│   │   └── NotificationModal.js  # Fix overflow issues
│   ├── Profile/
│   │   └── ProfileTabs.js        # New tabbed interface
│   └── Chat/
│       ├── MessageReactions.js   # Enhanced reactions
│       ├── MessageReply.js       # Reply functionality
│       └── MemberTooltip.js      # Fixed member count
├── pages/
│   ├── Settings/Settings.js      # Enhanced button behavior
│   ├── Reports/Reports.js        # Grid view and layout options
│   ├── NoticeBoard/NoticeBoard.js # Layout options and image fixes
│   └── Chat/Chat.js              # Enhanced messaging
└── hooks/
    ├── useToast.js               # Toast notification hook
    ├── useViewPreference.js      # Layout preference hook
    └── useImageModal.js          # Image modal hook
```

## Components and Interfaces

### 1. Toast Notification System

**Component: `ToastProvider` and `useToast` hook**

```javascript
// ToastContext structure
interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Hook interface
const useToast = () => ({
  showToast: (toast: Omit<Toast, 'id'>) => void,
  hideToast: (id: string) => void,
  clearAll: () => void
});
```

**Design Decisions:**
- Context-based provider for global toast management
- Auto-dismiss with configurable duration
- Stack multiple toasts with proper positioning
- Replace all browser alerts throughout the application

### 2. Layout Enhancement with Logo

**Component: `Header` enhancement**

```javascript
interface HeaderProps {
  showLogo?: boolean;
  logoSrc?: string;
  title: string;
  onHomeClick: () => void;
}
```

**Design Decisions:**
- Logo positioned next to site title
- Both logo and title clickable for home navigation
- Responsive design for different screen sizes
- Consistent across all pages

### 3. View Toggle Component

**Component: `ViewToggle`**

```javascript
interface ViewToggleProps {
  currentView: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
  storageKey: string; // For persisting preference
}
```

**Design Decisions:**
- Reusable component for Reports and NoticeBoard sections
- Persistent user preference using localStorage
- Consistent styling with application theme
- Clear visual indicators for current view

### 4. Image Enhancement System

**Components: `ImageThumbnail` and `ImageModal`**

```javascript
interface ImageThumbnailProps {
  src: string;
  alt: string;
  maxWidth?: number;
  maxHeight?: number;
  onClick: () => void;
}

interface ImageModalProps {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}
```

**Design Decisions:**
- Thumbnail generation with proper aspect ratio
- Modal overlay for full-size image viewing
- Fallback handling for broken images
- Prevent card layout distortion

### 5. Profile Tabs System

**Component: `ProfileTabs`**

```javascript
interface ProfileTabsProps {
  userId: string;
  userDetails: UserProfile;
}

interface TabContent {
  about: UserProfile;
  posts: Post[];
  likes: LikedContent[];
  friends: Friend[];
}
```

**Design Decisions:**
- Tab-based navigation for profile sections
- Lazy loading of tab content
- Consistent data fetching patterns
- Proper loading and error states

### 6. Enhanced Message System

**Components: `MessageReactions` and `MessageReply`**

```javascript
interface MessageReactionsProps {
  messageId: string;
  reactions: Reaction[];
  onReact: (emoji: string) => void;
}

interface MessageReplyProps {
  originalMessage: Message;
  onReply: (replyContent: string) => void;
}
```

**Design Decisions:**
- Proper reaction targeting to specific messages
- Quote excerpt generation for replies
- Visual indication of reply relationships
- Real-time reaction updates

## Data Models

### Toast Notification Model

```javascript
interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration: number;
  timestamp: Date;
  dismissed: boolean;
}
```

### User Preference Model

```javascript
interface UserPreferences {
  userId: string;
  viewPreferences: {
    reports: 'grid' | 'list';
    noticeBoard: 'grid' | 'list';
  };
  notificationSettings: {
    toastDuration: number;
    enableSounds: boolean;
  };
}
```

### Enhanced Message Model

```javascript
interface Message {
  id: string;
  content: string;
  authorId: string;
  timestamp: Date;
  reactions: Reaction[];
  replyTo?: {
    messageId: string;
    excerpt: string;
    authorName: string;
  };
  attachments?: Attachment[];
}

interface Reaction {
  emoji: string;
  userId: string;
  timestamp: Date;
}
```

### Profile Tab Data Model

```javascript
interface ProfileTabData {
  about: {
    personalDetails: UserProfile;
    joinDate: Date;
    lastActive: Date;
  };
  posts: {
    notices: Notice[];
    reports: Report[];
    comments: Comment[];
    messages: Message[];
    totalCount: number;
  };
  likes: {
    likedPosts: LikedContent[];
    totalCount: number;
  };
  friends: {
    friendsList: Friend[];
    totalCount: number;
  };
}
```

## Error Handling

### 1. Component Error Boundaries

- Implement error boundaries for each major section
- Graceful degradation when components fail
- User-friendly error messages via toast notifications

### 2. API Error Handling

```javascript
const handleApiError = (error, context) => {
  const { showToast } = useToast();
  
  switch (error.status) {
    case 404:
      showToast({
        type: 'error',
        message: `${context} not found`
      });
      break;
    case 500:
      showToast({
        type: 'error',
        message: 'Server error. Please try again later.'
      });
      break;
    default:
      showToast({
        type: 'error',
        message: 'An unexpected error occurred'
      });
  }
};
```

### 3. Image Loading Error Handling

- Fallback images for broken uploads
- Retry mechanism for failed loads
- User feedback for upload failures

### 4. Navigation Error Handling

- Fallback navigation for broken back buttons
- Default home navigation when history is empty
- Route validation and error pages

## Testing Strategy

### 1. Unit Testing

**Components to Test:**
- Toast notification system
- View toggle functionality
- Image modal behavior
- Profile tabs navigation
- Message reactions and replies

**Test Coverage:**
- Component rendering
- User interactions
- State management
- Error scenarios
- Accessibility compliance

### 2. Integration Testing

**Areas to Test:**
- Toast notifications across different pages
- View preference persistence
- Image upload and display workflow
- Profile tab data loading
- Message interaction workflows

### 3. End-to-End Testing

**User Flows to Test:**
- Complete notification workflow
- Image upload and viewing process
- Profile navigation and data display
- Message interaction scenarios
- Settings modification workflow

### 4. Accessibility Testing

**Requirements:**
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance
- Focus management
- ARIA labels and descriptions

## Implementation Approach

### Phase 1: Core Infrastructure
1. Toast notification system implementation
2. Enhanced layout with logo
3. View toggle component creation
4. Image modal system

### Phase 2: Content Display Enhancements
1. Reports section grid view and layout options
2. Notice board layout options and image fixes
3. Pin icon implementation
4. Notification modal overflow fixes

### Phase 3: Interactive Features
1. Message reactions and reply functionality
2. Profile tabs implementation
3. Settings page button behavior
4. Chat window spacing improvements

### Phase 4: Bug Fixes and Polish
1. Emergency contacts tab error resolution
2. Admin content moderation fixes
3. Search and notice board back button fixes
4. Member tooltip functionality

### Phase 5: Testing and Optimization
1. Comprehensive testing implementation
2. Performance optimization
3. Accessibility compliance verification
4. Cross-browser compatibility testing

## Technical Considerations

### Performance Optimization
- Lazy loading for profile tab content
- Image optimization and caching
- Efficient re-rendering for view toggles
- Debounced search and filter operations

### Responsive Design
- Mobile-first approach for all components
- Flexible grid layouts
- Touch-friendly interaction areas
- Proper spacing for different screen sizes

### Browser Compatibility
- Modern browser support (ES6+)
- Polyfills for older browser features
- Graceful degradation for unsupported features
- Cross-browser testing strategy

### Security Considerations
- Input sanitization for user content
- XSS prevention in dynamic content
- Secure image upload handling
- Proper authentication checks for admin features