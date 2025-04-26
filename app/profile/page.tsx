"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { NavBar } from "@/components/nav-bar"
import { ChevronLeft, Upload, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { getAccessToken, decodeJWT } from "@/lib/auth"

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const router = useRouter()
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    bio: "",
    website: "",
    username: "",
    memberSince: "March 2024",
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
          <div className="flex items-center h-16 my-2">
            <Button
              variant="ghost"
              onClick={() => router.push("/apps")}
              className="flex items-center text-gray-300 hover:text-white p-0"
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Button>
            <div className="mx-auto flex items-center">
              <User className="h-5 w-5 text-purple-400 mr-2" />
              <span className="text-white font-semibold">Profile</span>
            </div>
            <div className="w-24"></div> {/* Spacer to center the title */}
          </div>

          <div className="grid gap-8">
            {/* Profile Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 bg-black/40 backdrop-blur-sm rounded-xl border border-purple-900/30 p-6">
              <Avatar className="w-24 h-24 border-2 border-purple-500/30">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback>
                  {userData.firstName.charAt(0)}
                  {userData.lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-grow">
                <h1 className="text-2xl font-bold text-white mb-2">
                  {userData.username || `${userData.firstName} ${userData.lastName}`.trim()}
                </h1>
                <p className="text-gray-400 mb-4">Member since {userData.memberSince}</p>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Upload className="w-4 h-4 mr-2" />
                  Change Avatar
                </Button>
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
            <form
              onSubmit={handleSubmit}
              className="bg-black/40 backdrop-blur-sm rounded-xl border border-purple-900/30 p-6"
            >
              <h2 className="text-xl font-semibold text-white mb-6">Profile Information</h2>
              <div className="grid gap-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="Enter your first name"
                      className="bg-black/30 border-purple-900/30"
                      value={userData.firstName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Enter your last name"
                      className="bg-black/30 border-purple-900/30"
                      value={userData.lastName}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="bg-black/30 border-purple-900/30"
                    value={userData.email}
                    onChange={handleInputChange}
                    readOnly
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself"
                    className="bg-black/30 border-purple-900/30 min-h-[100px]"
                    value={userData.bio}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://your-website.com"
                    className="bg-black/30 border-purple-900/30"
                    value={userData.website}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </form>

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

