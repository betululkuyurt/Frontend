/**
 * React Authentication Hook (React Kimlik Doğrulama Hook'u)
 * 
 * Bu hook, auth.ts'deki temel kimlik doğrulama işlevlerini React bileşenlerinde
 * kullanılabilir hale getirir. Sağladığı işlevler:
 * 
 * - Kimlik doğrulama durumunu state olarak yönetme
 * - Token süre kontrolü ve yenileme mekanizması
 * - Otomatik oturum kontrolü (periyodik ve sayfa yüklendiğinde)
 * - Güvenli oturum kapatma
 * - UI entegrasyonu için gerekli loading state'leri
 * 
 * Bu hook, auth.ts'deki temel fonksiyonları kullanarak React tarafında
 * kimlik doğrulama mantığını yönetir.
 */
"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { 
  validateToken, 
  getUserId, 
  getAccessToken,
  TOKEN_EXPIRY_THRESHOLD,
  TOKEN_REFRESH_INTERVAL
} from "@/lib/auth"

// Auth verilerini temizleme fonksiyonu
export function clearAuthData() {
  // Cookie'leri temizle
  const cookieOptions = { path: '/', domain: window.location.hostname };
  Cookies.remove("accessToken", cookieOptions);
  Cookies.remove("user_id", cookieOptions);
  Cookies.remove("user_email", cookieOptions);
  Cookies.remove("refreshToken", cookieOptions);
  
}

export const useAuth = () => {
  // State tanımlamaları
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [tokenExpiryTime, setTokenExpiryTime] = useState<number | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false) // Çıkış yapma durumu için flag
  const router = useRouter()

  // Token bitimine yakın olduğunda yenileme kontrolü
  useEffect(() => {
    if (tokenExpiryTime) {
      const currentTime = Math.floor(Date.now() / 1000);
      const timeToExpiry = tokenExpiryTime - currentTime;
      
      // Token bitimine 10 dakikadan az kaldıysa kullanıcıyı uyar
      if (timeToExpiry < TOKEN_EXPIRY_THRESHOLD && timeToExpiry > 0) {
        console.log(`Oturum ${Math.floor(timeToExpiry / 60)} dakika içinde sona erecek`);
        // Not: Refresh token implementasyonu daha sonra eklenecek
        // Şimdilik sadece konsolda bilgilendirme yapıyoruz
      }
    }
  }, [tokenExpiryTime]);

  // Kimlik doğrulama kontrolü
  const checkAuth = useCallback(() => {
    try {
      // Çıkış yapma işlemi sırasında auth kontrolünü atla
      if (isLoggingOut) {
        setIsLoading(false);
        return;
      }
      
      // Get token from cookies
      const cookieToken = getAccessToken();
      const cookieUserId = getUserId();

      // Gelişmiş token doğrulama
      const validation = validateToken(cookieToken);
      
      if (!validation.isValid) {
        throw new Error(validation.error || "Invalid token");
      }
      
      // User ID kontrolü
      if (!cookieUserId || validation.decodedToken.sub !== cookieUserId) {
        throw new Error("User ID mismatch");
      }

      // Başarılı doğrulama durumu
      setIsAuthenticated(true);
      setUserId(cookieUserId);
      setTokenExpiryTime(validation.expiryTime || null);
    } catch (error) {
      console.error("Auth check failed:", error);
      setIsAuthenticated(false);
      setUserId(null);
      setTokenExpiryTime(null);
      
      // Clean up any invalid auth data - çıkış işlemi sırasında gereksiz temizlik yapmayı önle
      if (!isLoggingOut) {
        clearAuthData();
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoggingOut]);

  // Periyodik token kontrolü ve authChange olayına abone ol
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const setupPeriodicCheck = () => {
      // İlk kontrol
      checkAuth();
      
      // Periyodik kontrol 
      intervalId = setInterval(() => {
        checkAuth();
      }, TOKEN_REFRESH_INTERVAL);
    };

    setupPeriodicCheck();
    
    // Event listener'lar
    window.addEventListener("authChange", checkAuth);
    window.addEventListener("focus", checkAuth); 
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener("authChange", checkAuth);
      window.removeEventListener("focus", checkAuth);
    };
  }, [checkAuth]);

  // Güvenli çıkış işlemi
  const signOut = useCallback(() => {
    // Çıkış işlemi başlarken flag'i aktif et
    setIsLoggingOut(true);
    
    // Küçük bir gecikme ekleyerek event'lerin önüne geç
    setTimeout(() => {
      // Auth verilerini temizle
      clearAuthData();
      
      // State'leri temizle
      setIsAuthenticated(false);
      setUserId(null);
      setTokenExpiryTime(null);
      
      // Login sayfasına yönlendir
      router.push("/auth/login");
    }, 10);
  }, [router]);

  return { isAuthenticated, isLoading, signOut, userId };
}