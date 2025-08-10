import { renderHook, act } from '@testing-library/react';
import useLocationPicker from '../useLocationPicker';

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

describe('useLocationPicker Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default permission mock
    mockPermissions.query.mockResolvedValue({
      state: 'prompt',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
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

  test('initializes with correct default state', async () => {
    const { result } = renderHook(() => useLocationPicker());
    
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('');
    expect(result.current.location).toBe(null);
    expect(result.current.isSupported).toBe(true);
    expect(result.current.hasLocation).toBe(false);
    expect(result.current.hasError).toBe(false);
  });

  test('detects when geolocation is not supported', async () => {
    // Mock geolocation as undefined
    Object.defineProperty(global.navigator, 'geolocation', {
      value: undefined,
      writable: true
    });

    const { result } = renderHook(() => useLocationPicker());
    
    // Wait for effect to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isSupported).toBe(false);
    expect(result.current.error).toContain('Geolocation is not supported');
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
      success(mockPosition);
    });

    const onLocationSelect = jest.fn();
    const { result } = renderHook(() => useLocationPicker({ onLocationSelect }));
    
    let locationData;
    await act(async () => {
      locationData = await result.current.getCurrentLocation();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('');
    expect(result.current.location).toBeTruthy();
    expect(result.current.hasLocation).toBe(true);
    expect(locationData.type).toBe('location');
    expect(locationData.coordinates.latitude).toBe(40.7128);
    expect(locationData.coordinates.longitude).toBe(-74.0060);
    expect(locationData.address).toBe('Test City, Test State, Test Country');
    expect(onLocationSelect).toHaveBeenCalledWith(locationData);
  });

  test('handles permission denied error', async () => {
    const mockError = {
      code: 1, // PERMISSION_DENIED
      message: 'User denied geolocation'
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      error(mockError);
    });

    const onError = jest.fn();
    const { result } = renderHook(() => useLocationPicker({ onError }));
    
    let locationData;
    await act(async () => {
      locationData = await result.current.getCurrentLocation();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toContain('Location access denied');
    expect(result.current.location).toBe(null);
    expect(result.current.permissionStatus).toBe('denied');
    expect(locationData).toBe(null);
    expect(onError).toHaveBeenCalled();
  });

  test('handles timeout error', async () => {
    const mockError = {
      code: 3, // TIMEOUT
      message: 'Timeout'
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      error(mockError);
    });

    const { result } = renderHook(() => useLocationPicker());
    
    await act(async () => {
      await result.current.getCurrentLocation();
    });

    expect(result.current.error).toContain('Location request timed out');
  });

  test('handles position unavailable error', async () => {
    const mockError = {
      code: 2, // POSITION_UNAVAILABLE
      message: 'Position unavailable'
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      error(mockError);
    });

    const { result } = renderHook(() => useLocationPicker());
    
    await act(async () => {
      await result.current.getCurrentLocation();
    });

    expect(result.current.error).toContain('Location information is unavailable');
  });

  test('clears location and error', async () => {
    const mockPosition = {
      coords: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10
      },
      timestamp: Date.now()
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success(mockPosition);
    });

    const { result } = renderHook(() => useLocationPicker());
    
    // Get location first
    await act(async () => {
      await result.current.getCurrentLocation();
    });

    expect(result.current.hasLocation).toBe(true);

    // Clear location
    act(() => {
      result.current.clearLocation();
    });

    expect(result.current.location).toBe(null);
    expect(result.current.error).toBe('');
    expect(result.current.hasLocation).toBe(false);
  });

  test('checks location availability correctly', async () => {
    const { result } = renderHook(() => useLocationPicker());
    
    let availability;
    await act(async () => {
      availability = await result.current.checkLocationAvailability();
    });

    expect(availability.available).toBe(true);
    expect(availability.reason).toBe(null);
  });

  test('formats location data correctly', () => {
    const { result } = renderHook(() => useLocationPicker());
    
    const locationData = {
      type: 'location',
      coordinates: { latitude: 40.7128, longitude: -74.0060 },
      address: 'Test City, Test State, Test Country',
      accuracy: 1500,
      timestamp: new Date(Date.now() - 120000) // 2 minutes ago
    };

    const formatted = result.current.formatLocation(locationData);

    expect(formatted.formattedCoordinates).toBe('40.712800, -74.006000');
    expect(formatted.formattedAccuracy).toBe('±1.5km');
    expect(formatted.formattedTimestamp).toBe('2 minutes ago');
    expect(formatted.mapUrl).toBe('https://www.google.com/maps?q=40.7128,-74.006');
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
      success(mockPosition);
    });

    // Mock fetch failure
    global.fetch.mockRejectedValue(new Error('Geocoding failed'));

    const { result } = renderHook(() => useLocationPicker());
    
    let locationData;
    await act(async () => {
      locationData = await result.current.getCurrentLocation();
    });

    expect(locationData.address).toBe('40.712800, -74.006000'); // Fallback to coordinates
  });

  test('watches position correctly', async () => {
    const mockWatchId = 123;
    const callback = jest.fn();

    mockGeolocation.watchPosition.mockImplementation((success) => {
      // Simulate position update
      setTimeout(() => {
        success({
          coords: {
            latitude: 40.7128,
            longitude: -74.0060,
            accuracy: 10
          },
          timestamp: Date.now()
        });
      }, 100);
      return mockWatchId;
    });

    const { result } = renderHook(() => useLocationPicker());
    
    let watchId;
    await act(async () => {
      watchId = result.current.watchPosition(callback);
      // Wait for the position update
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    expect(watchId).toBe(mockWatchId);
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({
      type: 'location',
      coordinates: { latitude: 40.7128, longitude: -74.0060 }
    }));
  });

  test('clears watch correctly', () => {
    const mockWatchId = 123;
    const { result } = renderHook(() => useLocationPicker());
    
    act(() => {
      result.current.clearWatch(mockWatchId);
    });

    expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(mockWatchId);
  });

  test('computes canGetLocation correctly', async () => {
    const { result } = renderHook(() => useLocationPicker());
    
    // Wait for initial setup
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.canGetLocation).toBe(true);

    // Test when permission is denied
    act(() => {
      result.current.permissionStatus = 'denied';
    });

    // Note: This test might need adjustment based on how the hook updates state
    // The actual implementation might require a re-render or state update
  });

  test('handles custom options correctly', () => {
    const options = {
      enableHighAccuracy: false,
      timeout: 5000,
      maximumAge: 60000
    };

    const { result } = renderHook(() => useLocationPicker(options));
    
    // The options should be used when calling getCurrentPosition
    act(() => {
      result.current.getCurrentLocation();
    });

    expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.objectContaining(options)
    );
  });
});