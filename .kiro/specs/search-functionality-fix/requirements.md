# Search Functionality Fix Requirements

## Introduction

The search functionality in the neighbourhood watch application is currently not working properly. Users report that autocomplete suggestions are not displaying and pressing Enter does not navigate to a search results page. This spec addresses fixing the search functionality to provide a seamless search experience.

## Requirements

### Requirement 1

**User Story:** As a user, I want to see autocomplete suggestions when I type in the search bar, so that I can quickly find relevant content.

#### Acceptance Criteria

1. WHEN a user types in the search bar THEN autocomplete suggestions SHALL appear within 500ms
2. WHEN autocomplete suggestions are displayed THEN they SHALL be grouped by content type (People, Notices, Reports, Chats)
3. WHEN a user clicks on an autocomplete suggestion THEN they SHALL be navigated to the relevant content
4. WHEN there are no search results THEN a "No results found" message SHALL be displayed

### Requirement 2

**User Story:** As a user, I want to press Enter in the search bar to navigate to a full search results page, so that I can see comprehensive search results.

#### Acceptance Criteria

1. WHEN a user presses Enter in the search bar THEN they SHALL be navigated to a dedicated search results page
2. WHEN the search results page loads THEN it SHALL display the search query in the URL parameters
3. WHEN the search results page displays THEN it SHALL show results grouped by content type
4. WHEN no results are found THEN an appropriate message SHALL be displayed

### Requirement 3

**User Story:** As a user, I want the search functionality to work without database text indexes, so that the search is reliable and doesn't depend on complex database setup.

#### Acceptance Criteria

1. WHEN the search service performs queries THEN it SHALL use regex-based matching instead of MongoDB text search
2. WHEN search results are returned THEN they SHALL be sorted by relevance based on field matches
3. WHEN the search encounters database errors THEN it SHALL handle them gracefully and return empty results
4. WHEN the search service is called THEN it SHALL not require MongoDB text indexes to function

### Requirement 4

**User Story:** As a user, I want my recent searches to be saved and displayed, so that I can quickly repeat previous searches.

#### Acceptance Criteria

1. WHEN a user performs a search THEN it SHALL be added to their search history
2. WHEN a user focuses on the search bar with no query THEN recent searches SHALL be displayed
3. WHEN a user clicks on a recent search THEN it SHALL populate the search bar and perform the search
4. WHEN a user wants to clear search history THEN they SHALL have an option to do so