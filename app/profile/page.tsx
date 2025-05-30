"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { NavBar } from "@/components/nav-bar"
import { ChevronLeft, Upload, User, Copy, Check } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { getAccessToken, decodeJWT } from "@/lib/auth"
import { useToast } from "@/components/ui/use-toast"

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [isCopied, setIsCopied] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    appsCreated: 0,
    generations: 0,
  })

  useEffect(() => {
    const fetchUserData = async () => {
      setIsFetching(true)
      try {
        // Get user email from cookie
        const userEmail = Cookies.get("user_email")
        const userId = Cookies.get("user_id")
        const token = getAccessToken()

        if (!token) {
          console.error("No access token found")
          router.push("/auth/login")
          return
        }

        // Decode JWT to get user info
        const decodedToken = token ? decodeJWT(token) : null

        if (decodedToken) {
          // Split username into first and last name if possible
          const nameParts = decodedToken.username ? decodedToken.username.split(" ") : ["", ""]

          setUserData({
            ...userData,
            email: decodedToken.email || userEmail || "",
            username: decodedToken.username || "",
            firstName: nameParts[0] || "",
            lastName: nameParts.slice(1).join(" ") || "",
            // You can add more fields here as needed
          })
        }

        // Optional: Make an API call to get more detailed user info
        // const response = await fetch(`http://127.0.0.1:8000/api/v1/users/${userId}`, {
        //   headers: {
        //     Authorization: `Bearer ${token}`
        //   }
        // })
        // const data = await response.json()
        // setUserData({...userData, ...data})
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setIsFetching(false)
      }
    }

    fetchUserData()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const token = getAccessToken()
      const userId = Cookies.get("user_id")

      if (!token || !userId) {
        throw new Error("Authentication required")
      }

      // Here you would make an API call to update the user's profile
      // const response = await fetch(`http://127.0.0.1:8000/api/v1/users/${userId}`, {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`
      //   },
      //   body: JSON.stringify({
      //     firstName: userData.firstName,
      //     lastName: userData.lastName,
      //     email: userData.email,
      //     bio: userData.bio,
      //     website: userData.website
      //   })
      // })

      // Simulate API call for now
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Show success message or handle response
      console.log("Profile updated successfully")
    } catch (error) {
      console.error("Error updating profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setUserData((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setIsCopied(true)
      toast({
        title: "Copied to clipboard",
        description: "Email address has been copied",
        duration: 2000,
      })
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
        duration: 2000,
      })
    }
  }
  if (isFetching) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-white font-medium">Loading profile...</div>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black">
      <NavBar />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header with back button */}
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push("/apps")}
              className="flex items-center text-gray-300 hover:text-white hover:bg-purple-900/20 px-3 py-2 rounded-lg transition-all duration-300"
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              Back to Apps
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
            </div>
          </div>

          <div className="grid gap-8">
            {/* Enhanced Profile Header */}
            <div className="relative overflow-hidden bg-black/60 backdrop-blur-sm rounded-2xl border border-purple-900/30 p-8">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-blue-900/10"></div>
              <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full blur-3xl"></div>
              
              <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">
                {/* Enhanced Avatar */}
                <div className="relative">
                  <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 flex items-center justify-center border-2 border-purple-400/30 shadow-2xl relative overflow-hidden">
                    {/* Avatar shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-pulse opacity-0 hover:opacity-100 transition-opacity duration-700"></div>
                    <span className="text-5xl font-bold text-white relative z-10">
                      {userData.firstName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {/* Online status indicator */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-3 border-black flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                </div>

                {/* User Info */}
                <div className="flex-grow text-center lg:text-left">
                  <h1 className="text-3xl font-bold text-white mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    {userData.username || `${userData.firstName} ${userData.lastName}`.trim()}
                  </h1>
                  <p className="text-gray-400 mb-4 max-w-md">
                    Welcome to your profile dashboard. Manage your account settings and track your activity.
                  </p>
                  <div className="flex items-center justify-center lg:justify-start space-x-2 text-sm text-gray-400">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span>Active</span>
                  </div>
                </div>

                {/* Enhanced Stats */}
                <div className="grid grid-cols-2 gap-4 min-w-[280px]">
                  <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 rounded-xl p-4 border border-purple-700/30 hover:border-purple-500/50 transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400 font-medium">Apps Created</span>
                      <div className="w-2 h-2 bg-purple-400 rounded-full group-hover:animate-pulse"></div>
                    </div>
                    <div className="text-2xl font-bold text-white">{userData.appsCreated}</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 rounded-xl p-4 border border-blue-700/30 hover:border-blue-500/50 transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400 font-medium">Generations</span>
                      <div className="w-2 h-2 bg-blue-400 rounded-full group-hover:animate-pulse"></div>
                    </div>
                    <div className="text-2xl font-bold text-white">{userData.generations}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Profile Form */}
            <div className="bg-black/60 backdrop-blur-sm rounded-2xl border border-purple-900/30 p-8 relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 via-transparent to-purple-900/10"></div>
              
              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
                    <User className="h-3 w-3 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Profile Information</h2>
                </div>
                
                <div className="grid gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="name" className="text-gray-300 font-medium">Full Name</Label>
                    <Input
                      id="name"
                      value={`${userData.firstName} ${userData.lastName}`.trim()}
                      className="bg-black/40 border-purple-900/40 text-gray-200 h-12 rounded-xl focus:border-purple-500/60 focus:ring-purple-500/20 cursor-not-allowed"
                      readOnly
                    />
                    <p className="text-xs text-gray-500">This information is managed by your authentication provider.</p>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-gray-300 font-medium">Email Address</Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        value={userData.email}
                        className="bg-black/40 border-purple-900/40 text-gray-200 h-12 rounded-xl pr-12 hover:border-purple-500/50 transition-all duration-300 cursor-pointer focus:border-purple-500/60 focus:ring-purple-500/20"
                        readOnly
                        onClick={() => copyToClipboard(userData.email)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-white hover:bg-purple-500/20 rounded-lg transition-all duration-300"
                        onClick={() => copyToClipboard(userData.email)}
                      >
                        {isCopied ? (
                          <Check className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">Click to copy your email address to clipboard.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced API Usage Section */}
            <div className="bg-black/60 backdrop-blur-sm rounded-2xl border border-purple-900/30 p-8 relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-transparent to-purple-900/10"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                      <div className="w-3 h-3 border border-white rounded-sm"></div>
                    </div>
                    <h2 className="text-xl font-semibold text-white">API Usage Statistics</h2>
                  </div>
                  <div className="text-xs text-gray-400 bg-gray-800/50 px-3 py-1 rounded-full">
                    Last updated: Now
                  </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 rounded-xl p-6 border border-purple-700/30 hover:border-purple-500/50 transition-all duration-300 group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm text-gray-400 font-medium">Total API Calls</div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full group-hover:animate-pulse"></div>
                      </div>
                      <div className="text-3xl font-bold text-white mb-2">12,543</div>
                      <div className="text-xs text-green-400">+23% from last month</div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 rounded-xl p-6 border border-blue-700/30 hover:border-blue-500/50 transition-all duration-300 group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm text-gray-400 font-medium">Active API Keys</div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full group-hover:animate-pulse"></div>
                      </div>
                      <div className="text-3xl font-bold text-white mb-2">3</div>
                      <div className="text-xs text-gray-400">2 production, 1 development</div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-800/20 rounded-xl p-6 border border-emerald-700/30 hover:border-emerald-500/50 transition-all duration-300 group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm text-gray-400 font-medium">Usage This Month</div>
                        <div className="w-2 h-2 bg-emerald-400 rounded-full group-hover:animate-pulse"></div>
                      </div>
                      <div className="text-3xl font-bold text-white mb-2">2.1GB</div>
                      <div className="text-xs text-emerald-400">67% of quota used</div>
                    </div>
                  </div>
                </div>
                
                {/* Usage chart placeholder */}
                <div className="mt-8 bg-black/40 rounded-xl p-6 border border-gray-800/50">
                  <h3 className="text-sm font-medium text-gray-300 mb-4">Monthly Usage Trend</h3>
                  <div className="h-32 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-emerald-500/10 rounded-lg flex items-end justify-center">
                    <div className="text-gray-500 text-sm">Chart visualization coming soon</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

