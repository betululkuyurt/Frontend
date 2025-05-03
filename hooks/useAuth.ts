"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { decodeJWT } from "@/lib/auth"

// Token yenilemesi için gecikme süresi - 5 dakika
const TOKEN_REFRESH_INTERVAL = 5 * 60 * 1000;
// Token geçerlilik süresi bitimine kalan süre için eşik değeri - 10 dakika
const TOKEN_EXPIRY_THRESHOLD = 10 * 60;

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [tokenExpiryTime, setTokenExpiryTime] = useState<number | null>(null)
  const router = useRouter()

  // Token doğrulama fonksiyonu - daha güçlü ve yeniden kullanılabilir
  const validateToken = useCallback((token: string | undefined): { 
    isValid: boolean; 
    decodedToken?: any; 
    error?: string;
    expiryTime?: number;
  } => {
    try {
      // Token yoksa geçersiz
      if (!token) {
        return { isValid: false, error: "No token found" };
      }

      // JWT formatı kontrolü (basit)
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        return { isValid: false, error: "Invalid JWT format" };
      }

      // Token decode
      const decodedToken = decodeJWT(token);
      
      // Decode başarısız olduysa geçersiz
      if (!decodedToken) {
        return { isValid: false, error: "Failed to decode token" };
      }
      
      // Önemli alanlar eksikse geçersiz
      if (!decodedToken.sub || !decodedToken.email) {
        return { isValid: false, error: "Token missing required fields" };
      }
      
      // Token süresi kontrolü
      const currentTime = Math.floor(Date.now() / 1000);
      
      // exp değeri yoksa veya geçmişse geçersiz
      if (!decodedToken.exp) {
        return { isValid: false, error: "Token missing expiry" };
      }
      
      if (decodedToken.exp < currentTime) {
        return { 
          isValid: false, 
          error: "Token expired", 
          decodedToken,
          expiryTime: decodedToken.exp
        };
      }
      
      // Tüm kontrollerden geçtiyse token geçerli
      return { 
        isValid: true, 
        decodedToken,
        expiryTime: decodedToken.exp
      };
    } catch (error) {
      console.error("Token validation error:", error);
      return { isValid: false, error: "Token validation error" };
    }
  }, []);

  // Token bitimine yakın olduğunda yenileme kontrolü
  useEffect(() => {
    if (tokenExpiryTime) {
      const currentTime = Math.floor(Date.now() / 1000);
      const timeToExpiry = tokenExpiryTime - currentTime;
      
      // Token bitimine 10 dakikadan az kaldıysa yenileme girişimi yap
      if (timeToExpiry < TOKEN_EXPIRY_THRESHOLD && timeToExpiry > 0) {
        console.log("Token should be refreshed soon");
        // Burada token yenileme API'si çağrılabilir (varsa)
        // refreshToken();
      }
    }
  }, [tokenExpiryTime]);

  const checkAuth = useCallback(() => {
    try {
      // Get token from cookies (primary source)
      const cookieToken = Cookies.get("accessToken")
      const cookieUserId = Cookies.get("user_id")

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
      
      // Clean up any invalid auth data
      clearAuthData();
    } finally {
      setIsLoading(false);
    }
  }, [validateToken]);

  // Periyodik token kontrolü ve authChange olayına abone ol
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const setupPeriodicCheck = () => {
      // İlk kontrol
      checkAuth();
      
      // Periyodik kontrol (5 dakikada bir)
      intervalId = setInterval(() => {
        checkAuth();
      }, TOKEN_REFRESH_INTERVAL);
    };

    setupPeriodicCheck();
    
    // Event listener'lar
    window.addEventListener("authChange", checkAuth);
    window.addEventListener("focus", checkAuth); // Sekme tekrar aktif olduğunda kontrol et
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener("authChange", checkAuth);
      window.removeEventListener("focus", checkAuth);
    };
  }, [checkAuth]);

  const clearAuthData = () => {
    // Clear cookies
    Cookies.remove("accessToken");
    Cookies.remove("user_id");
    Cookies.remove("user_email");
    Cookies.remove("refreshToken");

    // Clear localStorage - tüm olası auth verilerini temizle
    const authKeys = [
      "token", "accessToken", "userId", "userData", "user", 
      "userInfo", "auth", "authentication", "session"
    ];
    
    authKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        // localStorage erişimi olmayan ortamlarda hata önleme
        console.error(`Failed to remove ${key} from localStorage`, e);
      }
    });
  }

  const signOut = () => {
    clearAuthData();
    setIsAuthenticated(false);
    setUserId(null);
    setTokenExpiryTime(null);
    router.push("/auth/login");
  }

  return { isAuthenticated, isLoading, signOut, userId };
}
