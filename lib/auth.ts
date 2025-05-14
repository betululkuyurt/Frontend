/**
 * Auth Yardımcı Fonksiyonları (Authentication Utility Functions)
 * 
 * Bu modül kimlik doğrulama ile ilgili tüm temel işlevleri içerir:
 * - Token yönetimi (set, get, validate)
 * - Oturum durumu kontrolü
 * - JWT çözümleme ve doğrulama
 * - Çerez (cookie) yönetimi
 * 
 * Diğer bileşenler ve hook'lar tarafından kullanılır.
 * useAuth.ts hook'u bu modüldeki fonksiyonların React entegrasyonunu sağlar.
 */
import Cookies from "js-cookie"

// Token yenilemesi için gecikme süresi - 5 dakika
export const TOKEN_REFRESH_INTERVAL = 5 * 60 * 1000;
// Token geçerlilik süresi bitimine kalan süre için eşik değeri - 15 dakika
export const TOKEN_EXPIRY_THRESHOLD = 15 * 60;

export function setAuthTokens(accessToken: string, refreshToken?: string, userId?: string, email?: string) {
  Cookies.set("accessToken", accessToken, { secure: true, sameSite: "Strict" })
  if (refreshToken) {
    Cookies.set("refreshToken", refreshToken, { secure: true, sameSite: "Strict" })
  }
  if (userId) {
    Cookies.set("user_id", userId, { secure: true, sameSite: "Strict" })
  }
  if (email) {
    Cookies.set("user_email", email, { secure: true, sameSite: "Strict" })
  }

  // Dispatch event to notify components about auth change
  window.dispatchEvent(new Event("authChange"))
}

export function clearAuthData() {
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

  // Dispatch event to notify components about auth change
  window.dispatchEvent(new Event("authChange"))
}

export function getAccessToken() {
  return Cookies.get("accessToken");
}

export const authConfig = {
  cookieName: "auth-token",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 1 hafta
  },
}

export function decodeJWT(token: string) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    return payload // İçinde user_id ve email var
  } catch (e) {
    console.error("Invalid JWT token", e)
    return null
  }
}

// Token doğrulama fonksiyonu - daha güçlü ve yeniden kullanılabilir
export function validateToken(token: string | undefined): { 
  isValid: boolean; 
  decodedToken?: any; 
  error?: string;
  expiryTime?: number;
} {
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
}


// Add or export the refreshAccessToken function if missing
export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string, expiryTime: number }> {
  // implementation here
  // Example:
  // const response = await fetch('/api/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) });
  // const data = await response.json();
  // return { accessToken: data.accessToken, expiryTime: data.expiryTime };
  throw new Error("refreshAccessToken not implemented");
}
export function getUserId() {
  // First try to get from cookie directly
  const userId = Cookies.get("user_id")
  if (userId) return userId

  // If not found, try to extract from token
  const token = getAccessToken()
  if (!token) return null

  try {
    const decoded = decodeJWT(token)
    return decoded?.sub || null
  } catch (e) {
    console.error("Failed to decode token", e)
    return null
  }
}

export const logout = () => {
  clearAuthData()
}

export const isAuthenticated = () => {
  if (typeof window === "undefined") return false
  
  const token = getAccessToken();
  if (!token) return false;
  
  const validation = validateToken(token);
  return validation.isValid;
}

