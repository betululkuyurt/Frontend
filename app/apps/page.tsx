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
import { deleteMiniService } from "@/lib/services"

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
  usageStats?: {
    average_token_usage: {
      input_type: number
      output_type: number
      prompt_tokens: number
      completion_tokens: number
      total_tokens: number
    }
    run_time: number
    input_type: string
    output_type: string
  }
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

// Define the process type from API
interface Process {
  id: number
  user_id: number
  service_id: number
  mini_service_id: number | null
  service_type: string
  status: string
  input_text: string | null
  output_text: string | null
  output_url: string | null
  created_at: string
  updated_at: string
  description: string | null
}

export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [customServices, setCustomServices] = useState<Service[]>([])
  const [miniServices, setMiniServices] = useState<Service[]>([])
  const [miniServicesLoading, setMiniServicesLoading] = useState(false)
  const [user_id, setUserId] = useState<number | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [recentActivities, setRecentActivities] = useState<Process[]>([])
  const [recentActivitiesLoading, setRecentActivitiesLoading] = useState(false)
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
              usageStats: {
                average_token_usage: service.average_token_usage,
                run_time: service.run_time,
                input_type: service.input_type,
                output_type: service.output_type
              }
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
    console.log(`[DASHBOARD] Handling mini service delete UI update for ID: ${id}`);
    
    // Burada API çağrısı yapmayın, sadece UI güncelleme işlemi yapın
    // Çünkü silme işlemi zaten MiniAppCard içinde yapıldı
    setMiniServices((prev) => prev.filter((service) => service.id !== id));
    
    // İşlem başarılı olduğu için true döndürün
    return true;
  };

  // Fetch mini-services from API
  useEffect(() => {
    if (isAuthenticated) {
      const fetchMiniServices = async () => {
        try {
          setMiniServicesLoading(true)

          // Get the authentication token
          const token = localStorage.getItem("token") || localStorage.getItem("accessToken")
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
              usageStats: {
                average_token_usage: service.average_token_usage,
                run_time: service.run_time,
                input_type: service.input_type,
                output_type: service.output_type
              }
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

  // Fetch user's recent activities/processes
  useEffect(() => {
    if (isAuthenticated) {
      const fetchRecentActivities = async () => {
        try {
          setRecentActivitiesLoading(true)

          // Get the authentication token
          const token = localStorage.getItem("token") || localStorage.getItem("accessToken")
          const cookieToken = Cookies.get("accessToken")
          const authToken = token || cookieToken

          if (!authToken) {
            throw new Error("No authentication token found")
          }

          // Get user ID if not already set
          const currentUserId = user_id || getUserId()
          
          if (!currentUserId) {
            throw new Error("User ID is required")
          }

          console.log("Fetching recent processes for user ID:", currentUserId)

          const response = await fetch(`http://127.0.0.1:8000/api/v1/processes/recent-activities?current_user_id=${currentUserId}&limit=5`, {
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
          })
          
          if (!response.ok) {
            throw new Error(`Failed to fetch processes: ${response.status} ${response.statusText}`)
          }

          const data: Process[] = await response.json()
          console.log("Fetched recent processes:", data)
          setRecentActivities(data)
        } catch (error) {
          console.error("Error fetching recent activities:", error)
          setRecentActivities([])
        } finally {
          setRecentActivitiesLoading(false)
        }
      }

      fetchRecentActivities()
    }
  }, [isAuthenticated, user_id, getUserId])

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

  // Helper function to get appropriate icon based on service_type
  const getActivityIcon = (serviceType: string) => {
    switch (serviceType) {
      case "text-to-image":
        return <ImageIcon className="h-5 w-5 text-pink-400" />
      case "bedtime-story":
        return <BookOpen className="h-5 w-5 text-purple-400" />
      case "video-translation":
        return <Video className="h-5 w-5 text-blue-400" />
      case "ai-chat":
        return <MessageSquare className="h-5 w-5 text-green-400" />
      case "audio-documents":
        return <Headphones className="h-5 w-5 text-orange-400" />
      case "video-captions":
        return <FileVideo className="h-5 w-5 text-red-400" />
      case "daily-recap":
        return <FileText className="h-5 w-5 text-emerald-400" />
      case "mini-service":
        return <Wand2 className="h-5 w-5 text-indigo-400" />
      default:
        return <Wand2 className="h-5 w-5 text-gray-400" />
    }
  }

  // Helper function to get background color based on service_type
  const getActivityBgColor = (serviceType: string) => {
    switch (serviceType) {
      case "text-to-image":
        return "bg-pink-600/20"
      case "bedtime-story":
        return "bg-purple-600/20"
      case "video-translation":
        return "bg-blue-600/20"
      case "ai-chat":
        return "bg-green-600/20"
      case "audio-documents":
        return "bg-orange-600/20"
      case "video-captions":
        return "bg-red-600/20"
      case "daily-recap":
        return "bg-emerald-600/20"
      case "mini-service":
        return "bg-indigo-600/20"
      default:
        return "bg-gray-600/20"
    }
  }

  // Helper function to format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    
    // Today
    if (date.toDateString() === now.toDateString()) {
      return `Today at ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
    }
    
    // Yesterday
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
    }
    
    // Within last 7 days
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (dayDiff < 7) {
      return `${daysOfWeek[date.getDay()]} at ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
    }
    
    // Older
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + 
           ` at ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
  }

  // Helper function to get human-readable title for process
  const getActivityTitle = (process: Process) => {
    // If it's a mini-service, we need special handling
    if (process.service_type === "mini-service") {
      // Find the mini-service by ID
      const miniService = miniServices.find(ms => ms.id === process.mini_service_id)
      if (miniService) {
        return `${miniService.name} Used`
      }
      return "Custom Workflow Used"
    }
    
    // For built-in services
    switch (process.service_type) {
      case "text-to-image":
        return "Image Generated"
      case "bedtime-story":
        return "Bedtime Story Created"
      case "video-translation":
        return "Video Translated"
      case "ai-chat":
        return "AI Chat Conversation"
      case "audio-documents":
        return "Audio Document Created"
      case "video-captions":
        return "Video Captioning Complete"
      case "daily-recap":
        return "Daily Recap Generated"
      default:
        return "Process Completed"
    }
  }

  // Helper function to get description for a process
  const getActivityDescription = (process: Process) => {
    // Prefer backend-provided description if available
    if (process.description) {
      return process.description
    }
  
    // Fallback to constructing from input_text if available
    if (process.input_text) {
      const maxLength = 100
      const input = process.input_text.length > maxLength
        ? process.input_text.substring(0, maxLength) + "..."
        : process.input_text
  
      if (process.service_type === "text-to-image") {
        return `You created an image with the prompt "${input}"`
      }
  
      return `You used prompt: "${input}"`
    }
  
    // Fallbacks based on service type
    switch (process.service_type) {
      case "video-translation":
        return "You translated a video to another language"
      case "video-captions":
        return "You added automatic captions to a video"
      case "audio-documents":
        return "You converted a document to audio"
      default:
        return process.status === "completed"
          ? "Process completed successfully"
          : `Process status: ${process.status}`
    }
  }
  

  if (isLoading || isAuthenticated === null) {
    return <div className="min-h-screen flex items-center justify-center text-white"></div>
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
          {/* User-created Mini-Services Section - Only show if there are mini services */}
          {miniServices.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">Your AI Workflows</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {miniServicesLoading ? (
                  // Placeholder cards during loading
                  Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={`placeholder-${index}`}
                      className="h-[220px] bg-black/40 backdrop-blur-sm rounded-xl border border-purple-900/30 animate-pulse"
                    />
                  ))
                ) : (
                  miniServices.map((service) => (
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
                      usageStats={service.usageStats}
                    />
                  ))
                )}
              </div>
            </section>
          )}

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
            
            {recentActivitiesLoading ? (
              <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-purple-900/30 p-6 flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-purple-400 animate-spin mr-3" />
                <span className="text-purple-300">Loading your recent activities...</span>
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-purple-900/30 p-6">
                <div className="space-y-6">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-full ${getActivityBgColor(activity.service_type)} flex items-center justify-center flex-shrink-0`}>
                        {getActivityIcon(activity.service_type)}
                      </div>
                      <div>
                        <h3 className="text-white font-medium">{getActivityTitle(activity)}</h3>
                        <p className="text-gray-400 text-sm mt-1">
                          {getActivityDescription(activity)}
                        </p>
                        <p className="text-gray-500 text-xs mt-2">
                          {formatDate(activity.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-purple-900/30 p-6 text-center">
                <p className="text-gray-400">You don't have any recent activities yet.</p>
                <p className="text-gray-500 text-sm mt-2">Try out one of our AI services to get started!</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}