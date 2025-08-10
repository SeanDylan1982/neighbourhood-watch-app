import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import PinAction from './PinAction';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../Toast';

// Mock the dependencies
jest.mock('../../../contexts/AuthContext');
jest.mock('../Toast');

// Create a theme for testing
const theme = createTheme();

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

// Mock fetch
global.fetch = jest.fn();

describe('PinAction Component', () => {
  const mockShowToast = jest.fn();
  const mockOnPinChange = jest.fn();

  beforeEach(() => {
    useToast.mockReturnValue({ showToast: mockShowToast });
    fetch.mockClear();
    mockShowToast.mockClear();
    mockOnPinChange.mockClear();
  });

  test('does not render for non-admin users', () => {
    useAuth.mockReturnValue({ user: { role: 'user' } });

    const { container } = renderWithTheme(
      <PinAction
        contentType="notice"
        contentId="123"
        isPinned={false}
        onPinChange={mockOnPinChange}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  test('renders pin button for admin users', () => {
    useAuth.mockReturnValue({ user: { role: 'admin' } });

    renderWithTheme(
      <PinAction
        contentType="notice"
        contentId="123"
        isPinned={false}
        onPinChange={mockOnPinChange}
      />
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('shows correct tooltip for unpinned content', () => {
    useAuth.mockReturnValue({ user: { role: 'admin' } });

    renderWithTheme(
      <PinAction
        contentType="notice"
        contentId="123"
        isPinned={false}
        onPinChange={mockOnPinChange}
      />
    );

    expect(screen.getByLabelText('Pin this notice')).toBeInTheDocument();
  });

  test('shows correct tooltip for pinned content', () => {
    useAuth.mockReturnValue({ user: { role: 'admin' } });

    renderWithTheme(
      <PinAction
        contentType="notice"
        contentId="123"
        isPinned={true}
        onPinChange={mockOnPinChange}
      />
    );

    expect(screen.getByLabelText('Unpin this notice')).toBeInTheDocument();
  });

  test('calls pin API when clicking unpinned content', async () => {
    useAuth.mockReturnValue({ user: { role: 'admin' } });
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Notice pinned successfully' })
    });

    renderWithTheme(
      <PinAction
        contentType="notice"
        contentId="123"
        isPinned={false}
        onPinChange={mockOnPinChange}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5001/api/notices/123/pin',
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });
  });

  test('calls unpin API when clicking pinned content', async () => {
    useAuth.mockReturnValue({ user: { role: 'admin' } });
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Notice unpinned successfully' })
    });

    renderWithTheme(
      <PinAction
        contentType="notice"
        contentId="123"
        isPinned={true}
        onPinChange={mockOnPinChange}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5001/api/notices/123/unpin',
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });
  });

  test('calls onPinChange callback on successful pin', async () => {
    useAuth.mockReturnValue({ user: { role: 'admin' } });
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Notice pinned successfully' })
    });

    renderWithTheme(
      <PinAction
        contentType="notice"
        contentId="123"
        isPinned={false}
        onPinChange={mockOnPinChange}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockOnPinChange).toHaveBeenCalledWith('123', true);
    });
  });

  test('shows error toast when maximum pins reached', async () => {
    useAuth.mockReturnValue({ user: { role: 'admin' } });
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Maximum of 2 items can be pinned at once' })
    });

    renderWithTheme(
      <PinAction
        contentType="notice"
        contentId="123"
        isPinned={false}
        onPinChange={mockOnPinChange}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        'Maximum of 2 items can be pinned at once. Please unpin another item first.',
        'warning'
      );
    });
  });
});