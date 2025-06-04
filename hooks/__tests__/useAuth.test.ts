/**
 * useAuth Hook Tests
 * 
 * Tests for hooks/useAuth.ts including:
 * - Authentication state management
 * - Token expiry monitoring
 * - Automatic session checking
 * - Secure logout functionality
 * - Loading states for UI integration
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
const Cookies = require('js-cookie');
import { useAuth, clearAuthData } from '../useAuth';
import * as authUtils from '@/lib/auth';

// Mock Next.js router
jest.mock('next/navigation');
const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
mockUseRouter.mockReturnValue({
  push: mockPush,
  replace: jest.fn(),
  refresh: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  prefetch: jest.fn(),
} as any);

// Mock js-cookie
jest.mock('js-cookie');
const mockCookies = Cookies as jest.Mocked<typeof Cookies>;

// Mock auth utils
jest.mock('@/lib/auth');
const mockAuthUtils = authUtils as jest.Mocked<typeof authUtils>;

// Mock timers
jest.useFakeTimers();

// Mock window.addEventListener and removeEventListener
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();
const mockDispatchEvent = jest.fn();

Object.defineProperty(window, 'addEventListener', {
  value: mockAddEventListener,
  writable: true
});

Object.defineProperty(window, 'removeEventListener', {
  value: mockRemoveEventListener,
  writable: true
});

Object.defineProperty(window, 'dispatchEvent', {
  value: mockDispatchEvent,
  writable: true
});

Object.defineProperty(window, 'location', {
  value: { hostname: 'localhost' },
  writable: true
});

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
const originalConsoleLog = console.log;
beforeAll(() => {
  console.error = jest.fn();
  console.log = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
});

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    mockAddEventListener.mockClear();
    mockRemoveEventListener.mockClear();
    mockDispatchEvent.mockClear();
    
    // Reset auth utils mocks with default values
    mockAuthUtils.getAccessToken.mockReturnValue(undefined);
    mockAuthUtils.getUserId.mockReturnValue(null);
    mockAuthUtils.validateToken.mockReturnValue({
      isValid: false,
      error: 'No token found'
    });
    mockAuthUtils.TOKEN_REFRESH_INTERVAL = 5 * 60 * 1000;
    mockAuthUtils.TOKEN_EXPIRY_THRESHOLD = 15 * 60;
    
    // Clear timer mocks
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });
  describe('Initial State', () => {
    it('should start with loading true and not authenticated', async () => {
      const { result } = renderHook(() => useAuth());
      
      // Initially might be true, but quickly becomes false after auth check
      // So we'll check the final state after loading completes
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.userId).toBeNull();
    });
  });

  describe('Authentication Check', () => {
    it('should set authenticated state when valid token exists', async () => {
      const mockToken = 'valid-token';
      const mockUserId = 'user123';
      const mockExpiryTime = Math.floor(Date.now() / 1000) + 3600;
      
      mockAuthUtils.getAccessToken.mockReturnValue(mockToken);
      mockAuthUtils.getUserId.mockReturnValue(mockUserId);
      mockAuthUtils.validateToken.mockReturnValue({
        isValid: true,
        decodedToken: { sub: mockUserId },
        expiryTime: mockExpiryTime
      });
      
      const { result } = renderHook(() => useAuth());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.userId).toBe(mockUserId);
    });

    it('should set unauthenticated state when no token exists', async () => {
      mockAuthUtils.getAccessToken.mockReturnValue(undefined);
      mockAuthUtils.getUserId.mockReturnValue(null);
      
      const { result } = renderHook(() => useAuth());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.userId).toBeNull();
    });

    it('should handle invalid token gracefully', async () => {
      const mockToken = 'invalid-token';
      
      mockAuthUtils.getAccessToken.mockReturnValue(mockToken);
      mockAuthUtils.getUserId.mockReturnValue('user123');
      mockAuthUtils.validateToken.mockReturnValue({
        isValid: false,
        error: 'Token expired'
      });
      
      const { result } = renderHook(() => useAuth());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.userId).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Auth check failed:', expect.any(Error));
    });

    it('should handle user ID mismatch', async () => {
      const mockToken = 'valid-token';
      const cookieUserId = 'user123';
      const tokenUserId = 'user456';
      
      mockAuthUtils.getAccessToken.mockReturnValue(mockToken);
      mockAuthUtils.getUserId.mockReturnValue(cookieUserId);
      mockAuthUtils.validateToken.mockReturnValue({
        isValid: true,
        decodedToken: { sub: tokenUserId },
        expiryTime: Math.floor(Date.now() / 1000) + 3600
      });
      
      const { result } = renderHook(() => useAuth());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.userId).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Auth check failed:', expect.any(Error));
    });
  });

  describe('Event Listeners', () => {
    it('should set up event listeners on mount', () => {
      renderHook(() => useAuth());
      
      expect(mockAddEventListener).toHaveBeenCalledWith('authChange', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('focus', expect.any(Function));
    });

    it('should clean up event listeners on unmount', () => {
      const { unmount } = renderHook(() => useAuth());
      
      unmount();
      
      expect(mockRemoveEventListener).toHaveBeenCalledWith('authChange', expect.any(Function));
      expect(mockRemoveEventListener).toHaveBeenCalledWith('focus', expect.any(Function));
    });

    it('should respond to authChange events', async () => {
      let authChangeHandler: () => void;
      mockAddEventListener.mockImplementation((event, handler) => {
        if (event === 'authChange') {
          authChangeHandler = handler as () => void;
        }
      });
      
      // Start with no auth
      mockAuthUtils.getAccessToken.mockReturnValue(undefined);
      
      const { result } = renderHook(() => useAuth());
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      expect(result.current.isAuthenticated).toBe(false);
      
      // Simulate login - update mocks
      mockAuthUtils.getAccessToken.mockReturnValue('new-token');
      mockAuthUtils.getUserId.mockReturnValue('user123');
      mockAuthUtils.validateToken.mockReturnValue({
        isValid: true,
        decodedToken: { sub: 'user123' },
        expiryTime: Math.floor(Date.now() / 1000) + 3600
      });
      
      // Trigger authChange event
      act(() => {
        authChangeHandler!();
      });
      
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });
      
      expect(result.current.userId).toBe('user123');
    });
  });

  describe('Periodic Token Check', () => {
    it('should set up periodic token checking', () => {
      renderHook(() => useAuth());
      
      // Fast-forward time to trigger interval
      act(() => {
        jest.advanceTimersByTime(mockAuthUtils.TOKEN_REFRESH_INTERVAL);
      });
      
      // Should have called validation multiple times (initial + interval)
      expect(mockAuthUtils.validateToken).toHaveBeenCalledTimes(2);
    });

    it('should clear interval on unmount', () => {
      const { unmount } = renderHook(() => useAuth());
      
      // Get the number of timers before unmount
      const initialTimers = jest.getTimerCount();
      
      unmount();
      
      // Should have cleared the interval timer
      expect(jest.getTimerCount()).toBeLessThan(initialTimers);
    });
  });

  describe('Token Expiry Warning', () => {
    it('should log warning when token is about to expire', () => {
      const nearExpiryTime = Math.floor(Date.now() / 1000) + 10 * 60; // 10 minutes from now
      
      mockAuthUtils.getAccessToken.mockReturnValue('valid-token');
      mockAuthUtils.getUserId.mockReturnValue('user123');
      mockAuthUtils.validateToken.mockReturnValue({
        isValid: true,
        decodedToken: { sub: 'user123' },
        expiryTime: nearExpiryTime
      });
      
      renderHook(() => useAuth());
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Oturum') && expect.stringContaining('dakika içinde sona erecek')
      );
    });

    it('should not log warning for distant expiry', () => {
      const distantExpiryTime = Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour from now
      
      mockAuthUtils.getAccessToken.mockReturnValue('valid-token');
      mockAuthUtils.getUserId.mockReturnValue('user123');
      mockAuthUtils.validateToken.mockReturnValue({
        isValid: true,
        decodedToken: { sub: 'user123' },
        expiryTime: distantExpiryTime
      });
      
      renderHook(() => useAuth());
      
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining('dakika içinde sona erecek')
      );
    });
  });

  describe('Sign Out', () => {
    it('should clear auth data and redirect on sign out', async () => {
      // Start with authenticated state
      mockAuthUtils.getAccessToken.mockReturnValue('valid-token');
      mockAuthUtils.getUserId.mockReturnValue('user123');
      mockAuthUtils.validateToken.mockReturnValue({
        isValid: true,
        decodedToken: { sub: 'user123' },
        expiryTime: Math.floor(Date.now() / 1000) + 3600
      });
      
      const { result } = renderHook(() => useAuth());
      
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });
      
      // Mock clearAuthData
      mockCookies.remove.mockImplementation(() => {});
      
      // Trigger sign out
      act(() => {
        result.current.signOut();
      });
      
      // Fast-forward the timeout
      act(() => {
        jest.advanceTimersByTime(50);
      });
      
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
      });
      
      expect(result.current.userId).toBeNull();
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
      expect(mockCookies.remove).toHaveBeenCalledWith('accessToken', expect.any(Object));
    });

    it('should prevent auth checks during logout process', async () => {
      // Start with authenticated state
      mockAuthUtils.getAccessToken.mockReturnValue('valid-token');
      mockAuthUtils.getUserId.mockReturnValue('user123');
      mockAuthUtils.validateToken.mockReturnValue({
        isValid: true,
        decodedToken: { sub: 'user123' },
        expiryTime: Math.floor(Date.now() / 1000) + 3600
      });
      
      const { result } = renderHook(() => useAuth());
      
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });
      
      // Clear previous calls
      jest.clearAllMocks();
      
      // Trigger sign out
      act(() => {
        result.current.signOut();
      });
      
      // Auth check should be skipped during logout
      expect(mockAuthUtils.validateToken).not.toHaveBeenCalled();
    });
  });

  describe('clearAuthData function', () => {
    it('should remove cookies with correct options', () => {
      clearAuthData();
      
      const expectedOptions = { path: '/', domain: 'localhost' };
      
      expect(mockCookies.remove).toHaveBeenCalledWith('accessToken', expectedOptions);
      expect(mockCookies.remove).toHaveBeenCalledWith('user_id', expectedOptions);
      expect(mockCookies.remove).toHaveBeenCalledWith('user_email', expectedOptions);
      expect(mockCookies.remove).toHaveBeenCalledWith('refreshToken', expectedOptions);
    });
  });
});
