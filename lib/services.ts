import Cookies from "js-cookie"
import { toast } from "@/components/ui/use-toast"

export interface DeleteServiceOptions {
  showToast?: boolean;
  onSuccess?: () => void;
  toastTitle?: string;
  toastMessage?: string;
}

// Favorites-related interfaces
export interface FavoriteService {
  id: number;
  name: string;
  description: string;
  input_type: string;
  output_type: string;
  owner_username: string;
  is_enhanced: boolean;
  created_at: string;
  average_token_usage: any;
  run_time: number;
}

export interface FavoriteCountResponse {
  mini_service_id: number;
  favorite_count: number;
}

export interface FavoriteCheckResponse {
  is_favorited: boolean;
}

// Helper function to get auth headers
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  const token = Cookies.get("accessToken");
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

// Helper function to get current user ID
function getCurrentUserId(): string {
  return Cookies.get("user_id") || "0";
}

/**
 * Add a mini service to favorites
 * POST /api/v1/favorites/
 */
export async function addToFavorites(miniServiceId: number): Promise<boolean> {
  try {
    const currentUserId = getCurrentUserId();
    
    
    const response = await fetch(`http://127.0.0.1:8000/api/v1/favorites/?current_user_id=${currentUserId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({
        mini_service_id: miniServiceId
      })
    });
    
    
    
    if (response.ok) {
      console.log('Service added to favorites successfully');
      return true;
    }
    
    if (response.status === 409) {
      // Already favorited
      console.log('Service already in favorites');
      return true;
    }
    
    console.error('Failed to add to favorites:', response.status);
    return false;
  } catch (error) {
    console.error('Error adding to favorites:', error);
    return false;
  }
}

/**
 * Remove a mini service from favorites
 * DELETE /api/v1/favorites/{mini_service_id}
 */
export async function removeFromFavorites(miniServiceId: number): Promise<boolean> {
  try {
    const currentUserId = getCurrentUserId();
    
    
    const response = await fetch(`http://127.0.0.1:8000/api/v1/favorites/${miniServiceId}?current_user_id=${currentUserId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    
   
    
    if (response.ok || response.status === 204) {
      console.log('Service removed from favorites successfully');
      return true;
    }
    
    if (response.status === 404) {
      // Not in favorites, but consider it successful
      console.log('Service not in favorites');
      return true;
    }
    
    console.error('Failed to remove from favorites:', response.status);
    return false;
  } catch (error) {
    console.error('Error removing from favorites:', error);
    return false;
  }
}

/**
 * Get user's favorite mini services
 * GET /api/v1/favorites/?skip=0&limit=100
 */
export async function getFavoriteServices(skip: number = 0, limit: number = 100): Promise<FavoriteService[]> {
  try {
    const currentUserId = getCurrentUserId();
    
    const response = await fetch(`http://127.0.0.1:8000/api/v1/favorites/?skip=${skip}&limit=${limit}&current_user_id=${currentUserId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Favorite services fetched successfully');
      return data;
    }
    
    console.error('Failed to fetch favorite services:', response.status);
    return [];
  } catch (error) {
    console.error('Error fetching favorite services:', error);
    return [];
  }
}

/**
 * Get favorite count for a service (how many users favorited it)
 * GET /api/v1/favorites/count/{mini_service_id}
 */
export async function getFavoriteCount(miniServiceId: number): Promise<number> {
  try {
    
    
    const response = await fetch(`http://127.0.0.1:8000/api/v1/favorites/count/${miniServiceId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    
   
    
    if (response.ok) {
      const data: FavoriteCountResponse = await response.json();
      
      return data.favorite_count;
    }
    
    // Handle 404 - service not found, return 0 instead of failing
    if (response.status === 404) {
      console.warn(`Service ${miniServiceId} not found for favorite count, returning 0`);
      return 0;
    }
    
    console.error('Failed to fetch favorite count:', response.status);
    return 0;
  } catch (error) {
    console.error('Error fetching favorite count:', error);
    return 0;
  }
}

/**
 * Check if current user has favorited a service
 * GET /api/v1/favorites/check/{mini_service_id}
 */
export async function checkIfFavorited(miniServiceId: number): Promise<boolean> {
  try {
    const currentUserId = getCurrentUserId();
    
    
    const response = await fetch(`http://127.0.0.1:8000/api/v1/favorites/check/${miniServiceId}?current_user_id=${currentUserId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    
    
    
    if (response.ok) {
      const data: FavoriteCheckResponse = await response.json();
      
      return data.is_favorited;
    }
    
    // Handle 404 - service not found, return false instead of failing
    if (response.status === 404) {
      console.warn(`Service ${miniServiceId} not found for favorite check, returning false`);
      return false;
    }
    
    console.error('Failed to check favorite status:', response.status);
    return false;
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return false;
  }
}

/**
 * Toggle favorite status for a mini service
 * This combines check, add, and remove operations
 */
export async function toggleFavorite(miniServiceId: number): Promise<{ isFavorited: boolean; success: boolean }> {
  try {
    // First check current status
    const currentlyFavorited = await checkIfFavorited(miniServiceId);
    
    let success: boolean;
    if (currentlyFavorited) {
      // Remove from favorites
      success = await removeFromFavorites(miniServiceId);
    } else {
      // Add to favorites
      success = await addToFavorites(miniServiceId);
    }
    
    return {
      isFavorited: success ? !currentlyFavorited : currentlyFavorited,
      success
    };
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return { isFavorited: false, success: false };
  }
}

/**
 * Merkezi mini servis silme fonksiyonu
 * 
 * @param service_id - Silinecek servisin ID'si
 * @param options - Opsiyonel ayarlar (toast mesajları, başarı callback'i)
 * @returns Promise<boolean> - Silme işlemi başarılı ise true
 */
export async function deleteMiniService(
  service_id: number, 
  options: DeleteServiceOptions = {}
): Promise<boolean> {
  const { 
    showToast = false, 
    onSuccess,
    toastTitle = "Success",
    toastMessage = "Service deleted successfully."
  } = options;
  
  // Daha belirgin bir log mesajı ekleyelim
  console.log(`[DELETE] Attempting to delete service with ID: ${service_id}`, new Date().toISOString());
  
  try {
    // API silme işlemi
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    const token = Cookies.get("accessToken");
    const currentUserId = Cookies.get("user_id") || "0";
                  
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`http://127.0.0.1:8000/api/v1/mini-services/${service_id}?current_user_id=${currentUserId}`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    });
    
    // Başarılı silme işlemi (204 No Content veya 200 OK)
    if (response.status === 204 || response.ok) {
      console.log('Service deleted successfully');
      
      if (showToast) {
        toast({
          title: toastTitle,
          description: toastMessage,
        });
      }
      
      if (onSuccess) {
        onSuccess();
      }
      
      return true;
    }
    
    // 404 - Not Found durumunda, servisi bulamadı ama işlem "başarılı" kabul edebiliriz
    // Çünkü silmek istediğimiz servis zaten yok
    if (response.status === 404) {
      const errorMsg = 'Service not found or already deleted';
      console.error(errorMsg);
      
      if (showToast) {
        toast({
          // Kullanıcıya başarılı gibi gösterilsin çünkü sonuç olarak servis artık yok
          title: "Success",
          description: "The service has been removed.",
        });
      }
      
      // 404 durumunda da onSuccess çağrılsın, böylece UI kendini güncelleyebilir
      if (onSuccess) {
        onSuccess();
      }
      
      return true; // 404 durumunda bile true dönelim çünkü amaç servisi kaldırmaktı
    }
    
    // 401 - Unauthorized durumu
    if (response.status === 401) {
      const errorMsg = 'Authentication failed. Please log in again.';
      console.error(errorMsg);
      
      if (showToast) {
        toast({
          variant: "destructive",
          title: "Error",
          description: errorMsg,
        });
      }
      
      return false;
    }
    
    // 403 - Forbidden durumu
    if (response.status === 403) {
      const errorMsg = 'Not authorized to delete this service';
      console.error(errorMsg);
      
      if (showToast) {
        toast({
          variant: "destructive",
          title: "Error",
          description: errorMsg,
        });
      }
      
      return false;
    }
    
    // Diğer hatalar
    let errorMsg = 'Service deletion failed.';
    console.error(`Delete service failed with status ${response.status}`);
    
    if (showToast) {
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMsg,
      });
    }
    
    return false;
  } catch (error) {
    // Ağ hatası veya diğer hatalar
    const errorMsg = 'An error occurred while deleting the service';
    console.error(errorMsg, error);
    
    if (showToast) {
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMsg,
      });
    }
    
    return false;
  }
}