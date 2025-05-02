"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { decodeJWT } from "@/lib/auth"

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      try {
        // Get token from cookies (primary source)
        const cookieToken = Cookies.get("accessToken")
        const cookieUserId = Cookies.get("user_id")

        // If no token in cookies, user is not authenticated
        if (!cookieToken) {
          throw new Error("No token found")
        }

        // Validate token
        const decodedToken = decodeJWT(cookieToken)
        if (!decodedToken || !decodedToken.sub || !decodedToken.email) {
          throw new Error("Invalid token")
        }

        // Check token expiration
        const currentTime = Math.floor(Date.now() / 1000)
        if (decodedToken.exp && decodedToken.exp < currentTime) {
          throw new Error("Token expired")
        }

        // Validate user ID matches token
        if (!cookieUserId || decodedToken.sub !== cookieUserId) {
          throw new Error("User ID mismatch")
        }

        setIsAuthenticated(true)
        setUserId(cookieUserId)
      } catch (error) {
        console.error("Auth check failed:", error)
        setIsAuthenticated(false)
        setUserId(null)
        
        // Clean up any invalid auth data
        clearAuthData()
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
    window.addEventListener("authChange", checkAuth)
    return () => window.removeEventListener("authChange", checkAuth)
  }, [router])

  const clearAuthData = () => {
    // Clear cookies
    Cookies.remove("accessToken")
    Cookies.remove("user_id")
    Cookies.remove("user_email")

    // Clear localStorage
    localStorage.removeItem("token")
    localStorage.removeItem("accessToken")
    localStorage.removeItem("userId")
    localStorage.removeItem("userData")
    localStorage.removeItem("user")
    localStorage.removeItem("userInfo")
  }

  const signOut = () => {
    clearAuthData()
    setIsAuthenticated(false)
    setUserId(null)
    router.push("/auth/login")
  }

  return { isAuthenticated, isLoading, signOut, userId }
}
