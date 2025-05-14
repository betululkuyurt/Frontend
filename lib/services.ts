import Cookies from "js-cookie"
import { toast } from "@/components/ui/use-toast"

export interface DeleteServiceOptions {
  showToast?: boolean;
  onSuccess?: () => void;
  toastTitle?: string;
  toastMessage?: string;
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