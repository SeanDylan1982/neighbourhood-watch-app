import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import LocationPicker from '../LocationPicker';

// Mock theme
const theme = createTheme();

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn()
};

// Mock permissions API
const mockPermissions = {
  query: jest.fn()
};

// Mock fetch for geocoding
global.fetch = jest.fn();

// Setup mocks
beforeAll(() => {
  Object.defineProperty(global.navigator, 'geolocation', {
    value: mockGeolocation,
    writable: true
  });
  
  Object.defineProperty(global.navigator, 'permissions', {
    value: mockPermissions,
    writable: true
  });
});

// Helper function to render component with theme
const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('LocationPicker Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default permission mock
    mockPermissions.query.mockResolvedValue({
      state: 'prompt',
      addEventListener: jest.fn()
    });
    
    // Default fetch mock for geocoding
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        locality: 'Test City',
        principalSubdivision: 'Test State',
        countryName: 'Test Country'
      })
    });
  });

  test('renders location picker with initial state', () => {
    renderWithTheme(<LocationPicker />);
    
    expect(screen.getByText('Share Location')).toBeInTheDocument();
    expect(screen.getByText('Get Current Location')).toBeInTheDocument();
    expect(screen.getByText('Location permission required')).toBeInTheDocument();
  });

  test('handles geolocation not supported', async () => {
    // Mock geolocation as undefined
    Object.defineProperty(global.navigator, 'geolocation', {
      value: undefined,
      writable: true
    });

    renderWithTheme(<LocationPicker />);
    
    await waitFor(() => {
      expect(screen.getByText(/Geolocation is not supported/)).toBeInTheDocument();
    });
  });

  test('shows permission granted status', async () => {
    mockPermissions.query.mockResolvedValue({
      state: 'granted',
      addEventListener: jest.fn()
    });

    renderWithTheme(<LocationPicker />);
    
    await waitFor(() => {
      expect(screen.getByText('Location access granted')).toBeInTheDocument();
    });
  });

  test('shows permission denied status', async () => {
    mockPermissions.query.mockResolvedValue({
      state: 'denied',
      addEventListener: jest.fn()
    });

    renderWithTheme(<LocationPicker />);
    
    await waitFor(() => {
      expect(screen.getByText('Location access denied')).toBeInTheDocument();
    });
  });

  test('successfully gets current location', async () => {
    const mockPosition = {
      coords: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10
      },
      timestamp: Date.now()
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      setTimeout(() => success(mockPosition), 100);
    });

    const onLocationSelect = jest.fn();
    renderWithTheme(<LocationPicker onLocationSelect={onLocationSelect} />);
    
    const getLocationButton = screen.getByText('Get Current Location');
    fireEvent.click(getLocationButton);

    await waitFor(() => {
      expect(screen.getByText('Current Location')).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getByText('Test City, Test State, Test Country')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Share Location/i })).toBeInTheDocument();
  });

  test('handles geolocation permission denied error', async () => {
    const mockError = {
      code: 1, // PERMISSION_DENIED
      message: 'User denied geolocation'
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      error(mockError);
    });

    renderWithTheme(<LocationPicker />);
    
    const getLocationButton = screen.getByText('Get Current Location');
    fireEvent.click(getLocationButton);

    await waitFor(() => {
      expect(screen.getByText(/Location access denied/)).toBeInTheDocument();
    });
  });

  test('handles geolocation timeout error', async () => {
    const mockError = {
      code: 3, // TIMEOUT
      message: 'Timeout'
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      error(mockError);
    });

    renderWithTheme(<LocationPicker />);
    
    const getLocationButton = screen.getByText('Get Current Location');
    fireEvent.click(getLocationButton);

    await waitFor(() => {
      expect(screen.getByText(/Location request timed out/)).toBeInTheDocument();
    });
  });

  test('handles position unavailable error', async () => {
    const mockError = {
      code: 2, // POSITION_UNAVAILABLE
      message: 'Position unavailable'
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      error(mockError);
    });

    renderWithTheme(<LocationPicker />);
    
    const getLocationButton = screen.getByText('Get Current Location');
    fireEvent.click(getLocationButton);

    await waitFor(() => {
      expect(screen.getByText(/Location information is unavailable/)).toBeInTheDocument();
    });
  });

  test('calls onLocationSelect when sharing location', async () => {
    const mockPosition = {
      coords: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10
      },
      timestamp: Date.now()
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      setTimeout(() => success(mockPosition), 100);
    });

    const onLocationSelect = jest.fn();
    renderWithTheme(<LocationPicker onLocationSelect={onLocationSelect} />);
    
    // Get location first
    const getLocationButton = screen.getByText('Get Current Location');
    fireEvent.click(getLocationButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Share Location/i })).toBeInTheDocument();
    }, { timeout: 3000 });

    // Share location
    const shareButton = screen.getByRole('button', { name: /Share Location/i });
    fireEvent.click(shareButton);

    expect(onLocationSelect).toHaveBeenCalledWith({
      type: 'location',
      coordinates: {
        latitude: 40.7128,
        longitude: -74.0060
      },
      address: 'Test City, Test State, Test Country',
      accuracy: 10,
      timestamp: expect.any(Date),
      preview: '📍 Test City, Test State, Test Country'
    });
  });

  test('handles geocoding failure gracefully', async () => {
    const mockPosition = {
      coords: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10
      },
      timestamp: Date.now()
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      setTimeout(() => success(mockPosition), 100);
    });

    // Mock fetch failure
    global.fetch.mockRejectedValue(new Error('Geocoding failed'));

    renderWithTheme(<LocationPicker />);
    
    const getLocationButton = screen.getByText('Get Current Location');
    fireEvent.click(getLocationButton);

    await waitFor(() => {
      expect(screen.getByText('Current Location')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Should fallback to coordinates
    expect(screen.getByText('40.712800, -74.006000')).toBeInTheDocument();
  });

  test('refreshes location when refresh button is clicked', async () => {
    const mockPosition = {
      coords: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10
      },
      timestamp: Date.now()
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      setTimeout(() => success(mockPosition), 100);
    });

    renderWithTheme(<LocationPicker />);
    
    // Get location first
    const getLocationButton = screen.getByText('Get Current Location');
    fireEvent.click(getLocationButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument();
    }, { timeout: 3000 });

    // Click refresh
    const refreshButton = screen.getByRole('button', { name: /Refresh/i });
    fireEvent.click(refreshButton);

    expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledTimes(2);
  });

  test('opens map when view on map is clicked', async () => {
    const mockPosition = {
      coords: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10
      },
      timestamp: Date.now()
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      setTimeout(() => success(mockPosition), 100);
    });

    // Mock window.open
    const mockOpen = jest.fn();
    global.window.open = mockOpen;

    renderWithTheme(<LocationPicker />);
    
    // Get location first
    const getLocationButton = screen.getByText('Get Current Location');
    fireEvent.click(getLocationButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /View on Map/i })).toBeInTheDocument();
    }, { timeout: 3000 });

    // Click view on map
    const mapButton = screen.getByRole('button', { name: /View on Map/i });
    fireEvent.click(mapButton);

    expect(mockOpen).toHaveBeenCalledWith(
      'https://www.google.com/maps?q=40.7128,-74.006',
      '_blank'
    );
  });

  test('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    renderWithTheme(<LocationPicker onClose={onClose} />);
    
    const closeButton = screen.getByTestId('CloseIcon').closest('button');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  test('disables buttons when disabled prop is true', () => {
    renderWithTheme(<LocationPicker disabled={true} />);
    
    const getLocationButton = screen.getByText('Get Current Location');
    expect(getLocationButton).toBeDisabled();
  });

  test('formats accuracy correctly', async () => {
    const mockPosition = {
      coords: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 1500 // 1.5km
      },
      timestamp: Date.now()
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      setTimeout(() => success(mockPosition), 100);
    });

    renderWithTheme(<LocationPicker />);
    
    const getLocationButton = screen.getByText('Get Current Location');
    fireEvent.click(getLocationButton);

    await waitFor(() => {
      expect(screen.getByText('±1.5km')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('formats timestamp correctly', async () => {
    const mockTimestamp = Date.now() - 120000; // 2 minutes ago
    const mockPosition = {
      coords: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10
      },
      timestamp: mockTimestamp
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      setTimeout(() => success(mockPosition), 100);
    });

    renderWithTheme(<LocationPicker />);
    
    const getLocationButton = screen.getByText('Get Current Location');
    fireEvent.click(getLocationButton);

    await waitFor(() => {
      expect(screen.getByText('Updated 2 minutes ago')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});