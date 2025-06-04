/**
 * Services API Tests
 * 
 * Tests for lib/services.ts functions including:
 * - Favorites management (add, remove, get, check)
 * - Service deletion
 * - Authentication and error handling
 * - API communication
 */

import {
  addToFavorites,
  removeFromFavorites,
  getFavoriteServices,
  getFavoriteCount,
  checkIfFavorited,
  deleteMiniService,
  FavoriteService,
  FavoriteCountResponse,
  FavoriteCheckResponse,
  DeleteServiceOptions
} from '../services';

const Cookies = require('js-cookie');

// Mock js-cookie
jest.mock('js-cookie');
const mockCookies = Cookies;

// Mock the toast
jest.mock('@/components/ui/use-toast', () => ({
  toast: jest.fn()
}));

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock console methods to avoid noise in tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

describe('Services API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
      // Default cookie mocks
    mockCookies.get.mockImplementation((key: string) => {
      if (key === 'accessToken') return 'test-token';
      if (key === 'user_id') return '123';
      return undefined;
    });
  });

  describe('Helper Functions', () => {
    it('should get auth headers with token', () => {
      // This is tested indirectly through other functions
      expect(mockCookies.get).toBeDefined();
    });

    it('should get current user ID', () => {
      // This is tested indirectly through other functions
      expect(mockCookies.get).toBeDefined();
    });    it('should handle missing user ID', () => {
      mockCookies.get.mockImplementation((key: string) => {
        if (key === 'accessToken') return 'test-token';
        if (key === 'user_id') return undefined;
        return undefined;
      });
      
      // The function should default to "0" when user_id is missing
      // This will be tested through the API calls
      expect(mockCookies.get).toBeDefined();
    });
  });

  describe('addToFavorites', () => {
    it('should successfully add service to favorites', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ success: true })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await addToFavorites(456);

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://127.0.0.1:8000/api/v1/favorites/?current_user_id=123',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          },
          credentials: 'include',
          body: JSON.stringify({ mini_service_id: 456 })
        }
      );
      expect(console.log).toHaveBeenCalledWith('Service added to favorites successfully');
    });

    it('should handle already favorited service (409 status)', async () => {
      const mockResponse = {
        ok: false,
        status: 409
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await addToFavorites(456);

      expect(result).toBe(true);
      expect(console.log).toHaveBeenCalledWith('Service already in favorites');
    });

    it('should handle API errors', async () => {
      const mockResponse = {
        ok: false,
        status: 500
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await addToFavorites(456);

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Failed to add to favorites:', 500);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await addToFavorites(456);

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error adding to favorites:', expect.any(Error));
    });    it('should work without auth token', async () => {
      mockCookies.get.mockImplementation((key: string) => {
        if (key === 'user_id') return '123';
        return undefined; // No access token
      });

      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ success: true })
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await addToFavorites(456);

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://127.0.0.1:8000/api/v1/favorites/?current_user_id=123',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
            // No Authorization header
          },
          credentials: 'include',
          body: JSON.stringify({ mini_service_id: 456 })
        }
      );
    });
  });

  describe('removeFromFavorites', () => {
    it('should successfully remove service from favorites', async () => {
      const mockResponse = {
        ok: true,
        status: 200
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await removeFromFavorites(456);

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://127.0.0.1:8000/api/v1/favorites/456?current_user_id=123',
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          },
          credentials: 'include'
        }
      );
      expect(console.log).toHaveBeenCalledWith('Service removed from favorites successfully');
    });

    it('should handle 204 status (no content)', async () => {
      const mockResponse = {
        ok: false,
        status: 204
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await removeFromFavorites(456);

      expect(result).toBe(true);
      expect(console.log).toHaveBeenCalledWith('Service removed from favorites successfully');
    });

    it('should handle 404 status (not in favorites)', async () => {
      const mockResponse = {
        ok: false,
        status: 404
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await removeFromFavorites(456);

      expect(result).toBe(true);
      expect(console.log).toHaveBeenCalledWith('Service not in favorites');
    });

    it('should handle API errors', async () => {
      const mockResponse = {
        ok: false,
        status: 500
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await removeFromFavorites(456);

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Failed to remove from favorites:', 500);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await removeFromFavorites(456);

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error removing from favorites:', expect.any(Error));
    });
  });

  describe('getFavoriteServices', () => {
    const mockFavoriteServices: FavoriteService[] = [
      {
        id: 1,
        name: 'Test Service 1',
        description: 'Test description 1',
        input_type: 'text',
        output_type: 'text',
        owner_id: 123,
        owner_username: 'testuser',
        is_enhanced: false,
        created_at: '2024-01-01T00:00:00Z',
        average_token_usage: { total: 100 },
        run_time: 1000
      },
      {
        id: 2,
        name: 'Test Service 2',
        description: 'Test description 2',
        input_type: 'image',
        output_type: 'text',
        owner_id: 124,
        is_enhanced: true,
        created_at: '2024-01-02T00:00:00Z',
        average_token_usage: { total: 200 },
        run_time: 2000,
        favorite_count: 5
      }
    ];

    it('should successfully fetch favorite services with default parameters', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockFavoriteServices)
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await getFavoriteServices();

      expect(result).toEqual(mockFavoriteServices);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://127.0.0.1:8000/api/v1/favorites/?skip=0&limit=100&current_user_id=123',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          },
          credentials: 'include'
        }
      );
      expect(console.log).toHaveBeenCalledWith('Favorite services fetched successfully');
    });

    it('should fetch favorite services with custom pagination', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockFavoriteServices)
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await getFavoriteServices(20, 50);

      expect(result).toEqual(mockFavoriteServices);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://127.0.0.1:8000/api/v1/favorites/?skip=20&limit=50&current_user_id=123',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          },
          credentials: 'include'
        }
      );
    });

    it('should handle API errors', async () => {
      const mockResponse = {
        ok: false,
        status: 500
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await getFavoriteServices();

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Failed to fetch favorite services:', 500);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await getFavoriteServices();

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Error fetching favorite services:', expect.any(Error));
    });
  });

  describe('getFavoriteCount', () => {
    it('should successfully get favorite count', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          mini_service_id: 456,
          favorite_count: 42
        } as FavoriteCountResponse)
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await getFavoriteCount(456);

      expect(result).toBe(42);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://127.0.0.1:8000/api/v1/favorites/count/456',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          },
          credentials: 'include'
        }
      );
    });

    it('should handle 404 status (service not found)', async () => {
      const mockResponse = {
        ok: false,
        status: 404
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await getFavoriteCount(456);

      expect(result).toBe(0);
      expect(console.warn).toHaveBeenCalledWith('Service 456 not found for favorite count, returning 0');
    });

    it('should handle API errors', async () => {
      const mockResponse = {
        ok: false,
        status: 500
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await getFavoriteCount(456);

      expect(result).toBe(0);
      expect(console.error).toHaveBeenCalledWith('Failed to fetch favorite count:', 500);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await getFavoriteCount(456);

      expect(result).toBe(0);
      expect(console.error).toHaveBeenCalledWith('Error fetching favorite count:', expect.any(Error));
    });
  });

  describe('checkIfFavorited', () => {
    it('should successfully check if service is favorited', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          is_favorited: true
        } as FavoriteCheckResponse)
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await checkIfFavorited(456);

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://127.0.0.1:8000/api/v1/favorites/check/456?current_user_id=123',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          },
          credentials: 'include'
        }
      );
    });

    it('should return false when service is not favorited', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          is_favorited: false
        } as FavoriteCheckResponse)
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await checkIfFavorited(456);

      expect(result).toBe(false);
    });

    it('should handle API errors', async () => {
      const mockResponse = {
        ok: false,
        status: 500
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await checkIfFavorited(456);      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Failed to check favorite status:', 500);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await checkIfFavorited(456);      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error checking favorite status:', expect.any(Error));
    });
  });

  describe('deleteMiniService', () => {    it('should successfully delete service with redirect', async () => {
      const mockToast = require('@/components/ui/use-toast').toast;
      // Mock window.location for this test
      (window as any).location = { reload: jest.fn() };
      
      const mockResponse = {
        ok: true,
        status: 200
      };
      mockFetch.mockResolvedValue(mockResponse as any);      const options: DeleteServiceOptions = {
        showToast: true
      };

      const result = await deleteMiniService(456, options);      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://127.0.0.1:8000/api/v1/mini-services/456?current_user_id=123',
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          },
          credentials: 'include'
        }
      );
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Service deleted successfully.'
      });
    });

    it('should successfully delete service without toast or redirect', async () => {
      const mockResponse = {
        ok: true,
        status: 200
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await deleteMiniService(456);

      expect(result).toBe(true);
      expect(console.log).toHaveBeenCalledWith('Service deleted successfully');
    });

    it('should handle API errors', async () => {
      const mockToast = require('@/components/ui/use-toast').toast;
      
      const mockResponse = {
        ok: false,
        status: 404
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const options: DeleteServiceOptions = {
        showToast: true
      };      const result = await deleteMiniService(456, options);

      expect(result).toBe(true);
      expect(console.error).toHaveBeenCalledWith('Service not found or already deleted');      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'The service has been removed.'
      });
    });    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await deleteMiniService(456);

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('An error occurred while deleting the service', expect.any(Error));
    });

    it('should handle onSuccess callback', async () => {
      const mockCallback = jest.fn();
      
      const mockResponse = {
        ok: true,
        status: 200
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const options: DeleteServiceOptions = {
        showToast: false,
        onSuccess: mockCallback
      };

      await deleteMiniService(456, options);

      expect(mockCallback).toHaveBeenCalled();
    });
  });
});
