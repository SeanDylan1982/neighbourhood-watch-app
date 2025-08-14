Objective

You are an AI coding agent, an expert backend engineer specializing in chat systems, thoroughly examine the current implementation of the chat/messaging system and ensure that all messaging-related features are fully implemented, reliable, and production-ready. The system must function without requiring manual page refreshes and must maintain real-time accuracy across all devices and user sessions.

Scope of Examination

Current Implementation Review

Examine backend services, database schema, and API endpoints related to chat.

Examine frontend message rendering, socket event handling, and UI/UX elements.

Map existing functions to intended features.

Identify any partially implemented, missing, or broken elements.

Features to Verify and Implement
The following features are mandatory and must be verified for correct implementation:

Core Messaging

Message Sending/Receiving: Messages must be transmitted instantly via sockets (WebSocket/Socket.IO or equivalent).

Real-Time Updates: Message threads refresh automatically without page reload.

Delivery Reliability: Messages should not be lost due to network fluctuations (retry/acknowledgement mechanism required).

Notifications & Indicators

Notifications: Recipients receive notifications for new messages (both private and group).

Message Status Indicators: Show sent, delivered/received, and read states with accurate synchronization.

Typing Status: Show when other users are typing in private and group chats.

Message Actions

Reply & Forward: Users can reply inline to a message or forward it to another chat.

Reactions: Emoji reactions supported on messages; reaction counts and users displayed.

Message Details: Right-click (desktop) or long-press (mobile) reveals metadata (timestamp, sender, delivery/read status).

Group & User Details

Group Info Tab/Section: Displays accurate group details including current members, roles, and avatars.

Friend/Contact Status: Shows online/offline/away status correctly.

User Avatars: Display correct profile images everywhere (chat list, message bubbles, group members).

Attachments & Media

Attachment Uploading: Support image, video, file, and voice uploads.

Media Display: Attachments display inline within chat messages.

Media Section: All media/attachments are listed in the chat details panel for easy browsing.

UI/UX Compliance

Message Alignment: Outgoing messages (sent by the user) appear on the right, incoming messages on the left.

Input & Action Elements: Text input area, emoji picker, attachment button, and send button must always be visible and never obstructed (including when a floating action button is present).

Accessibility: All buttons and inputs must be keyboard and screen-reader accessible.

Required Testing & Validation

The AI coding agent must design and implement comprehensive testing to ensure that each feature works correctly.

Unit Tests

For backend APIs (sendMessage, getMessages, markAsRead, uploadAttachment).

For socket events (message:new, message:read, user:typing, etc.).

Integration Tests

Multi-user scenarios (two or more clients in private and group chats).

Message flow with attachments, reactions, replies, forwards.

End-to-End (E2E) Tests

Automated browser tests to simulate real-world use.

Verify UI states: message alignment, avatars, reactions, status indicators.

Stress & Reliability Testing

High-volume message sending to ensure system stability.

Test intermittent connectivity (offline/online transitions).

Regression Testing

Ensure that fixes or feature completions do not break other chat features.

Deliverables

Audit Report

List of existing features with status: working, partial, missing, broken.

Recommendations and fixes for each incomplete feature.

Implementation Completion

Fully implemented chat features as per the above requirements.

Bug fixes for all identified issues.

Testing Suite

Automated unit, integration, and E2E tests covering all messaging system features.

Final Verification

Confirm that the system is production-ready, reliable under real-time load, and meets UX expectations.

Success Criteria

All chat features function reliably in real time across multiple clients.

Database and socket events are fully synchronized.

No missing or broken UI/UX components.

All features are covered by automated tests with passing results.

Users never need to manually refresh to see the latest messages or updates.