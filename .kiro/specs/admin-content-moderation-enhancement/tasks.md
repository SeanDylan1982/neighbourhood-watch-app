# Implementation Plan

- [x] 1. Create backend API endpoints for flagged content

  - Implement `GET /api/admin/content/flagged` endpoint to query database for only reported/flagged content
  - Include joins to fetch content, author details, and all associated reports
  - Return structured response with report counts and reasons
  - _Requirements: 1.1, 1.2, 3.1, 3.2, 3.3, 3.4_

- [x] 2. Implement moderation action endpoints

  - Create `POST /api/admin/content/:id/approve` endpoint to clear reports and mark content as reviewed
  - Create `POST /api/admin/content/:id/archive` endpoint to archive content with required reason
  - Create `POST /api/admin/content/:id/remove` endpoint to remove content with required reason
  - Add audit logging for all moderation actions
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 3. Create FlaggedContentService class

  - Implement `getFlaggedContent()` method with optimized database queries
  - Implement `approveContent()`, `archiveContent()`, and `removeContent()` methods
  - Add `logModerationAction()` method for audit trail
  - Include proper error handling and validation
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 4. Build ContentModerationTab component

  - Create main component following user management interface patterns
  - Implement list view to display only flagged content items
  - Add empty state message when no reported content exists
  - Include real-time updates using existing socket infrastructure
  - _Requirements: 1.1, 1.2, 4.1, 4.2, 5.1, 5.2_

- [x] 5. Create ContentModerationItem component

  - Display individual content items with author information
  - Show report count, reasons, and timestamps for each item
  - Highlight items with multiple reports
  - Display reporter information (when not anonymous)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 6. Implement moderation action buttons

  - Add "Approve", "Archive", and "Remove" buttons with consistent styling
  - Implement confirmation dialogs for archive and remove actions
  - Add reason input fields for archive and remove actions
  - Handle immediate UI updates after actions
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 4.3, 5.3_

- [ ] 7. Add real-time update functionality

  - Implement socket listeners for new content reports
  - Update flagged content count in real-time
  - Refresh content list automatically when new reports arrive
  - Remove items from list when approved or removed
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 8. Integrate with existing admin dashboard

  - Add content moderation tab to admin navigation
  - Ensure consistent styling with user management interface
  - Implement proper routing and access control
  - Add loading states and error handling
  - _Requirements: 4.1, 4.2, 4.4_

- [ ] 9. Write comprehensive tests

  - Create unit tests for FlaggedContentService methods
  - Add API endpoint tests for all moderation actions
  - Write component tests for ContentModerationTab and ContentModerationItem
  - Implement integration tests for complete moderation workflow
  - _Requirements: All requirements validation_

- [ ] 10. Add error handling and validation
  - Implement proper error responses for all API endpoints
  - Add client-side validation for moderation actions
  - Include graceful error handling in UI components
  - Add retry mechanisms for failed operations
  - _Requirements: 2.2, 2.3, 2.4, 2.5_
