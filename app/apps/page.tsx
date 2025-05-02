"use client"

import type React from "react"

import { useEffect, useState, useCallback } from "react"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"
import { MiniAppCard } from "@/components/mini-app-card"
import { NavBar } from "@/components/nav-bar"
import {
  BookOpen,
  Video,
  Headphones,
  ImageIcon,
  FileText,
  MessageSquare,
  FileVideo,
  Wand2,
  Plus,
  Loader2,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { decodeJWT } from "@/lib/auth"

// Define the service type
interface Service {
  id: number
  name: string
  description: string
  icon: React.ReactNode
  serviceType: string
  color: string
  isCustom?: boolean
  onDelete?: (id: number) => Promise<boolean>
}

// Define the mini-service type from API
interface MiniService {
  id: number
  name: string
  description: string
  workflow: any
  input_type: string
  output_type: string
  owner_id: number
  average_token_usage: any
  run_time: number
}

export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [customServices, setCustomServices] = useState<Service[]>([])
  const [miniServices, setMiniServices] = useState<Service[]>([])
  const [miniServicesLoading, setMiniServicesLoading] = useState(false)
  const [user_id, setUserId] = useState<number | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0) // Used to trigger refreshes
  const router = useRouter()

  useEffect(() => {
    const pathname = window.location.pathname
    if (!isLoading && !isAuthenticated && (pathname.startsWith("/apps") || pathname === "/settings")) {
      router.push("/")
    }
  }, [isAuthenticated, isLoading, router])

  // Function to get user ID from various sources

  const getUserId = useCallback(() => {
    try {
      // Try from localStorage - userData
      const userDataStr = localStorage.getItem("userData")
      if (userDataStr) {
        const userData = JSON.parse(userDataStr)
        if (userData?.id) {
          console.log("Found user ID in userData:", userData.id)
          return userData.id
        }
      }

      // Try from localStorage - user
      const userStr = localStorage.getItem("user")
      if (userStr) {
        const user = JSON.parse(userStr)
        if (user?.id) {
          console.log("Found user ID in user:", user.id)
          return user.id
        }
      }

      // Try from localStorage - userInfo
      const userInfoStr = localStorage.getItem("userInfo")
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr)
        if (userInfo?.id) {
          console.log("Found user ID in userInfo:", userInfo.id)
          return userInfo.id
        }
      }

      // Try from JWT token
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken")
      if (token) {
        const payload = token.split(".")[1]
        if (payload) {
          const decodedPayload = JSON.parse(atob(payload))
          if (decodedPayload?.sub) {
            console.log("Found user ID in token (sub):", decodedPayload.sub)
            return Number.parseInt(decodedPayload.sub)
          }
          if (decodedPayload?.id) {
            console.log("Found user ID in token (id):", decodedPayload.id)
            return Number.parseInt(decodedPayload.id)
          }
        }
      }

      // ✅ Try from cookies using js-cookie
      const cookieUserId = Cookies.get("user_id")
      if (cookieUserId) {
        console.log("Found user ID in cookies:", cookieUserId)
        return Number.parseInt(cookieUserId)
      }
    } catch (error) {
      console.error("Error getting user ID:", error)
    }

    return null
  }, [])

  useEffect(() => {
    // Check authentication using the enhanced useAuth hook
    const checkAuth = () => {
      const cookieToken = Cookies.get("accessToken")
      const cookieUserId = Cookies.get("user_id")

      if (!cookieToken || !cookieUserId) {
        setIsAuthenticated(false)
        router.push("/auth/login")
        return
      }

      try {
        // Validate token
        const decodedToken = decodeJWT(cookieToken)
        if (!decodedToken || !decodedToken.sub || decodedToken.sub !== cookieUserId) {
          throw new Error("Invalid token or user ID mismatch")
        }

        setIsAuthenticated(true)
        setUserId(Number(cookieUserId))
      } catch (error) {
        console.error("Auth validation failed:", error)
        setIsAuthenticated(false)
        router.push("/auth/login")
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  // Load custom services from localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && isAuthenticated) {
      const loadCustomServices = async () => {
        try {
          const cookieToken = Cookies.get("accessToken")
          const cookieUserId = Cookies.get("user_id")

          if (!cookieToken || !cookieUserId) {
            throw new Error("No authentication data")
          }

          // Fetch services from API
          const response = await fetch(
            `http://127.0.0.1:8000/api/v1/mini-services?current_user_id=${cookieUserId}`,
            {
              headers: {
                Authorization: `Bearer ${cookieToken}`,
                "Content-Type": "application/json",
              },
            }
          )

          if (!response.ok) {
            throw new Error("Failed to fetch services")
          }

          const services = await response.json()

          // Map the services to the format expected by MiniAppCard
          const formattedServices = services.map((service: any) => {
            return {
              id: service.id,
              name: service.name,
              description: service.description,
              icon: getIconComponent(service.icon || "Wand2"),
              serviceType: "mini-service",
              color: service.color || getColorForService(service.input_type, service.output_type),
              isCustom: true,
              onDelete: handleMiniServiceDelete,
            }
          })

          setCustomServices(formattedServices)
        } catch (error) {
          console.error("Error loading custom services:", error)
          setCustomServices([])
        }
      }

      loadCustomServices()
    }
  }, [isAuthenticated])

  // Function to refresh mini-services
  const refreshMiniServices = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1)
  }, [])

  // Set up event listener for mini service creation
  useEffect(() => {
    const handleMiniServiceCreated = () => {
      console.log("Mini service created event detected")
      refreshMiniServices()
    }

    window.addEventListener("miniServiceCreated", handleMiniServiceCreated)

    // Check for URL parameters that might indicate a new service was created
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get("newService") === "true") {
      console.log("New service parameter detected in URL")
      refreshMiniServices()

      // Clean up the URL
      const newUrl = window.location.pathname
      window.history.replaceState({}, document.title, newUrl)
    }

    return () => {
      window.removeEventListener("miniServiceCreated", handleMiniServiceCreated)
    }
  }, [refreshMiniServices])

  // Handle mini service deletion
  const handleMiniServiceDelete = async (id: number): Promise<boolean> => {
    try {
      // Get the authentication token
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken")

      // Check cookies as fallback
      const cookieToken = Cookies.get("accessToken")

      const authToken = token || cookieToken

      if (!authToken) {
        toast({
          title: "Hata",
          description: "Oturum bilgisi bulunamadı. Lütfen tekrar giriş yapın.",
          variant: "destructive",
        })
        return false
      }

      // Get user ID if not already set
      const currentUserId = user_id || getUserId()

      if (!currentUserId) {
        toast({
          title: "Hata",
          description: "Kullanıcı kimliği bulunamadı. Lütfen tekrar giriş yapın.",
          variant: "destructive",
        })
        return false
      }

      const response = await fetch(
        `http://127.0.0.1:8000/api/v1/mini-services/${id}?current_user_id=${currentUserId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json"
          }
        }
      )

      if (!response.ok) {
        let errorMessage = "Mini servis silinemedi."
        try {
          const errorData = await response.json()
          errorMessage = errorData.detail || errorMessage
        } catch (e) {
          console.error("Error parsing error response:", e)
        }

        toast({
          title: "Hata",
          description: errorMessage,
          variant: "destructive",
        })
        return false
      }

      // If successful, remove the mini service from state
      setMiniServices((prev) => prev.filter((service) => service.id !== id))

      toast({
        title: "Başarılı",
        description: "Mini servis başarıyla silindi.",
      })

      return true
    } catch (error) {
      console.error("Error in delete function:", error)

      toast({
        title: "Hata",
        description:
          "Mini servis silinirken bir hata oluştu. Bu servis başka işlemler tarafından kullanılıyor olabilir.",
        variant: "destructive",
      })

      return false
    }
  }

  // Fetch mini-services from API
  useEffect(() => {
    if (isAuthenticated) {
      const fetchMiniServices = async () => {
        try {
          setMiniServicesLoading(true)

          // Get the authentication token
          const token = localStorage.getItem("token") || localStorage.getItem("accessToken")

          // Check cookies as fallback
          const cookieToken = Cookies.get("accessToken")

          const authToken = token || cookieToken

          if (!authToken) {
            throw new Error("No authentication token found")
          }

          // Get user ID if not already set
          const currentUserId = user_id || getUserId()
          console.log("userId:", user_id)
          console.log("getUserId():", getUserId())

          if (!currentUserId) {
            throw new Error("User ID is required")
          }

          console.log("Fetching mini-services for user ID:", currentUserId)

          const response = await fetch(`http://127.0.0.1:8000/api/v1/mini-services?current_user_id=${currentUserId}`, {
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
          })

          if (!response.ok) {
            throw new Error(`Failed to fetch mini-services: ${response.status} ${response.statusText}`)
          }

          const data: MiniService[] = await response.json()
          console.log("Fetched mini-services:", data)

          // Include all mini-services from the API as they're all user-created
          const userCreatedServices = data

          // Map the mini-services to the format expected by MiniAppCard
          const formattedServices = userCreatedServices.map((service) => {
            // Determine icon based on input/output type
            let iconName = "Wand2"
            if (service.input_type === "text" && service.output_type === "text") {
              iconName = "MessageSquare"
            } else if (service.input_type === "text" && service.output_type === "image") {
              iconName = "ImageIcon"
            } else if (service.input_type === "text" && service.output_type === "sound") {
              iconName = "Headphones"
            } else if (service.input_type === "sound" || service.output_type === "sound") {
              iconName = "Headphones"
            } else if (service.input_type === "image" || service.output_type === "image") {
              iconName = "ImageIcon"
            }

            // Get color based on service type
            const color = getColorForService(service.input_type, service.output_type)

            return {
              id: service.id,
              name: service.name,
              description: service.description,
              icon: getIconComponent(iconName),
              serviceType: "mini-service",
              color,
              isCustom: true, // Mark as custom so it can be deleted
              onDelete: handleMiniServiceDelete, // Add delete handler
            }
          })

          setMiniServices(formattedServices)
        } catch (error) {
          console.error("Error fetching mini-services:", error)
          setMiniServices([])
        } finally {
          setMiniServicesLoading(false)
        }
      }

      fetchMiniServices()
    }
  }, [isAuthenticated, user_id, refreshTrigger, getUserId])

  // Helper function to get icon component from string name
  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      BookOpen: <BookOpen className="h-6 w-6 text-white" />,
      Video: <Video className="h-6 w-6 text-white" />,
      Headphones: <Headphones className="h-6 w-6 text-white" />,
      ImageIcon: <ImageIcon className="h-6 w-6 text-white" />,
      FileText: <FileText className="h-6 w-6 text-white" />,
      MessageSquare: <MessageSquare className="h-6 w-6 text-white" />,
      FileVideo: <FileVideo className="h-6 w-6 text-white" />,
      Wand2: <Wand2 className="h-6 w-6 text-white" />,
    }

    return iconMap[iconName] || <Wand2 className="h-6 w-6 text-white" />
  }

  // Helper function to get color based on service type
  const getColorForService = (inputType: string, outputType: string) => {
    if (inputType === "text" && outputType === "text") {
      return "from-purple-600 to-purple-800"
    } else if (inputType === "text" && outputType === "image") {
      return "from-pink-600 to-pink-800"
    } else if (inputType === "text" && outputType === "sound") {
      return "from-orange-600 to-orange-800"
    } else if (inputType === "sound" || outputType === "sound") {
      return "from-blue-600 to-blue-800"
    } else if (inputType === "image" || outputType === "image") {
      return "from-green-600 to-green-800"
    }

    return "from-indigo-600 to-indigo-800"
  }

  if (isLoading || isAuthenticated === null) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>
  }

  if (isAuthenticated === false) {
    return null // Will redirect in useEffect
  }

  const builtInServices: Service[] = [
    {
      id: 6,
      name: "Video Translation",
      description: "Translate videos into multiple languages with AI",
      icon: <Video className="h-6 w-6 text-white" />,
      serviceType: "video-translation",
      color: "from-blue-600 to-blue-800",
    },
    {
      id: 3,
      name: "Bedtime Story",
      description: "Generate creative bedtime stories for children",
      icon: <BookOpen className="h-6 w-6 text-white" />,
      serviceType: "bedtime-story",
      color: "from-purple-600 to-purple-800",
    },
    {
      id: 7,
      name: "AI Chat",
      description: "Chat with our advanced AI assistant",
      icon: <MessageSquare className="h-6 w-6 text-white" />,
      serviceType: "ai-chat",
      color: "from-green-600 to-green-800",
    },
    {
      id: 8,
      name: "Text to Image",
      description: "Generate images from text descriptions",
      icon: <Wand2 className="h-6 w-6 text-white" />,
      serviceType: "text-to-image",
      color: "from-pink-600 to-pink-800",
    },
    {
      id: 9,
      name: "Audio Documents",
      description: "Convert documents into natural-sounding speech",
      icon: <Headphones className="h-6 w-6 text-white" />,
      serviceType: "audio-documents",
      color: "from-orange-600 to-orange-800",
    },
    {
      id: 10,
      name: "Video Auto-Captions",
      description: "Automatically generate captions for videos",
      icon: <FileVideo className="h-6 w-6 text-white" />,
      serviceType: "video-captions",
      color: "from-red-600 to-red-800",
    },
    {
      id: 4,
      name: "Daily Recap",
      description: "Get personalized summaries of news and information",
      icon: <FileText className="h-6 w-6 text-white" />,
      serviceType: "daily-recap",
      color: "from-emerald-600 to-teal-800",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black">
      <NavBar />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* User-created Mini-Services Section - Show at the top when there are mini-services */}
          {miniServicesLoading ? (
            <div className="mb-12 flex items-center justify-center p-12 bg-black/40 backdrop-blur-sm rounded-xl border border-purple-900/30">
              <Loader2 className="h-8 w-8 text-purple-400 animate-spin mr-3" />
              <span className="text-purple-300">Loading your AI workflows...</span>
            </div>
          ) : miniServices.length > 0 ? (
            <section className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">Your AI Workflows</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {miniServices.map((service) => (
                  <MiniAppCard
                    key={`mini-service-${service.id}`}
                    title={service.name}
                    description={service.description}
                    icon={service.icon}
                    serviceType={service.serviceType}
                    color={service.color}
                    isCustom={service.isCustom}
                    id={service.id}
                    onDelete={service.onDelete}
                  />
                ))}
              </div>
            </section>
          ) : null}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">AI Services</h1>
            </div>
          </div>

          {/* Built-in Services */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {builtInServices.map((service) => (
              <MiniAppCard
                key={service.serviceType}
                title={service.name}
                description={service.description}
                icon={service.icon}
                serviceType={service.serviceType}
                color={service.color}
                id={service.id}
              />
            ))}

            {/* Create New card */}
            <MiniAppCard
              title="Create New"
              description="Create a custom AI service"
              icon={<Plus className="h-6 w-6 text-white" />}
              serviceType=""
              color="from-gray-600 to-gray-800"
              isAddCard={true}
            />
          </div>

          {/* Recent Activity Section */}
          <section className="mt-16">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">Recent Activity</h2>
            <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-purple-900/30 p-6">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Bedtime Story Created</h3>
                    <p className="text-gray-400 text-sm mt-1">
                      You generated a story about "The Adventures of Luna the Space Cat"
                    </p>
                    <p className="text-gray-500 text-xs mt-2">Today at 2:45 PM</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">Image Generated</h3>
                    <p className="text-gray-400 text-sm mt-1">
                      You created an image with the prompt "Futuristic city with flying cars"
                    </p>
                    <p className="text-gray-500 text-xs mt-2">Yesterday at 10:12 AM</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
