"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      // Check localStorage
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken")

      // Check cookies as fallback
      const cookieToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("accessToken="))
        ?.split("=")[1]

      if (token || cookieToken) {
        setIsAuthenticated(true)

        // Get user ID from localStorage
        const storedUserId = localStorage.getItem("userId")
        setUserId(storedUserId)
      } else {
        setIsAuthenticated(false)
        setUserId(null)
      }

      setIsLoading(false)
    }

    checkAuth()
    window.addEventListener("authChange", checkAuth)
    return () => window.removeEventListener("authChange", checkAuth)
  }, [])

  const signOut = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("accessToken")
    localStorage.removeItem("userId")

    // Clear cookies
    document.cookie = "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"

    setIsAuthenticated(false)
    setUserId(null)
    router.push("/auth/login")
  }

  return { isAuthenticated, isLoading, signOut, userId }
}
