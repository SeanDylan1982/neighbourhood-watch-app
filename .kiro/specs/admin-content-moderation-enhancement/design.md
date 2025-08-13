# Design Document

## Overview

This design document outlines the implementation approach for enhancing the admin dashboard's content moderation functionality. The enhancement focuses on creating a streamlined interface that displays only reported/flagged content items, providing efficient moderation tools similar to the existing user management interface.

## Architecture

### Database Layer
- Leverage existing content and reports tables
- Query optimization for filtering only reported/flagged content
- Efficient joins between content, reports, and user tables

### API Layer
- New endpoint: `GET /api/admin/content/flagged` - Returns only reported content with report details
- Enhanced endpoints for moderation actions:
  - `POST /api/admin/content/:id/approve` - Clear reports and mark as reviewed
  - `POST /api/admin/content/:id/archive` - Archive content with reason
  - `POST /api/admin/content/:id/remove` - Remove content with reason

### Frontend Layer
- Reuse existing admin dashboard layout and components
- Create new ContentModerationTab component following user management patterns
- Implement real-time updates using existing socket infrastructure

## Components and Interfaces

### Backend Components

#### FlaggedContentService
```javascript
class FlaggedContentService {
  async getFlaggedContent()
  async approveContent(contentId, adminId)
  async archiveContent(contentId, adminId, reason)
  async removeContent(contentId, adminId, reason)
  async logModerationAction(contentId, adminId, action, reason)
}
```

#### Database Queries
- Query to fetch only content with active reports
- Include report count, reasons, and reporter information
- Join with user data for content authors

### Frontend Components

#### ContentModerationTab
- List view similar to UserManagement component
- Display reported content with report details
- Action buttons for approve/archive/remove
- Real-time updates via socket connection

#### ContentModerationItem
- Individual content item display
- Report information and count
- Moderation action buttons
- Status indicators

## Data Models

### FlaggedContent Response
```javascript
{
  id: string,
  content: string,
  author: {
    id: string,
    username: string,
    email: string
  },
  reports: [
    {
      id: string,
      reason: string,
      reportedBy: string,
      timestamp: Date,
      isAnonymous: boolean
    }
  ],
  reportCount: number,
  createdAt: Date,
  status: 'active' | 'archived' | 'removed'
}
```

### ModerationAction Request
```javascript
{
  contentId: string,
  action: 'approve' | 'archive' | 'remove',
  reason?: string,
  adminId: string
}
```

## Error Handling

### API Error Responses
- 404: Content not found or no longer flagged
- 403: Insufficient permissions
- 400: Invalid moderation action or missing required fields
- 500: Database or server errors

### Frontend Error Handling
- Display user-friendly error messages
- Graceful degradation when real-time updates fail
- Retry mechanisms for failed moderation actions

## Testing Strategy

### Unit Tests
- FlaggedContentService methods
- Database query functions
- Component rendering and interactions

### Integration Tests
- API endpoint functionality
- Database operations with real data
- Socket-based real-time updates

### End-to-End Tests
- Complete moderation workflow
- Multi-admin concurrent actions
- Real-time update propagation

## Implementation Notes

### Consistency with User Management
- Reuse existing UI components and styling
- Follow same layout patterns and interaction flows
- Maintain consistent color coding and status indicators

### Performance Considerations
- Implement pagination for large numbers of flagged items
- Optimize database queries with proper indexing
- Cache frequently accessed data

### Real-time Updates
- Use existing socket infrastructure
- Emit events on new reports and moderation actions
- Update UI immediately on local actions, sync with server

### Security
- Validate admin permissions for all moderation actions
- Log all moderation activities for audit trail
- Sanitize content display to prevent XSS