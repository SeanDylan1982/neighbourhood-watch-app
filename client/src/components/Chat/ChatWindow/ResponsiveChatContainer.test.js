import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ResponsiveChatContainer from './ResponsiveChatContainer';

// Mock the useResponsive hook
jest.mock('../../../hooks/useResponsive', () => ({
  useResponsive: () => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    getResponsiveValue: (mobile, tablet, desktop) => desktop || tablet || mobile
  })
}));

// Mock ResponsiveChatLayout
jest.mock('./ResponsiveChatLayout', () => {
  return function MockResponsiveChatLayout({ children, ...props }) {
    return <div data-testid="responsive-chat-layout" {...props}>{children}</div>;
  };
});

const theme = createTheme();

const TestWrapper = ({ children }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

describe('ResponsiveChatContainer', () => {
  const mockChatListComponent = <div data-testid="chat-list">Chat List</div>;
  const mockMessageContentComponent = <div data-testid="message-content">Message Content</div>;

  it('renders chat list and message content components', () => {
    render(
      <TestWrapper>
        <ResponsiveChatContainer
          chatListComponent={mockChatListComponent}
          messageContentComponent={mockMessageContentComponent}
          selectedChatId="chat1"
          showChatList={true}
          showMessageContent={true}
        />
      </TestWrapper>
    );

    expect(screen.getByTestId('chat-list')).toBeInTheDocument();
    expect(screen.getByTestId('message-content')).toBeInTheDocument();
  });

  it('applies correct grid sizes for desktop', () => {
    const { container } = render(
      <TestWrapper>
        <ResponsiveChatContainer
          chatListComponent={mockChatListComponent}
          messageContentComponent={mockMessageContentComponent}
          selectedChatId="chat1"
          showChatList={true}
          showMessageContent={true}
        />
      </TestWrapper>
    );

    // Check that grid items are present
    const gridItems = container.querySelectorAll('.MuiGrid-item');
    expect(gridItems).toHaveLength(2);
  });

  it('handles chat list scroll events', () => {
    const mockOnChatListScroll = jest.fn();
    
    render(
      <TestWrapper>
        <ResponsiveChatContainer
          chatListComponent={mockChatListComponent}
          messageContentComponent={mockMessageContentComponent}
          selectedChatId="chat1"
          showChatList={true}
          showMessageContent={true}
          onChatListScroll={mockOnChatListScroll}
        />
      </TestWrapper>
    );

    const chatListContainer = screen.getByTestId('chat-list').closest('[data-chat-list-container]');
    
    if (chatListContainer) {
      fireEvent.scroll(chatListContainer, { target: { scrollTop: 100 } });
      expect(mockOnChatListScroll).toHaveBeenCalledWith(expect.any(Object), 100);
    }
  });

  it('handles message content scroll events', () => {
    const mockOnMessageContentScroll = jest.fn();
    
    render(
      <TestWrapper>
        <ResponsiveChatContainer
          chatListComponent={mockChatListComponent}
          messageContentComponent={mockMessageContentComponent}
          selectedChatId="chat1"
          showChatList={true}
          showMessageContent={true}
          onMessageContentScroll={mockOnMessageContentScroll}
        />
      </TestWrapper>
    );

    const messageContentContainer = screen.getByTestId('message-content').closest('[data-message-content-container]');
    
    if (messageContentContainer) {
      fireEvent.scroll(messageContentContainer, { target: { scrollTop: 200 } });
      expect(mockOnMessageContentScroll).toHaveBeenCalledWith(expect.any(Object), 200);
    }
  });

  it('shows only chat list when showMessageContent is false', () => {
    render(
      <TestWrapper>
        <ResponsiveChatContainer
          chatListComponent={mockChatListComponent}
          messageContentComponent={mockMessageContentComponent}
          selectedChatId="chat1"
          showChatList={true}
          showMessageContent={false}
        />
      </TestWrapper>
    );

    expect(screen.getByTestId('chat-list')).toBeInTheDocument();
    expect(screen.queryByTestId('message-content')).not.toBeInTheDocument();
  });

  it('shows only message content when showChatList is false', () => {
    render(
      <TestWrapper>
        <ResponsiveChatContainer
          chatListComponent={mockChatListComponent}
          messageContentComponent={mockMessageContentComponent}
          selectedChatId="chat1"
          showChatList={false}
          showMessageContent={true}
        />
      </TestWrapper>
    );

    expect(screen.queryByTestId('chat-list')).not.toBeInTheDocument();
    expect(screen.getByTestId('message-content')).toBeInTheDocument();
  });

  it('applies correct data attributes for containers', () => {
    const { container } = render(
      <TestWrapper>
        <ResponsiveChatContainer
          chatListComponent={mockChatListComponent}
          messageContentComponent={mockMessageContentComponent}
          selectedChatId="chat1"
          showChatList={true}
          showMessageContent={true}
        />
      </TestWrapper>
    );

    expect(container.querySelector('[data-chat-list-container]')).toBeInTheDocument();
    expect(container.querySelector('[data-message-content-container]')).toBeInTheDocument();
  });

  it('passes selectedChatId to ResponsiveChatLayout', () => {
    render(
      <TestWrapper>
        <ResponsiveChatContainer
          chatListComponent={mockChatListComponent}
          messageContentComponent={mockMessageContentComponent}
          selectedChatId="chat123"
          showChatList={true}
          showMessageContent={true}
        />
      </TestWrapper>
    );

    const responsiveChatLayout = screen.getByTestId('responsive-chat-layout');
    expect(responsiveChatLayout).toHaveAttribute('chatId', 'chat123');
  });

  it('applies custom className', () => {
    render(
      <TestWrapper>
        <ResponsiveChatContainer
          chatListComponent={mockChatListComponent}
          messageContentComponent={mockMessageContentComponent}
          selectedChatId="chat1"
          showChatList={true}
          showMessageContent={true}
          className="custom-container-class"
        />
      </TestWrapper>
    );

    const responsiveChatLayout = screen.getByTestId('responsive-chat-layout');
    expect(responsiveChatLayout).toHaveClass('custom-container-class');
  });
});