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
        <div className="text-white">Loading profile...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black">
      <NavBar />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center h-16 my-2 relative">
            <Button
              variant="ghost"
              onClick={() => router.push("/apps")}
              className="flex items-center text-gray-300 hover:text-white p-0 hover:bg-transparent absolute left-0"
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
            </Button>
            <div className="flex items-center justify-center w-full">
              <User className="h-5 w-5 text-purple-400 mr-2" />
              <span className="text-white font-semibold">Profile</span>
            </div>
          </div>

          <div className="grid gap-8">
            {/* Profile Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 bg-black/40 backdrop-blur-sm rounded-xl border border-purple-900/30 p-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center border-2 border-purple-500/30 shadow-lg">
                <span className="text-3xl font-bold text-white">
                  {userData.firstName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-grow">
                <h1 className="text-2xl font-bold text-white mb-2">
                  {userData.username || `${userData.firstName} ${userData.lastName}`.trim()}
                </h1>
              </div>
              <div className="flex flex-col gap-2 min-w-[150px] text-center bg-purple-900/20 rounded-lg p-4">
                <div>
                  <div className="text-2xl font-bold text-white">{userData.appsCreated}</div>
                  <div className="text-sm text-gray-400">Apps Created</div>
                </div>
                <Separator className="bg-purple-900/30" />
                <div>
                  <div className="text-2xl font-bold text-white">{userData.generations}</div>
                  <div className="text-sm text-gray-400">Generations</div>
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-purple-900/30 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Profile Information</h2>
              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-400">Name</Label>
                  <Input
                    id="name"
                    value={`${userData.firstName} ${userData.lastName}`.trim()}
                    className="bg-black/30 border-purple-900/30 text-gray-300 pointer-events-none select-none cursor-default"
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-400">Email</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      value={userData.email}
                      className="bg-black/30 border-purple-900/30 text-gray-300 pr-10 cursor-pointer"
                      readOnly
                      onClick={() => copyToClipboard(userData.email)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400 hover:text-white hover:bg-transparent"
                      onClick={() => copyToClipboard(userData.email)}
                    >
                      {isCopied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* API Usage */}
            <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-purple-900/30 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">API Usage</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-purple-900/20 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Total API Calls</div>
                  <div className="text-2xl font-bold text-white">12,543</div>
                </div>
                <div className="bg-purple-900/20 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Active API Keys</div>
                  <div className="text-2xl font-bold text-white">3</div>
                </div>
                <div className="bg-purple-900/20 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Usage This Month</div>
                  <div className="text-2xl font-bold text-white">2.1GB</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

