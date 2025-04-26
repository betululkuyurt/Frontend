import Cookies from "js-cookie"

export function setAuthTokens(accessToken: string, refreshToken?: string) {
  Cookies.set("accessToken", accessToken, { secure: true, sameSite: "Strict" })
  if (refreshToken) {
    Cookies.set("refreshToken", refreshToken, { secure: true, sameSite: "Strict" })
  }

  // Dispatch event to notify components about auth change
  window.dispatchEvent(new Event("authChange"))
}

export function clearAuthTokens() {
  Cookies.remove("accessToken")
  Cookies.remove("refreshToken")
  Cookies.remove("user_id")
  Cookies.remove("user_email")

  // Dispatch event to notify components about auth change
  window.dispatchEvent(new Event("authChange"))
}

export function getAccessToken() {
  return Cookies.get("accessToken")
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
  clearAuthTokens()
  console.log("✅ User has logged out (Cookies cleared)")
}

export const isAuth = () => {
  if (typeof window === "undefined") return false
  return !!Cookies.get("accessToken")
}

