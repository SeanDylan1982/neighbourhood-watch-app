import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ChatContextMenu from '../ChatContextMenu';
import { CHAT_TYPES } from '../../../../constants/chat';

// Mock the useChat hook
const mockUpdateChatSettings = jest.fn();
const mockDeleteChat = jest.fn();

jest.mock('../../../../hooks/useChat', () => ({
  useChat: () => ({
    updateChatSettings: mockUpdateChatSettings,
    deleteChat: mockDeleteChat
  })
}));

const theme = createTheme();

const mockChat = {
  id: 'chat-1',
  type: CHAT_TYPES.GROUP,
  name: 'Test Group',
  isMuted: false,
  isPinned: false,
  isArchived: false
};

const renderWithProviders = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('ChatContextMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all menu options when open', () => {
    const mockAnchorEl = document.createElement('div');
    
    renderWithProviders(
      <ChatContextMenu
        chat={mockChat}
        anchorEl={mockAnchorEl}
        open={true}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText('Mute notifications')).toBeInTheDocument();
    expect(screen.getByText('Pin chat')).toBeInTheDocument();
    expect(screen.getByText('Archive chat')).toBeInTheDocument();
    expect(screen.getByText('Group info')).toBeInTheDocument();
    expect(screen.getByText('Clear chat')).toBeInTheDocument();
    expect(screen.getByText('Export chat')).toBeInTheDocument();
    expect(screen.getByText('Delete chat')).toBeInTheDocument();
  });

  it('shows correct text for muted chat', () => {
    const mutedChat = { ...mockChat, isMuted: true };
    const mockAnchorEl = document.createElement('div');
    
    renderWithProviders(
      <ChatContextMenu
        chat={mutedChat}
        anchorEl={mockAnchorEl}
        open={true}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText('Unmute notifications')).toBeInTheDocument();
  });

  it('shows correct text for pinned chat', () => {
    const pinnedChat = { ...mockChat, isPinned: true };
    const mockAnchorEl = document.createElement('div');
    
    renderWithProviders(
      <ChatContextMenu
        chat={pinnedChat}
        anchorEl={mockAnchorEl}
        open={true}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText('Unpin chat')).toBeInTheDocument();
  });

  it('shows correct text for archived chat', () => {
    const archivedChat = { ...mockChat, isArchived: true };
    const mockAnchorEl = document.createElement('div');
    
    renderWithProviders(
      <ChatContextMenu
        chat={archivedChat}
        anchorEl={mockAnchorEl}
        open={true}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText('Unarchive chat')).toBeInTheDocument();
  });

  it('shows "Contact info" for private chats', () => {
    const privateChat = { ...mockChat, type: CHAT_TYPES.PRIVATE };
    const mockAnchorEl = document.createElement('div');
    
    renderWithProviders(
      <ChatContextMenu
        chat={privateChat}
        anchorEl={mockAnchorEl}
        open={true}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText('Contact info')).toBeInTheDocument();
  });

  it('calls updateChatSettings when mute is clicked', async () => {
    const mockOnClose = jest.fn();
    const mockAnchorEl = document.createElement('div');
    
    renderWithProviders(
      <ChatContextMenu
        chat={mockChat}
        anchorEl={mockAnchorEl}
        open={true}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('Mute notifications'));

    await waitFor(() => {
      expect(mockUpdateChatSettings).toHaveBeenCalledWith('chat-1', { isMuted: true });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('calls updateChatSettings when pin is clicked', async () => {
    const mockOnClose = jest.fn();
    const mockAnchorEl = document.createElement('div');
    
    renderWithProviders(
      <ChatContextMenu
        chat={mockChat}
        anchorEl={mockAnchorEl}
        open={true}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('Pin chat'));

    await waitFor(() => {
      expect(mockUpdateChatSettings).toHaveBeenCalledWith('chat-1', { isPinned: true });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('calls updateChatSettings when archive is clicked', async () => {
    const mockOnClose = jest.fn();
    const mockAnchorEl = document.createElement('div');
    
    renderWithProviders(
      <ChatContextMenu
        chat={mockChat}
        anchorEl={mockAnchorEl}
        open={true}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('Archive chat'));

    await waitFor(() => {
      expect(mockUpdateChatSettings).toHaveBeenCalledWith('chat-1', { isArchived: true });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('handles delete with confirmation', async () => {
    const mockOnClose = jest.fn();
    const mockAnchorEl = document.createElement('div');
    
    // Mock window.confirm
    const originalConfirm = window.confirm;
    window.confirm = jest.fn(() => true);
    
    renderWithProviders(
      <ChatContextMenu
        chat={mockChat}
        anchorEl={mockAnchorEl}
        open={true}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('Delete chat'));

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this group chat?');
      expect(mockDeleteChat).toHaveBeenCalledWith('chat-1');
      expect(mockOnClose).toHaveBeenCalled();
    });

    // Restore original confirm
    window.confirm = originalConfirm;
  });

  it('closes menu on escape key', () => {
    const mockOnClose = jest.fn();
    const mockAnchorEl = document.createElement('div');
    
    renderWithProviders(
      <ChatContextMenu
        chat={mockChat}
        anchorEl={mockAnchorEl}
        open={true}
        onClose={mockOnClose}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('supports position-based rendering for mobile', () => {
    const position = { x: 100, y: 200 };
    
    renderWithProviders(
      <ChatContextMenu
        chat={mockChat}
        anchorEl={null}
        open={true}
        onClose={jest.fn()}
        position={position}
      />
    );

    expect(screen.getByText('Mute notifications')).toBeInTheDocument();
  });
});