/**
 * Authentication Utilities Tests
 * 
 * Tests for lib/auth.ts functions including:
 * - Token management (set, get, validate)
 * - Session state control
 * - JWT parsing and validation
 * - Cookie management
 */

const Cookies = require('js-cookie');
import {
  setAuthTokens,
  clearAuthData,
  getAccessToken,
  decodeJWT,
  validateToken,
  getUserId,
  logout,
  isAuthenticated,
  TOKEN_REFRESH_INTERVAL,
  TOKEN_EXPIRY_THRESHOLD,
  authConfig
} from '../auth';

// Mock js-cookie
jest.mock('js-cookie');
const mockCookies = Cookies as jest.Mocked<typeof Cookies>;

// Mock window.dispatchEvent
const mockDispatchEvent = jest.fn();
Object.defineProperty(window, 'dispatchEvent', {
  value: mockDispatchEvent,
  writable: true
});

// Mock localStorage
const localStorageMock = {
  removeItem: jest.fn(),
  setItem: jest.fn(),
  getItem: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('Authentication Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatchEvent.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  describe('Constants', () => {
    it('should have correct token refresh interval', () => {
      expect(TOKEN_REFRESH_INTERVAL).toBe(5 * 60 * 1000); // 5 minutes
    });

    it('should have correct token expiry threshold', () => {
      expect(TOKEN_EXPIRY_THRESHOLD).toBe(15 * 60); // 15 minutes
    });

    it('should have correct auth config', () => {
      expect(authConfig).toEqual({
        cookieName: "auth-token",
        cookieOptions: {
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60, // 1 week
        },
      });
    });
  });

  describe('setAuthTokens', () => {
    it('should set access token cookie', () => {
      const accessToken = 'test-access-token';
      
      setAuthTokens(accessToken);
      
      expect(mockCookies.set).toHaveBeenCalledWith(
        'accessToken',
        accessToken,
        { secure: true, sameSite: 'Strict' }
      );
      expect(mockDispatchEvent).toHaveBeenCalledWith(new Event('authChange'));
    });

    it('should set all tokens and user data when provided', () => {
      const accessToken = 'test-access-token';
      const refreshToken = 'test-refresh-token';
      const userId = 'test-user-id';
      const email = 'test@example.com';
      
      setAuthTokens(accessToken, refreshToken, userId, email);
      
      expect(mockCookies.set).toHaveBeenCalledWith(
        'accessToken',
        accessToken,
        { secure: true, sameSite: 'Strict' }
      );
      expect(mockCookies.set).toHaveBeenCalledWith(
        'refreshToken',
        refreshToken,
        { secure: true, sameSite: 'Strict' }
      );
      expect(mockCookies.set).toHaveBeenCalledWith(
        'user_id',
        userId,
        { secure: true, sameSite: 'Strict' }
      );
      expect(mockCookies.set).toHaveBeenCalledWith(
        'user_email',
        email,
        { secure: true, sameSite: 'Strict' }
      );
      expect(mockDispatchEvent).toHaveBeenCalledWith(new Event('authChange'));
    });

    it('should only set access token when other parameters are not provided', () => {
      const accessToken = 'test-access-token';
      
      setAuthTokens(accessToken);
      
      expect(mockCookies.set).toHaveBeenCalledTimes(1);
      expect(mockCookies.set).toHaveBeenCalledWith(
        'accessToken',
        accessToken,
        { secure: true, sameSite: 'Strict' }
      );
    });
  });

  describe('clearAuthData', () => {
    it('should remove all auth cookies', () => {
      clearAuthData();
      
      expect(mockCookies.remove).toHaveBeenCalledWith('accessToken');
      expect(mockCookies.remove).toHaveBeenCalledWith('user_id');
      expect(mockCookies.remove).toHaveBeenCalledWith('user_email');
      expect(mockCookies.remove).toHaveBeenCalledWith('refreshToken');
    });

    it('should clear all auth-related localStorage items', () => {
      clearAuthData();
      
      const expectedKeys = [
        'token', 'accessToken', 'userId', 'userData', 'user', 
        'userInfo', 'auth', 'authentication', 'session'
      ];
      
      expectedKeys.forEach(key => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith(key);
      });
    });

    it('should dispatch authChange event', () => {
      clearAuthData();
      
      expect(mockDispatchEvent).toHaveBeenCalledWith(new Event('authChange'));
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });
      
      expect(() => clearAuthData()).not.toThrow();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getAccessToken', () => {
    it('should return access token from cookies', () => {
      const token = 'test-token';
      mockCookies.get.mockReturnValue(token);
      
      const result = getAccessToken();
      
      expect(result).toBe(token);
      expect(mockCookies.get).toHaveBeenCalledWith('accessToken');
    });

    it('should return undefined when no token exists', () => {
      mockCookies.get.mockReturnValue(undefined);
      
      const result = getAccessToken();
      
      expect(result).toBeUndefined();
    });
  });

  describe('decodeJWT', () => {
    it('should decode valid JWT token', () => {
      // Create a mock JWT payload
      const payload = { sub: 'user123', email: 'test@example.com', exp: 1234567890 };
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `header.${encodedPayload}.signature`;
      
      const result = decodeJWT(token);
      
      expect(result).toEqual(payload);
    });

    it('should return null for invalid JWT format', () => {
      const invalidToken = 'invalid-token';
      
      const result = decodeJWT(invalidToken);
      
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Invalid JWT token', expect.any(Error));
    });

    it('should return null for malformed JWT payload', () => {
      const token = 'header.invalid-base64.signature';
      
      const result = decodeJWT(token);
      
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Invalid JWT token', expect.any(Error));
    });
  });

  describe('validateToken', () => {
    const createValidToken = (exp?: number) => {
      const payload = {
        sub: 'user123',
        email: 'test@example.com',
        exp: exp || Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      };
      const encodedPayload = btoa(JSON.stringify(payload));
      return `header.${encodedPayload}.signature`;
    };

    it('should return valid for properly formatted and unexpired token', () => {
      const token = createValidToken();
      
      const result = validateToken(token);
      
      expect(result.isValid).toBe(true);
      expect(result.decodedToken).toBeDefined();
      expect(result.decodedToken.sub).toBe('user123');
      expect(result.decodedToken.email).toBe('test@example.com');
      expect(result.expiryTime).toBeDefined();
    });

    it('should return invalid when token is undefined', () => {
      const result = validateToken(undefined);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('No token found');
    });

    it('should return invalid for incorrect JWT format', () => {
      const invalidToken = 'invalid.format';
      
      const result = validateToken(invalidToken);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid JWT format');
    });

    it('should return invalid when token fails to decode', () => {
      const token = 'header.invalid-base64.signature';
      
      const result = validateToken(token);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Failed to decode token');
    });

    it('should return invalid when token missing required fields', () => {
      const payload = { exp: Math.floor(Date.now() / 1000) + 3600 }; // Missing sub and email
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `header.${encodedPayload}.signature`;
      
      const result = validateToken(token);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Token missing required fields');
    });

    it('should return invalid when token missing expiry', () => {
      const payload = { sub: 'user123', email: 'test@example.com' }; // Missing exp
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `header.${encodedPayload}.signature`;
      
      const result = validateToken(token);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Token missing expiry');
    });

    it('should return invalid when token is expired', () => {
      const expiredTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const token = createValidToken(expiredTime);
      
      const result = validateToken(token);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Token expired');
      expect(result.decodedToken).toBeDefined();
      expect(result.expiryTime).toBe(expiredTime);
    });
  });

  describe('getUserId', () => {
    it('should return user ID from cookies when available', () => {
      const userId = 'user123';
      mockCookies.get.mockImplementation((key) => {
        if (key === 'user_id') return userId;
        return undefined;
      });
      
      const result = getUserId();
      
      expect(result).toBe(userId);
      expect(mockCookies.get).toHaveBeenCalledWith('user_id');
    });

    it('should extract user ID from token when not in cookies', () => {
      const userId = 'user123';
      const payload = { sub: userId, email: 'test@example.com', exp: 1234567890 };
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `header.${encodedPayload}.signature`;
      
      mockCookies.get.mockImplementation((key) => {
        if (key === 'user_id') return undefined;
        if (key === 'accessToken') return token;
        return undefined;
      });
      
      const result = getUserId();
      
      expect(result).toBe(userId);
    });

    it('should return null when no user ID or token available', () => {
      mockCookies.get.mockReturnValue(undefined);
      
      const result = getUserId();
      
      expect(result).toBeNull();
    });    it('should return null when token decode fails', () => {
      mockCookies.get.mockImplementation((key) => {
        if (key === 'user_id') return undefined;
        if (key === 'accessToken') return 'invalid-token';
        return undefined;
      });
      
      const result = getUserId();
      
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Invalid JWT token', expect.any(Error));
    });
  });

  describe('logout', () => {
    it('should call clearAuthData', () => {
      // Spy on clearAuthData
      const clearAuthDataSpy = jest.fn();
      jest.doMock('../auth', () => ({
        ...jest.requireActual('../auth'),
        clearAuthData: clearAuthDataSpy
      }));
      
      logout();
      
      // Since we're testing the actual function, it should call the mocked clearAuthData behavior
      expect(mockCookies.remove).toHaveBeenCalledWith('accessToken');
      expect(mockDispatchEvent).toHaveBeenCalledWith(new Event('authChange'));
    });
  });

  describe('isAuthenticated', () => {
    it('should return false in server-side environment', () => {
      // Mock typeof window === "undefined"
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;
      
      const result = isAuthenticated();
      
      expect(result).toBe(false);
      
      // Restore window
      global.window = originalWindow;
    });

    it('should return false when no token exists', () => {
      mockCookies.get.mockReturnValue(undefined);
      
      const result = isAuthenticated();
      
      expect(result).toBe(false);
    });

    it('should return false when token is invalid', () => {
      mockCookies.get.mockReturnValue('invalid-token');
      
      const result = isAuthenticated();
      
      expect(result).toBe(false);
    });

    it('should return true when token is valid', () => {
      const payload = {
        sub: 'user123',
        email: 'test@example.com',
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      const encodedPayload = btoa(JSON.stringify(payload));
      const token = `header.${encodedPayload}.signature`;
      
      mockCookies.get.mockReturnValue(token);
      
      const result = isAuthenticated();
      
      expect(result).toBe(true);
    });
  });
});
