import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import NoticeBoard from './NoticeBoard';
import { ToastProvider } from '../../components/Common/Toast';

// Mock icons
jest.mock('../../components/Common/Icons', () => ({
  __esModule: true,
  default: {
    NoticeBoard: () => <div>NoticeBoard Icon</div>,
    Warning: () => <div>Warning Icon</div>,
    Add: () => <div>Add Icon</div>,
    MoreVert: () => <div>MoreVert Icon</div>,
    ThumbUp: () => <div>ThumbUp Icon</div>,
    Comment: () => <div>Comment Icon</div>
  }
}));

// Mock Upload components
jest.mock('../../components/Upload', () => ({
  ImageUpload: () => <div>ImageUpload</div>,
  MediaPreview: () => <div>MediaPreview</div>
}));

// Mock other components
jest.mock('../../components/Common/ImageThumbnail', () => ({
  ImageThumbnailGrid: () => <div>ImageThumbnailGrid</div>
}));

jest.mock('../../components/Welcome/NoticeBoardWelcomeMessage', () => ({
  __esModule: true,
  default: () => <div>NoticeBoardWelcomeMessage</div>
}));

jest.mock('../../components/Common/EmptyState', () => ({
  __esModule: true,
  default: () => <div>EmptyState</div>
}));

jest.mock('../../components/Legal/TermsModal', () => ({
  __esModule: true,
  default: () => <div>TermsModal</div>
}));

jest.mock('../../components/Common/ViewToggle/ViewToggle', () => ({
  __esModule: true,
  default: () => <div>ViewToggle</div>
}));

jest.mock('../../components/Common/PinIcon', () => ({
  __esModule: true,
  default: () => <div>PinIcon</div>
}));

jest.mock('../../components/Common/PinAction', () => ({
  __esModule: true,
  default: () => <div>PinAction</div>
}));

// Mock the hooks and components
jest.mock('../../hooks/useTermsAcceptance', () => ({
  __esModule: true,
  default: () => ({
    canPostNotice: true,
    acceptTerms: jest.fn(),
    loading: false,
    error: null
  })
}));

jest.mock('../../hooks/useViewPreference', () => ({
  __esModule: true,
  default: jest.fn((storageKey, defaultView) => {
    const mockSetView = jest.fn();
    return [defaultView, mockSetView];
  })
}));

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([])
  })
);

const theme = createTheme();

const renderNoticeBoard = (props = {}) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <ToastProvider>
          <NoticeBoard {...props} />
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

// Mock useNavigate and useParams
const mockNavigate = jest.fn();
const mockUseParams = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams()
}));

describe('NoticeBoard ViewToggle', () => {
  beforeEach(() => {
    fetch.mockClear();
    localStorage.clear();
    mockNavigate.mockClear();
    mockUseParams.mockReturnValue({});
  });

  test('renders ViewToggle component', () => {
    renderNoticeBoard();
    
    // Check if ViewToggle buttons are present
    const gridButton = screen.getByRole('button', { name: /grid view/i });
    const listButton = screen.getByRole('button', { name: /list view/i });
    
    expect(gridButton).toBeInTheDocument();
    expect(listButton).toBeInTheDocument();
  });

  test('ViewToggle starts with grid view by default', () => {
    renderNoticeBoard();
    
    const gridButton = screen.getByRole('button', { name: /grid view/i });
    expect(gridButton).toHaveClass('view-toggle__button--active');
  });

  test('ViewToggle switches between views', () => {
    renderNoticeBoard();
    
    const gridButton = screen.getByRole('button', { name: /grid view/i });
    const listButton = screen.getByRole('button', { name: /list view/i });
    
    // Initially grid should be active
    expect(gridButton).toHaveClass('view-toggle__button--active');
    expect(listButton).not.toHaveClass('view-toggle__button--active');
    
    // Click list view
    fireEvent.click(listButton);
    
    // Now list should be active
    expect(listButton).toHaveClass('view-toggle__button--active');
    expect(gridButton).not.toHaveClass('view-toggle__button--active');
  });

  test('ViewToggle persists preference to localStorage', () => {
    renderNoticeBoard();
    
    const listButton = screen.getByRole('button', { name: /list view/i });
    
    // Click list view
    fireEvent.click(listButton);
    
    // Check if preference is saved to localStorage
    expect(localStorage.getItem('noticeboard-view-preference')).toBe('list');
  });
});

describe('NoticeBoard Back Button Navigation', () => {
  beforeEach(() => {
    fetch.mockClear();
    localStorage.clear();
    mockNavigate.mockClear();
    
    // Mock localStorage token
    localStorage.setItem('token', 'mock-token');
  });

  test('back button uses browser history when viewing notice details', async () => {
    // Mock single notice fetch
    const mockNotice = {
      _id: 'notice-1',
      title: 'Test Notice',
      content: 'Test content',
      category: 'general',
      priority: 'normal',
      authorId: {
        firstName: 'John',
        lastName: 'Doe'
      },
      createdAt: new Date().toISOString(),
      isPinned: false,
      viewCount: 5,
      likes: [],
      comments: [],
      media: []
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockNotice)
    });

    // Mock useParams to return a notice ID (detail view)
    mockUseParams.mockReturnValue({ id: 'notice-1' });

    // Mock window.history.length to simulate browser history
    Object.defineProperty(window, 'history', {
      value: { length: 3 },
      writable: true
    });

    renderNoticeBoard();

    // Wait for the notice to load and back button to appear
    const backButton = await screen.findByRole('button', { name: /← back/i });
    expect(backButton).toBeInTheDocument();

    // Click the back button
    fireEvent.click(backButton);

    // Should navigate back using browser history (-1)
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  test('back button navigates to home when no browser history exists', async () => {
    // Mock single notice fetch
    const mockNotice = {
      _id: 'notice-1',
      title: 'Test Notice',
      content: 'Test content',
      category: 'general',
      priority: 'normal',
      authorId: {
        firstName: 'John',
        lastName: 'Doe'
      },
      createdAt: new Date().toISOString(),
      isPinned: false,
      viewCount: 5,
      likes: [],
      comments: [],
      media: []
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockNotice)
    });

    // Mock useParams to return a notice ID (detail view)
    mockUseParams.mockReturnValue({ id: 'notice-1' });

    // Mock window.history.length to simulate no browser history
    Object.defineProperty(window, 'history', {
      value: { length: 1 },
      writable: true
    });

    renderNoticeBoard();

    // Wait for the notice to load and back button to appear
    const backButton = await screen.findByRole('button', { name: /← back/i });
    expect(backButton).toBeInTheDocument();

    // Click the back button
    fireEvent.click(backButton);

    // Should navigate to home page as fallback
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('back button is functional in notice board section', async () => {
    // Mock single notice fetch
    const mockNotice = {
      _id: 'notice-1',
      title: 'Test Notice',
      content: 'Test content',
      category: 'general',
      priority: 'normal',
      authorId: {
        firstName: 'John',
        lastName: 'Doe'
      },
      createdAt: new Date().toISOString(),
      isPinned: false,
      viewCount: 5,
      likes: [],
      comments: [],
      media: []
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockNotice)
    });

    // Mock useParams to return a notice ID (detail view)
    mockUseParams.mockReturnValue({ id: 'notice-1' });

    renderNoticeBoard();

    // Wait for the notice to load and back button to appear
    const backButton = await screen.findByRole('button', { name: /← back/i });
    
    // Verify back button is functional (clickable and visible)
    expect(backButton).toBeInTheDocument();
    expect(backButton).toBeEnabled();
  });
});