/**
 * Fluent Icon Registry - Creates icon components using Fluent UI with Material UI fallbacks
 * This replaces the 3D icon system with a more modern and consistent approach
 */

import React from 'react';
import FluentIcon from './FluentIcon';

/**
 * Creates a colorful Fluent icon component with the specified name
 * @param {string} iconName - Icon name
 * @returns {React.Component} - Fluent color icon component
 */
const createFluentIcon = (iconName) => {
  return (props) => (
    <FluentIcon 
      name={iconName}
      color="auto" // Use natural colors for colorful icons
      {...props} 
    />
  );
};

// Create Fluent icon components for all commonly used icons
const fluentIcons = {
  // Dashboard and navigation
  Dashboard: createFluentIcon('Dashboard'),
  Home: createFluentIcon('Home'),
  Notifications: createFluentIcon('Notifications'),
  NotificationBell: createFluentIcon('NotificationBell'),
  People: createFluentIcon('People'),
  Person: createFluentIcon('Person'),
  PersonAdd: createFluentIcon('PersonAdd'),
  PersonRemove: createFluentIcon('PersonRemove'),
  
  // Communication
  Chat: createFluentIcon('Chat'),
  Message: createFluentIcon('Message'),
  Email: createFluentIcon('Email'),
  Phone: createFluentIcon('Phone'),
  Campaign: createFluentIcon('Campaign'),
  Contacts: createFluentIcon('Contacts'),
  
  // Actions
  Add: createFluentIcon('Add'),
  Remove: createFluentIcon('Remove'),
  Edit: createFluentIcon('Edit'),
  Delete: createFluentIcon('Delete'),
  Close: createFluentIcon('Close'),
  Check: createFluentIcon('Check'),
  Search: createFluentIcon('Search'),
  
  // Navigation arrows
  ArrowBack: createFluentIcon('ArrowBack'),
  ArrowForward: createFluentIcon('ArrowForward'),
  KeyboardArrowUp: createFluentIcon('KeyboardArrowUp'),
  KeyboardArrowDown: createFluentIcon('KeyboardArrowDown'),
  ChevronLeft: createFluentIcon('ChevronLeft'),
  ChevronRight: createFluentIcon('ChevronRight'),
  Menu: createFluentIcon('Menu'),
  
  // Content and status
  Report: createFluentIcon('Report'),
  Reports: createFluentIcon('Reports'),
  NoticeBoard: createFluentIcon('NoticeBoard'),
  Warning: createFluentIcon('Warning'),
  Error: createFluentIcon('Error'),
  Info: createFluentIcon('Info'),
  
  // Admin and system
  Admin: createFluentIcon('Admin'),
  SystemStats: createFluentIcon('SystemStats'),
  AuditLog: createFluentIcon('AuditLog'),
  Location: createFluentIcon('Location'),
  Profile: createFluentIcon('Profile'),
  
  // Settings and admin
  Settings: createFluentIcon('Settings'),
  AdminPanelSettings: createFluentIcon('AdminPanelSettings'),
  Security: createFluentIcon('Security'),
  Lock: createFluentIcon('Lock'),
  Visibility: createFluentIcon('Visibility'),
  VisibilityOff: createFluentIcon('VisibilityOff'),
  
  // Media
  Image: createFluentIcon('Image'),
  VideoFile: createFluentIcon('VideoFile'),
  InsertDriveFile: createFluentIcon('InsertDriveFile'),
  CloudUpload: createFluentIcon('CloudUpload'),
  
  // Social and engagement
  ThumbUp: createFluentIcon('ThumbUp'),
  Comment: createFluentIcon('Comment'),
  Share: createFluentIcon('Share'),
  
  // Status and sync
  CloudOff: createFluentIcon('CloudOff'),
  Sync: createFluentIcon('Sync'),
  Refresh: createFluentIcon('Refresh'),
  AccessTime: createFluentIcon('AccessTime'),
  Storage: createFluentIcon('Storage'),
  
  // Emergency services
  LocalPolice: createFluentIcon('LocalPolice'),
  LocalFireDepartment: createFluentIcon('LocalFireDepartment'),
  LocalHospital: createFluentIcon('LocalHospital'),
  Emergency: createFluentIcon('Emergency'),
  Build: createFluentIcon('Build'),
  
  // Misc
  MoreVert: createFluentIcon('MoreVert'),
  LocationOn: createFluentIcon('LocationOn'),
  Palette: createFluentIcon('Palette'),
  
  // Documents and articles
  Article: createFluentIcon('Article'),
};

export { FluentIcon };
export default fluentIcons;