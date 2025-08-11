/**
 * Utility functions for handling image URLs
 */
import { API_BASE_URL } from '../config/api';

/**
 * Get the full URL for an image
 * @param {string} imageUrl - The image URL (can be relative or absolute)
 * @returns {string} - The full image URL
 */
export const getFullImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  
  // If it's already a full URL, return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // If it's a relative URL, prepend the API base URL
  const baseURL = API_BASE_URL;
  
  // Ensure the URL starts with /
  const normalizedUrl = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  
  const fullUrl = `${baseURL}${normalizedUrl}`;
  
  return fullUrl;
};

/**
 * Get user initials from user object
 * @param {object} user - User object with firstName and lastName
 * @returns {string} - User initials
 */
export const getUserInitials = (user) => {
  if (!user) return '?';
  return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();
};