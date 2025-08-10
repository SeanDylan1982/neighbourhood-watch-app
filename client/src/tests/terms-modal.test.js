/**
 * Tests for Terms and Conditions Modal functionality
 * Verifies that terms acceptance is properly enforced and tracked
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import TermsModal from '../components/Legal/TermsModal';
import useTermsAcceptance from '../hooks/useTermsAcceptance';

// Mock the terms acceptance hook
jest.mock('../hooks/useTermsAcceptance');

const theme = createTheme();

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('TermsModal Component', () => {
  const mockOnAccept = jest.fn();
  const mockOnDecline = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useTermsAcceptance.mockReturnValue({
      canPostNotice: jest.fn(() => false),
      canSubmitReport: jest.fn(() => false),
      acceptTerms: jest.fn(),
      loading: false,
      error: null
    });
  });

  test('renders notice board terms modal correctly', () => {
    renderWithProviders(
      <TermsModal
        open={true}
        onClose={mockOnClose}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        type="noticeBoard"
        loading={false}
      />
    );

    expect(screen.getByText('Notice Board Terms and Conditions')).toBeInTheDocument();
    expect(screen.getByText(/By posting on the Notice Board/)).toBeInTheDocument();
    expect(screen.getByText('Prohibited Content')).toBeInTheDocument();
    expect(screen.getByText('Community Guidelines')).toBeInTheDocument();
  });

  test('renders report terms modal correctly', () => {
    renderWithProviders(
      <TermsModal
        open={true}
        onClose={mockOnClose}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        type="report"
        loading={false}
      />
    );

    expect(screen.getByText('Report Submission Terms and Conditions')).toBeInTheDocument();
    expect(screen.getByText(/When submitting reports/)).toBeInTheDocument();
    expect(screen.getByText('Requirements')).toBeInTheDocument();
    expect(screen.getByText('Your Responsibilities')).toBeInTheDocument();
  });

  test('requires checkbox to be checked before accepting', async () => {
    renderWithProviders(
      <TermsModal
        open={true}
        onClose={mockOnClose}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        type="noticeBoard"
        loading={false}
      />
    );

    const acceptButton = screen.getByText('Accept & Continue');
    expect(acceptButton).toBeDisabled();

    // Try to accept without checking the box
    fireEvent.click(acceptButton);
    expect(mockOnAccept).not.toHaveBeenCalled();

    // Check the agreement checkbox
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(acceptButton).not.toBeDisabled();
  });

  test('shows error when trying to accept without reading', async () => {
    renderWithProviders(
      <TermsModal
        open={true}
        onClose={mockOnClose}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        type="noticeBoard"
        loading={false}
      />
    );

    const acceptButton = screen.getByText('Accept & Continue');
    
    // Enable the button by checking the checkbox
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    // Uncheck it
    fireEvent.click(checkbox);
    
    // Try to click accept (should show error)
    fireEvent.click(acceptButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Please confirm that you have read/)).toBeInTheDocument();
    });
  });

  test('calls onAccept when terms are properly accepted', async () => {
    renderWithProviders(
      <TermsModal
        open={true}
        onClose={mockOnClose}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        type="noticeBoard"
        loading={false}
      />
    );

    // Check the agreement checkbox
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    // Click accept
    const acceptButton = screen.getByText('Accept & Continue');
    fireEvent.click(acceptButton);

    await waitFor(() => {
      expect(mockOnAccept).toHaveBeenCalled();
    });
  });

  test('calls onDecline when decline button is clicked', () => {
    renderWithProviders(
      <TermsModal
        open={true}
        onClose={mockOnClose}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        type="noticeBoard"
        loading={false}
      />
    );

    const declineButton = screen.getByText('Decline');
    fireEvent.click(declineButton);

    expect(mockOnDecline).toHaveBeenCalled();
  });

  test('shows loading state correctly', () => {
    renderWithProviders(
      <TermsModal
        open={true}
        onClose={mockOnClose}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        type="noticeBoard"
        loading={true}
      />
    );

    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(screen.getByText('Decline')).toBeDisabled();
  });

  test('displays all prohibited content items for notice board', () => {
    renderWithProviders(
      <TermsModal
        open={true}
        onClose={mockOnClose}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        type="noticeBoard"
        loading={false}
      />
    );

    expect(screen.getByText(/Commercial advertising or solicitation/)).toBeInTheDocument();
    expect(screen.getByText(/Promotional content for businesses/)).toBeInTheDocument();
    expect(screen.getByText(/Spam, repetitive, or irrelevant content/)).toBeInTheDocument();
    expect(screen.getByText(/Offensive, discriminatory, or inappropriate language/)).toBeInTheDocument();
  });

  test('displays all requirements for report terms', () => {
    renderWithProviders(
      <TermsModal
        open={true}
        onClose={mockOnClose}
        onAccept={mockOnAccept}
        onDecline={mockOnDecline}
        type="report"
        loading={false}
      />
    );

    expect(screen.getByText(/All reports must be based on factual observations/)).toBeInTheDocument();
    expect(screen.getByText(/Include specific details: date, time, location/)).toBeInTheDocument();
    expect(screen.getByText(/Provide credible sources or evidence/)).toBeInTheDocument();
    expect(screen.getByText(/Use objective language without personal opinions/)).toBeInTheDocument();
  });
});