"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
  SquarePlus,
  Eraser,
  Check,
  Bot,
  Sparkles,
  BotOff,
  Search,
  Filter,
  X,
  SortAsc,
  SortDesc,
  Clock,
  Zap,
  TrendingUp,
  Star,
  ChevronDown,
  Grid3X3,
  List,
  Trash2,
  Activity,
  Flame,
  Heart,
  User,
  Globe,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { decodeJWT, getAccessToken } from "@/lib/auth"
import {
  deleteMiniService,
  toggleFavorite,
  type FavoriteService,
} from "@/lib/services"
import { getServiceTypeConfig } from "@/lib/service-utils"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// Define the service type
interface Service {
  is_public: boolean | undefined
  id: number
  name: string
  description: string
  icon: React.ReactNode
  serviceType: string
  color: string
  isCustom?: boolean
  owner_id?: number
  owner_username?: string
  onDelete?: (id: number) => Promise<boolean> | boolean
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
  is_enhanced?: boolean
  created_at?: string
  requiresApiKey?: boolean
  is_favorited?: boolean
  favorite_count?: number
}  // Define the mini-service type from API
interface MiniService {
  id: number
  name: string
  description: string
  workflow: any
  input_type: string
  output_type: string
  owner_id: number
  owner_username?: string
  average_token_usage: any
  run_time: number
  is_enhanced: boolean
  created_at: string
  is_public: boolean
  favorite_count: number
  is_favorited: boolean
}

// Define the process type from API
interface Process {
  id: number
  type?: number
  service_type: string
  input_text?: string
  description?: string
  status: string
  created_at: string
  mini_service_id?: number
}

type SortOption = "name" | "created" | "usage" | "runs" | "type" | "favorites"
type SortDirection = "asc" | "desc"

export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [customServices, setCustomServices] = useState<Service[]>([])
  const [miniServices, setMiniServices] = useState<Service[]>([])
  const [favoriteServices, setFavoriteServices] = useState<Service[]>([])
  const [trendingServices, setTrendingServices] = useState<Service[]>([])
  const [miniServicesLoading, setMiniServicesLoading] = useState(false)
  const [favoritesLoading, setFavoritesLoading] = useState(false)
  const [trendingLoading, setTrendingLoading] = useState(false)
  const [user_id, setUserId] = useState<number | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [recentActivities, setRecentActivities] = useState<Process[]>([])
  const [recentActivitiesLoading, setRecentActivitiesLoading] = useState(false)
  const [activeFilter, setActiveFilter] = useState<"all" | "trending" | "favourites" | "created">("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Clear filter-specific states when switching filters
  useEffect(() => {
    setSearchQuery("")
    setInputTypeFilter(null)
    setOutputTypeFilter(null)

    setTransitionLoading(true)
    const timer = setTimeout(() => {
      setTransitionLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [activeFilter])

  // New filter and sort states
  const [sortBy, setSortBy] = useState<SortOption>("created")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [inputTypeFilter, setInputTypeFilter] = useState<string | null>(null)
  const [outputTypeFilter, setOutputTypeFilter] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"card" | "table">("card")
  const [favoriteLoadingStates, setFavoriteLoadingStates] = useState<Record<number, boolean>>({})
  const [serviceFavoriteStates, setServiceFavoriteStates] = useState<Record<number, boolean>>({})
  const [transitionLoading, setTransitionLoading] = useState(false)

  const router = useRouter()

  useEffect(() => {
    const pathname = window.location.pathname
    if (!isLoading && !isAuthenticated && (pathname.startsWith("/apps") || pathname === "/settings")) {
      router.push("/")
    }
  }, [isLoading, isAuthenticated, router])

  // Function to get user ID from various sources
  const getUserId = useCallback(() => {
    try {
      const userDataStr = localStorage.getItem("userData")
      if (userDataStr) {
        const userData = JSON.parse(userDataStr)
        if (userData?.id) {
          console.log("Found user ID in userData:", userData.id)
          return userData.id
        }
      }

      const userStr = localStorage.getItem("user")
      if (userStr) {
        const user = JSON.parse(userStr)
        if (user?.id) {
          console.log("Found user ID in user:", user.id)
          return user.id
        }
      }

      const userInfoStr = localStorage.getItem("userInfo")
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr)
        if (userInfo?.id) {
          console.log("Found user ID in userInfo:", userInfo.id)
          return userInfo.id
        }
      }

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
    const checkAuth = () => {
      const cookieToken = Cookies.get("accessToken")
      const cookieUserId = Cookies.get("user_id")

      if (!cookieToken || !cookieUserId) {
        setIsAuthenticated(false)
        router.push("/auth/login")
        return
      }

      try {
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
          const savedServices = localStorage.getItem("customServices")
          if (savedServices) {
            const services = JSON.parse(savedServices)
            const formattedServices = services.map((service: any) => {
              const { iconComponent, color } = getServiceTypeConfig(
                service.input_type || "text", 
                service.output_type || "text"
              )
              return {
                id: service.id,
                name: service.name,
                description: service.description,
                icon: iconComponent,
                serviceType: service.serviceType,
                color: service.color || color,
                isCustom: true,
                onDelete: handleMiniServiceDelete,
                usageStats: {
                  average_token_usage: service.average_token_usage,
                  run_time: service.run_time,
                  input_type: service.input_type,
                  output_type: service.output_type,
                },
                is_enhanced: service.is_enhanced,
                requiresApiKey: service.requiresApiKey,
              }
            })

            setCustomServices(formattedServices)
          }
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
      // Also refresh recent activities to show the creation activity
      setRefreshTrigger((prev) => prev + 1)
    }

    const handleFavoriteToggled = () => {
      if (activeFilter === "favourites") {
        setRefreshTrigger((prev) => prev + 1)
      }

      setMiniServices((prev) => [...prev])
    }

    const handleServiceUsed = () => {
      console.log("Service used event detected")
      // Refresh recent activities to show the usage
      setRefreshTrigger((prev) => prev + 1)
    }

    const handleServiceDeleted = () => {
      console.log("Service deleted event detected")
      // Refresh recent activities to show the deletion
      setRefreshTrigger((prev) => prev + 1)
    }

    window.addEventListener("miniServiceCreated", handleMiniServiceCreated)
    window.addEventListener("favoriteToggled", handleFavoriteToggled)
    window.addEventListener("serviceUsed", handleServiceUsed)
    window.addEventListener("serviceDeleted", handleServiceDeleted)

    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get("newService") === "true") {
      console.log("New service parameter detected in URL")
      refreshMiniServices()

      const newUrl = window.location.pathname
      window.history.replaceState({}, document.title, newUrl)
    }

    return () => {
      window.removeEventListener("miniServiceCreated", handleMiniServiceCreated)
      window.removeEventListener("favoriteToggled", handleFavoriteToggled)
      window.removeEventListener("serviceUsed", handleServiceUsed)
      window.removeEventListener("serviceDeleted", handleServiceDeleted)
    }
  }, [refreshMiniServices, activeFilter])

  // Handle mini service deletion
  const handleMiniServiceDelete = async (id: number): Promise<boolean> => {
    console.log(`[DASHBOARD] Handling mini service delete UI update for ID: ${id}`)

    // Immediately update UI for better UX
    setMiniServices((prev) => prev.filter((service) => service.id !== id))
    setFavoriteServices((prev) => prev.filter((service) => service.id !== id))
    setTrendingServices((prev) => prev.filter((service) => service.id !== id))
    
    // Dispatch custom event to notify about service deletion
    window.dispatchEvent(new CustomEvent("serviceDeleted", { detail: { serviceId: id } }))

    return true
  }

  // Check if current user is the owner of a service
  const isCurrentUserOwner = (ownerUsername?: string): boolean => {
    if (!ownerUsername) return true

    try {
      const token = getAccessToken()
      if (!token) return false

      const decodedToken = decodeJWT(token)
      if (!decodedToken?.username) return false

      return decodedToken.username === ownerUsername
    } catch (error) {
      console.error("Error checking user ownership:", error)
      return false
    }
  }

  // Handle table view service deletion with confirmation
  const handleTableServiceDelete = async (service: any) => {
    if (!service.id) return

    try {
      // Immediately update UI for better UX
      setMiniServices((prev) => prev.filter((s) => s.id !== service.id))
      setFavoriteServices((prev) => prev.filter((s) => s.id !== service.id))
      setTrendingServices((prev) => prev.filter((s) => s.id !== service.id))

      const success = await deleteMiniService(service.id, {
        showToast: true,
        toastMessage: `"${service.name}" has been deleted successfully.`,
        onSuccess: () => {
          // Dispatch custom event to notify about service deletion
          window.dispatchEvent(new CustomEvent("serviceDeleted", { detail: { serviceId: service.id } }))
        },
      })

      if (!success) {
        // If deletion failed, restore the service in UI
        setRefreshTrigger((prev) => prev + 1)
        throw new Error("Failed to delete service")
      }
    } catch (error) {
      console.error("Error deleting service:", error)
      // Refresh all data to restore correct state
      setRefreshTrigger((prev) => prev + 1)
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: "There was a problem deleting this service. Please try again.",
      })
    }
  }

  // Handle table view service favorite toggle
  const handleTableServiceFavorite = async (service: any) => {
    if (!service.id) return

    setFavoriteLoadingStates((prev) => ({ ...prev, [service.id]: true }))

    try {
      const result = await toggleFavorite(service.id)

      if (result.success) {
        setMiniServices((prev) =>
          prev.map((s) =>
            s.id === service.id
              ? {
                  ...s,
                  favorite_count: result.isFavorited
                    ? (s.favorite_count || 0) + 1
                    : Math.max(0, (s.favorite_count || 0) - 1),
                }
              : s,
          ),
        )

        setServiceFavoriteStates((prev) => ({
          ...prev,
          [service.id]: result.isFavorited,
        }))

        toast({
          title: "Success",
          description: `"${service.name}" has been ${result.isFavorited ? "added to" : "removed from"} favorites.`,
        })

        if (activeFilter === "favourites" && !result.isFavorited) {
          setRefreshTrigger((prev) => prev + 1)
        }
      } else {
        throw new Error("Failed to toggle favorite")
      }
    } catch (error) {
      console.error("Error toggling favorite:", error)
      toast({
        variant: "destructive",
        title: "Favorite Toggle Failed",
        description: "There was a problem updating the favorite status. Please try again.",
      })
    } finally {
      setFavoriteLoadingStates((prev) => ({ ...prev, [service.id]: false }))
    }
  }

  // Fetch mini-services from API
  useEffect(() => {
    if (isAuthenticated) {
      const fetchMiniServices = async () => {
        try {
          setMiniServicesLoading(true)

          const token = localStorage.getItem("token") || localStorage.getItem("accessToken")
          const cookieToken = Cookies.get("accessToken")
          const authToken = token || cookieToken

          if (!authToken) {
            throw new Error("No authentication token found")
          }

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
          }          const data: MiniService[] = await response.json()
          console.log("Fetched mini-services:", data)

          const userCreatedServices = data;const formattedServicesPromises = userCreatedServices.map(async (service) => {
            const { iconComponent, color } = getServiceTypeConfig(service.input_type, service.output_type)

            return {
              id: service.id,
              name: service.name,
              description: service.description,
              icon: iconComponent,
              serviceType: "mini-service",
              color,
              isCustom: true,
              owner_id: service.owner_id,
              owner_username: service.owner_username,
              onDelete: handleMiniServiceDelete,
              usageStats: {
                average_token_usage: service.average_token_usage,
                run_time: service.run_time,
                input_type: service.input_type,
                output_type: service.output_type,
              },
              is_enhanced: service.is_enhanced,
              created_at: service.created_at,
              favorite_count: service.favorite_count,
              is_favorited: service.is_favorited,
              is_public: service.is_public,
            }
          })

          const formattedServices = await Promise.all(formattedServicesPromises)

          setMiniServices(formattedServices)

          // Set favorite states based on the is_favorited field from API
          const favoriteStates: Record<number, boolean> = {}
          userCreatedServices.forEach((service) => {
            favoriteStates[service.id] = service.is_favorited
          })
          setServiceFavoriteStates(favoriteStates)
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

          const token = localStorage.getItem("token") || localStorage.getItem("accessToken")
          const cookieToken = Cookies.get("accessToken")
          const authToken = token || cookieToken

          if (!authToken) {
            throw new Error("No authentication token found")
          }

          const currentUserId = user_id || getUserId()

          if (!currentUserId) {
            throw new Error("User ID is required")
          }

          console.log("Fetching recent processes for user ID:", currentUserId)

          const response = await fetch(
            `http://127.0.0.1:8000/api/v1/processes/recent-activities?current_user_id=${currentUserId}&limit=5`,
            {
              headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
              },
            },
          )

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

      // Set up auto-refresh for recent activities every 30 seconds
      const interval = setInterval(() => {
        if (isAuthenticated) {
          fetchRecentActivities()
        }
      }, 30000)

      return () => clearInterval(interval)
    }
  }, [isAuthenticated, user_id, getUserId, refreshTrigger])
  // Fetch user's favorite services
  useEffect(() => {
    if (isAuthenticated && activeFilter === "favourites") {
      const fetchFavoriteServices = async () => {
        try {
          setFavoritesLoading(true)

          const token = localStorage.getItem("token") || localStorage.getItem("accessToken")
          const cookieToken = Cookies.get("accessToken")
          const authToken = token || cookieToken

          if (!authToken) {
            throw new Error("No authentication token found")
          }

          const currentUserId = user_id || getUserId()

          if (!currentUserId) {
            throw new Error("User ID is required")
          }

          console.log("Fetching favorites for user ID:", currentUserId)

          const response = await fetch(`http://127.0.0.1:8000/api/v1/mini-services?current_user_id=${currentUserId}`, {
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
          })

          if (!response.ok) {
            throw new Error(`Failed to fetch mini-services for favorites: ${response.status} ${response.statusText}`)
          }

          const data: MiniService[] = await response.json()
          console.log("Fetched mini-services for favorites:", data)

          // Filter only favorited services
          const favoriteServices = data.filter((service) => service.is_favorited)

          const formattedFavorites = favoriteServices.map((service) => {
            const { iconComponent, color } = getServiceTypeConfig(service.input_type, service.output_type)

            return {
              id: service.id,
              name: service.name,
              description: service.description,
              icon: iconComponent,
              serviceType: "mini-service",
              color,
              isCustom: true,
              owner_username: service.owner_username,
              onDelete: handleMiniServiceDelete,
              usageStats: {
                average_token_usage: service.average_token_usage,
                run_time: service.run_time,
                input_type: service.input_type,
                output_type: service.output_type,
              },
              is_enhanced: service.is_enhanced,
              created_at: service.created_at,
              favorite_count: service.favorite_count,
              is_favorited: service.is_favorited,
              is_public: service.is_public,
            }
          })

          const favoriteStates: Record<number, boolean> = {}
          favoriteServices.forEach((service) => {
            favoriteStates[service.id] = true
          })
          setServiceFavoriteStates(favoriteStates)

          setFavoriteServices(formattedFavorites)
        } catch (error) {
          console.error("Error fetching favorite services:", error)
          setFavoriteServices([])
        } finally {
          setFavoritesLoading(false)
        }
      }

      fetchFavoriteServices()
    } else if (activeFilter !== "favourites") {
      setFavoriteServices([])
      setFavoritesLoading(false)
    }
  }, [isAuthenticated, activeFilter, refreshTrigger, user_id, getUserId])
  // Fetch trending services when trending filter is active
  useEffect(() => {
    if (isAuthenticated && activeFilter === "trending") {
      const fetchTrendingServices = async () => {
        try {
          setTrendingLoading(true)

          const token = localStorage.getItem("token") || localStorage.getItem("accessToken")
          const cookieToken = Cookies.get("accessToken")
          const authToken = token || cookieToken

          if (!authToken) {
            throw new Error("No authentication token found")
          }

          const currentUserId = user_id || getUserId()

          if (!currentUserId) {
            throw new Error("User ID is required")
          }

          console.log("Fetching trending services for user ID:", currentUserId)

          const response = await fetch(`http://127.0.0.1:8000/api/v1/mini-services?current_user_id=${currentUserId}`, {
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
          })

          if (!response.ok) {
            throw new Error(`Failed to fetch mini-services for trending: ${response.status} ${response.statusText}`)
          }

          const data: MiniService[] = await response.json()
          console.log("Fetched mini-services for trending:", data)

          // Filter and sort by favorite count (trending = most favorited)
          const trendingServices = data
            .filter((service) => service.favorite_count > 0) // Only include services with at least 1 favorite
            .sort((a, b) => b.favorite_count - a.favorite_count) // Sort by favorite count (descending)

          const formattedTrendingServices = trendingServices.map((service) => {
            const { iconComponent, color } = getServiceTypeConfig(service.input_type, service.output_type)

            return {
              id: service.id,
              name: service.name,
              description: service.description,
              icon: iconComponent,
              serviceType: "mini-service",
              color,
              isCustom: true,
              owner_id: service.owner_id,
              owner_username: service.owner_username,
              onDelete: handleMiniServiceDelete,
              usageStats: {
                average_token_usage: service.average_token_usage,
                run_time: service.run_time,
                input_type: service.input_type,
                output_type: service.output_type,
              },
              is_enhanced: service.is_enhanced,
              created_at: service.created_at,
              favorite_count: service.favorite_count,
              is_favorited: service.is_favorited,
              is_public: service.is_public,
            }
          })

          setTrendingServices(formattedTrendingServices)

          // Set favorite states based on the is_favorited field from API
          const favoriteStates: Record<number, boolean> = {}
          trendingServices.forEach((service) => {
            favoriteStates[service.id] = service.is_favorited
          })
          setServiceFavoriteStates(favoriteStates)
        } catch (error) {
          console.error("Error fetching trending services:", error)
          setTrendingServices([])
        } finally {
          setTrendingLoading(false)
        }
      }

      fetchTrendingServices()
    } else if (activeFilter !== "trending") {
      setTrendingServices([])
      setTrendingLoading(false)
    }
  }, [isAuthenticated, activeFilter, refreshTrigger, user_id, getUserId])



  // Helper function to get appropriate icon based on service_type
  const getActivityIcon = (serviceType: string, activityType?: number) => {
    if (activityType !== undefined) {
      switch (activityType) {
        case 0: // create mini service
          return <SquarePlus className="h-4 w-4" />
        case 1: // create agent
          return <Bot className="h-4 w-4" />
        case 2: // enhance system prompt of agent
          return <Sparkles className="h-4 w-4" />
        case 3: // remove agent
          return <BotOff className="h-4 w-4" />
        case 4: // delete mini service
          return <Trash2 className="h-4 w-4" />
        case 5: // run mini service
          return <Zap className="h-4 w-4" />
        case 6: // file upload
          return <FileText className="h-4 w-4" />
        case 7: // delete chat conversation
          return <Eraser className="h-4 w-4" />
        case 8: // create chat conversation
          return <MessageSquare className="h-4 w-4" />
        default:
          return <Activity className="h-4 w-4" />
      }
    }

    const { iconComponent } = getServiceTypeConfig(serviceType, "text")
    return iconComponent
  }

  // Helper function to get background color based on activity type
  const getActivityBgColor = (serviceType: string, activityType?: number) => {
    if (activityType !== undefined) {
      switch (activityType) {
        case 0:
          return "bg-blue-500/10 text-blue-400"
        case 1:
          return "bg-green-500/10 text-green-400"
        case 2:
          return "bg-purple-500/10 text-purple-400"
        case 3:
          return "bg-red-500/10 text-red-400"
        case 4:
          return "bg-red-500/10 text-red-400"
        case 5:
          return "bg-indigo-500/10 text-indigo-400"
        default:
          return "bg-gray-500/10 text-gray-400"
      }
    }

    const { color } = getServiceTypeConfig(serviceType, "text")
    return color
  }

  // Helper function to update the Recent Activity section rendering
  const renderActivityItem = (activity: Process) => {
    return (
      <motion.div
        key={activity.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-all duration-300 group border border-transparent hover:border-purple-500/20"
      >
        <div
          className={`w-12 h-12 rounded-xl ${getActivityBgColor(activity.service_type, activity.type)} flex items-center justify-center flex-shrink-0 border border-white/10 group-hover:scale-110 transition-transform duration-300`}
        >
          {getActivityIcon(activity.service_type, activity.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-white font-semibold text-sm group-hover:text-purple-300 transition-colors">
              {getActivityTitle(activity)}
            </h3>
            <span className="text-slate-400 text-xs flex-shrink-0 ml-2">{formatDate(activity.created_at)}</span>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">
            {activity.description || getActivityDescription(activity)}
          </p>

          {activity.status && activity.status !== "completed" && (
            <Badge
              variant="outline"
              className={`mt-3 text-xs ${
                activity.status === "in_progress"
                  ? "border-blue-500/30 text-blue-400 bg-blue-500/10"
                  : activity.status === "failed"
                    ? "border-red-500/30 text-red-400 bg-red-500/10"
                    : "border-slate-500/30 text-slate-400 bg-slate-500/10"
              }`}
            >
              {activity.status === "in_progress"
                ? "In Progress"
                : activity.status === "failed"
                  ? "Failed"
                  : activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
            </Badge>
          )}
        </div>
      </motion.div>
    )
  }

  // Helper function to format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()

    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    }

    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`
    }

    const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (daysDiff < 7) {
      return (
        date.toLocaleDateString(undefined, { weekday: "short" }) +
        ` at ${date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`
      )
    }

    return (
      date.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
      ` at ${date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`
    )
  }

  // Helper function to get human-readable title for process
  const getActivityTitle = (process: Process) => {
    if (process.service_type === "mini-service") {
      const miniService = miniServices.find((ms) => ms.id === process.mini_service_id)
      if (miniService) {
        return `${miniService.name} Used`
      }
      return "Custom Workflow Used"
    }

    if (process.type !== undefined) {
      switch (process.type) {
        case 0:
          return "Mini Service Created"
        case 1:
          return "Agent Created"
        case 2:
          return "Agent System Prompt Enhanced"
        case 3:
          return "Agent Removed"
        case 4:
          return "Mini Service Deleted"
        case 5:
          return "Mini Service Executed"
        case 6:
          return "File Uploaded"
        case 7:
          return "Chat Conversation Deleted"
        case 8:
          return "Chat Conversation Created"
        default:
          return "Process Completed"
      }
    }

    return "Process Completed"
  }

  // Helper function to get description for a process
  const getActivityDescription = (process: Process) => {
    if (process.description) {
      return process.description
    }

    if (process.input_text) {
      const maxLength = 100
      const input =
        process.input_text.length > maxLength ? process.input_text.substring(0, maxLength) + "..." : process.input_text

      if (process.service_type === "text-to-image") {
        return `You created an image with the prompt "${input}"`
      }

      return `You used prompt: "${input}"`
    }

    switch (process.service_type) {
      case "video-translation":
        return "You translated a video to another language"
      case "video-captions":
        return "You added automatic captions to a video"
      case "audio-documents":
        return "You converted a document to audio"
      default:
        return process.status === "completed" ? "Process completed successfully" : `Process status: ${process.status}`
    }
  }

  if (isLoading || isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center space-x-4"
        >
          <div className="relative">
            <Loader2 className="h-10 w-10 animate-spin text-purple-400" />
            <div className="absolute inset-0 h-10 w-10 animate-ping rounded-full bg-purple-400/20"></div>
          </div>
          <span className="text-white text-xl font-medium">Loading your dashboard...</span>
        </motion.div>
      </div>
    )
  }

  if (isAuthenticated === false) {
    return null
  }

  // Get the base services array based on active filter
  const getBaseServices = (): Service[] => {
    switch (activeFilter) {
      case "trending":
        return trendingServices
      case "favourites":
        return favoriteServices
      case "created":
        return miniServices.filter((service) => service.isCustom && service.owner_id === user_id)
      default:
        return miniServices
    }
  }

  // Get loading state based on active filter
  const getLoadingState = (): boolean => {
    if (transitionLoading) return true

    switch (activeFilter) {
      case "trending":
        return trendingLoading
      case "favourites":
        return favoritesLoading
      case "created":
      case "all":
      default:
        return miniServicesLoading
    }
  }

  // Type filtering for input and output types separately
  const filterServicesByType = (services: Service[]) => {
    if (!inputTypeFilter && !outputTypeFilter) return services

    return services.filter((service) => {
      const inputMatch = inputTypeFilter ? service.usageStats?.input_type === inputTypeFilter : true
      const outputMatch = outputTypeFilter ? service.usageStats?.output_type === outputTypeFilter : true
      return inputMatch && outputMatch
    })
  }

  // Search filtering
  const filterServicesBySearch = (services: Service[]) => {
    if (!searchQuery) return services

    const query = searchQuery.toLowerCase()
    return services.filter(
      (service) =>
        service.name.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query) ||
        service.usageStats?.input_type?.toLowerCase().includes(query) ||
        service.usageStats?.output_type?.toLowerCase().includes(query),
    )
  }

  // Enhanced filtering and sorting function
  const filterAndSortServices = (services: Service[]) => {
    let filteredServices = [...services]

    filteredServices = filterServicesBySearch(filteredServices)
    filteredServices = filterServicesByType(filteredServices)

    filteredServices.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "created":
          const dateA = new Date(a.created_at || "").getTime()
          const dateB = new Date(b.created_at || "").getTime()
          comparison = dateA - dateB
          break
        case "usage":
          const tokensA = a.usageStats?.average_token_usage?.total_tokens || 0
          const tokensB = b.usageStats?.average_token_usage?.total_tokens || 0
          comparison = tokensA - tokensB
          break
        case "runs":
          const runsA = a.usageStats?.run_time || 0
          const runsB = b.usageStats?.run_time || 0
          comparison = runsA - runsB
          break
        case "type":
          const typeA = `${a.usageStats?.input_type || ""}-${a.usageStats?.output_type || ""}`
          const typeB = `${b.usageStats?.input_type || ""}-${b.usageStats?.output_type || ""}`
          comparison = typeA.localeCompare(typeB)
          break
        case "favorites":
          const favCountA = a.favorite_count || 0
          const favCountB = b.favorite_count || 0
          comparison = favCountA - favCountB
      }

      return sortDirection === "asc" ? comparison : -comparison
    })

    return filteredServices
  }

  // Get filtered services for display
  const getFilteredMiniServices = () => {
    const baseServices = getBaseServices()
    return filterAndSortServices(baseServices)
  }

  // Helper function to render table view
  const renderTableView = () => {
    const services = getFilteredMiniServices()

    return (
      <Card className="bg-white/5 backdrop-blur-sm border-orange-900/20 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-white/5">
              <TableHead className="text-gray-300 font-semibold">Service</TableHead>
              <TableHead className="text-gray-300 font-semibold">Type</TableHead>
              <TableHead className="text-gray-300 font-semibold">Owner</TableHead>
              <TableHead className="text-gray-300 font-semibold">Token Usage</TableHead>
              <TableHead className="text-gray-300 font-semibold">Runs</TableHead>
              <TableHead className="text-gray-300 font-semibold">Favorites</TableHead>
              <TableHead className="text-gray-300 font-semibold">Created</TableHead>
              <TableHead className="text-gray-300 font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service, index) => (
              <motion.tr
                key={`table-service-${service.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="border-white/10 hover:bg-white/5 cursor-pointer transition-all duration-300 hover:border-purple-500/20"
                onClick={() => {
                  if (service.isCustom && service.id) {
                    router.push(`/apps/service/${service.id}`)
                  }
                }}
              >
                <TableCell className="py-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-12 h-12 rounded-xl ${service.color.replace('from-', 'bg-').replace(/\s+to-.*$/, '')} flex items-center justify-center text-white shadow-lg`}
                    >
                      {service.icon}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{service.name}</div>
                      <div className="text-sm text-slate-300 truncate max-w-xs">{service.description}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-slate-200">
                  <div className="flex flex-col space-y-1">
                    <Badge
                      variant="outline"
                      className="text-xs border-emerald-500/30 text-emerald-400 bg-emerald-500/10 w-fit"
                    >
                      {service.usageStats?.input_type || "Text"}
                    </Badge>
                    <span className="text-xs text-slate-500">→</span>
                    <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400 bg-blue-500/10 w-fit">
                      {service.usageStats?.output_type || "Text"}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-slate-200">
                  {service.owner_username && (
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-200">{service.owner_username}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-slate-200">
                  <span className="text-sm font-mono">
                    {service.usageStats?.average_token_usage?.total_tokens !== undefined &&
                    !isNaN(service.usageStats.average_token_usage.total_tokens) &&
                    service.usageStats.average_token_usage.total_tokens > 0
                      ? Math.round(service.usageStats.average_token_usage.total_tokens).toLocaleString()
                      : "—"}
                  </span>
                </TableCell>
                <TableCell className="text-slate-200">
                  <span className="text-sm font-mono">
                    {service.usageStats?.run_time !== undefined &&
                    !isNaN(service.usageStats.run_time) &&
                    service.usageStats.run_time > 0
                      ? service.usageStats.run_time.toLocaleString()
                      : "—"}
                  </span>
                </TableCell>
                <TableCell className="text-slate-200">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-amber-400" />
                    <span className="text-sm font-medium">{service.favorite_count || 0}</span>
                  </div>
                </TableCell>
                <TableCell className="text-slate-200">
                  <span className="text-sm">
                    {service.created_at ? new Date(service.created_at).toLocaleDateString() : "—"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTableServiceFavorite(service)
                      }}
                      disabled={favoriteLoadingStates[service.id]}
                      className={`${
                        serviceFavoriteStates[service.id]
                          ? "text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                          : "text-slate-400 hover:text-amber-400 hover:bg-amber-500/10"
                      }`}
                      title={serviceFavoriteStates[service.id] ? "Remove from favorites" : "Add to favorites"}
                    >
                      {favoriteLoadingStates[service.id] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Star
                          className={`h-4 w-4 ${serviceFavoriteStates[service.id] ? "fill-amber-400" : "stroke-2"}`}
                        />
                      )}
                    </Button>

                    {service.isCustom && isCurrentUserOwner(service.owner_username) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                            }}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-slate-900 border-slate-700 text-slate-100">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Service</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-400">
                              Are you sure you want to delete "{service.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-slate-800 text-slate-100 border-slate-700 hover:bg-slate-700">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleTableServiceDelete(service)}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </Card>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-black via-purple-950/20 to-black">
      {/* Static gradient background */}
      <div className="absolute inset-0 -z-10 opacity-30 bg-gradient-to-br from-purple-600/30 via-violet-500/20 to-indigo-600/30" />

      <NavBar />

      <main className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <div className="flex items-center gap-4 mb-2">
                    <motion.h1
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                      className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-amber-400 to-purple-400 bg-clip-text text-transparent"
                    >
                      {activeFilter === "trending"
                        ? "Trending Workflows"
                        : activeFilter === "favourites"
                          ? "Your Favorites"
                          : activeFilter === "created"
                            ? "Your Creations"
                            : "AI Workflows"}
                    </motion.h1>
                    
                    {/* Service Count Badge - Now on same line */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                                              <Badge
                          variant="outline"
                          className="border-purple-500/30 text-purple-400 bg-purple-500/10 text-sm font-medium px-3 py-1"
                        >
                        <Sparkles className="h-3 w-3 mr-1" />
                        {getFilteredMiniServices().length} workflows
                      </Badge>
                    </motion.div>
                  </div>
                  
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-slate-300 text-lg"
                  >
                    {activeFilter === "trending"
                      ? ""
                      : activeFilter === "favourites"
                        ? ""
                        : activeFilter === "created"
                          ? ""
                          : ""}
                  </motion.p>
                </div>
              </div>

              {/* Create New Workflow Button - Enhanced Animation */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <Button
                  onClick={() => router.push("/apps/create")}
                  size="lg"
                  className="group relative bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-semibold px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border-0 overflow-hidden"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-xl">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <span>Create New Workflow</span>
                  </div>
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Filters and Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="bg-white/5 backdrop-blur-sm border-purple-900/20 mb-8 overflow-hidden">
              <CardContent className="p-6">
                {/* Category Tabs */}
                <div className="mb-6">
                  <Tabs
                    value={activeFilter}
                    onValueChange={(v) => setActiveFilter(v as "all" | "trending" | "favourites" | "created")}
                    className="w-full"
                  >
                    <TabsList className="grid grid-cols-4 h-14 bg-slate-800/50 border border-slate-700 w-full max-w-2xl rounded-2xl p-1">
                      <TabsTrigger
                        value="all"
                        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white flex items-center gap-2 rounded-xl transition-all duration-300"
                        title="All Workflows"
                      >
                        <Globe className="h-4 w-4" />
                        <span className="font-medium hidden sm:inline">All</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="trending"
                        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white flex items-center gap-2 rounded-xl transition-all duration-300"
                        title="Trending Workflows"
                      >
                        <Flame className="h-4 w-4" />
                        <span className="font-medium hidden sm:inline">Trending</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="favourites"
                        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white flex items-center gap-2 rounded-xl transition-all duration-300"
                        title="Favorite Workflows"
                      >
                        <Star className="h-4 w-4" />
                        <span className="font-medium hidden sm:inline">Favorites</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="created"
                        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white flex items-center gap-2 rounded-xl transition-all duration-300"
                        title="My Created Workflows"
                      >
                        <User className="h-4 w-4" />
                        <span className="font-medium hidden sm:inline">My Workflows</span>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Left side: Search and Type Filters */}
                  <div className="flex flex-col sm:flex-row gap-3 flex-1">
                    {/* Search Bar */}
                    <div className="relative flex-grow max-w-md flex items-center">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Search workflows..."
                        className="pl-10 bg-slate-800/50 border-slate-600 text-white focus:ring-purple-500 focus:border-purple-500 rounded-xl"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 hover:text-slate-200"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Type Filters */}
                    <div className="flex gap-2">
                      <Select
                        value={inputTypeFilter || "all"}
                        onValueChange={(value) => setInputTypeFilter(value === "all" ? null : value)}
                      >
                        <SelectTrigger className="w-[140px] bg-slate-800/50 border-slate-600 text-slate-300 rounded-xl">
                          <SelectValue placeholder="Input Type" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600 rounded-xl">
                          <SelectItem value="all">All Inputs</SelectItem>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="image">Image</SelectItem>
                          <SelectItem value="sound">Audio/Video</SelectItem>
                          <SelectItem value="document">Document</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select
                        value={outputTypeFilter || "all"}
                        onValueChange={(value) => setOutputTypeFilter(value === "all" ? null : value)}
                      >
                        <SelectTrigger className="w-[140px] bg-slate-800/50 border-slate-600 text-slate-300 rounded-xl">
                          <SelectValue placeholder="Output Type" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600 rounded-xl">
                          <SelectItem value="all">All Outputs</SelectItem>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="image">Image</SelectItem>
                          <SelectItem value="sound">Audio/Video</SelectItem>
                          <SelectItem value="document">Document</SelectItem>
                        </SelectContent>
                      </Select>

                      {(inputTypeFilter || outputTypeFilter) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setInputTypeFilter(null)
                            setOutputTypeFilter(null)
                          }}
                          className="bg-slate-800/50 border-slate-600 text-white hover:bg-slate-700 rounded-xl"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Right side: Sort and View Controls */}
                  <div className="flex gap-2 flex-shrink-0">
                    {/* Sort Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700 min-w-[180px] justify-start rounded-xl"
                        >
                          {sortDirection === "asc" ? (
                            <SortAsc className="h-4 w-4 mr-2" />
                          ) : (
                            <SortDesc className="h-4 w-4 mr-2" />
                          )}
                          <span className="text-sm">
                            Sort by:{" "}
                            {sortBy === "name"
                              ? "Name"
                              : sortBy === "created"
                                ? "Created Date"
                                : sortBy === "usage"
                                  ? "Token Usage"
                                  : sortBy === "runs"
                                    ? "Total Runs"
                                    : sortBy === "type"
                                      ? "Type"
                                      : sortBy === "favorites"
                                        ? "Favorites"
                                        : "Created Date"}{" "}
                            {sortDirection === "asc" ? "↑" : "↓"}
                          </span>
                          <ChevronDown className="h-4 w-4 ml-auto" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-slate-800 border-slate-600 rounded-xl" align="end">
                        <DropdownMenuLabel className="text-slate-400">Sort by</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setSortBy("name")}
                          className={`text-slate-300 hover:bg-slate-700 ${sortBy === "name" ? "bg-slate-700" : ""}`}
                        >
                          <span className="flex-1">Name</span>
                          {sortBy === "name" && <span className="text-purple-400 ml-2">✓</span>}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setSortBy("created")}
                          className={`text-slate-300 hover:bg-slate-700 ${sortBy === "created" ? "bg-slate-700" : ""}`}
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          <span className="flex-1">Created Date</span>
                          {sortBy === "created" && <span className="text-purple-400 ml-2">✓</span>}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setSortBy("usage")}
                          className={`text-slate-300 hover:bg-slate-700 ${sortBy === "usage" ? "bg-slate-700" : ""}`}
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          <span className="flex-1">Token Usage</span>
                          {sortBy === "usage" && <span className="text-purple-400 ml-2">✓</span>}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setSortBy("runs")}
                          className={`text-slate-300 hover:bg-slate-700 ${sortBy === "runs" ? "bg-slate-700" : ""}`}
                        >
                          <TrendingUp className="h-4 w-4 mr-2" />
                          <span className="flex-1">Total Runs</span>
                          {sortBy === "runs" && <span className="text-purple-400 ml-2">✓</span>}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setSortBy("type")}
                          className={`text-slate-300 hover:bg-slate-700 ${sortBy === "type" ? "bg-slate-700" : ""}`}
                        >
                          <Filter className="h-4 w-4 mr-2" />
                          <span className="flex-1">Type</span>
                          {sortBy === "type" && <span className="text-purple-400 ml-2">✓</span>}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setSortBy("favorites")}
                          className={`text-slate-300 hover:bg-slate-700 ${sortBy === "favorites" ? "bg-slate-700" : ""}`}
                        >
                          <Star className="h-4 w-4 mr-2" />
                          <span className="flex-1">Favorites</span>
                          {sortBy === "favorites" && <span className="text-purple-400 ml-2">✓</span>}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
                          className="text-slate-300 hover:bg-slate-700"
                        >
                          {sortDirection === "asc" ? (
                            <SortDesc className="h-4 w-4 mr-2" />
                          ) : (
                            <SortAsc className="h-4 w-4 mr-2" />
                          )}
                          Switch to {sortDirection === "asc" ? "Descending" : "Ascending"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* View Toggle Buttons */}
                    <div className="flex gap-1 bg-slate-800/50 border border-slate-600 rounded-xl p-1">
                      <Button
                        variant={viewMode === "card" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("card")}
                        className={
                          viewMode === "card"
                            ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white hover:from-purple-700 hover:to-violet-700 rounded-lg"
                            : "text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
                        }
                        title="Card view"
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === "table" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("table")}
                        className={
                          viewMode === "table"
                            ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white hover:from-purple-700 hover:to-violet-700 rounded-lg"
                            : "text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
                        }
                        title="Table view"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Active Filters Display */}
                {(searchQuery || inputTypeFilter || outputTypeFilter) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 flex flex-wrap gap-2"
                  >
                    {searchQuery && (
                      <Badge
                        variant="outline"
                        className="border-orange-500/30 text-orange-400 bg-orange-500/10 rounded-xl"
                      >
                        Search: "{searchQuery}"
                        <button onClick={() => setSearchQuery("")} className="ml-2 hover:text-white">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {inputTypeFilter && (
                      <Badge
                        variant="outline"
                        className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 rounded-xl"
                      >
                        Input: {inputTypeFilter}
                        <button onClick={() => setInputTypeFilter(null)} className="ml-2 hover:text-white">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    {outputTypeFilter && (
                      <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10 rounded-xl">
                        Output: {outputTypeFilter}
                        <button onClick={() => setOutputTypeFilter(null)} className="ml-2 hover:text-white">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Services Display Section */}
          <section className="mb-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFilter}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                {viewMode === "card" ? (
                  /* Card View */
                  <div className="max-h-[700px] overflow-y-auto pr-2 scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-purple-600">
                    {getLoadingState() ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, index) => (
                          <motion.div
                            key={`placeholder-${index}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Card className="h-[320px] bg-white/5 backdrop-blur-sm border-purple-900/20 animate-pulse rounded-2xl">
                              <CardContent className="p-6">
                                <div className="space-y-4">
                                  <div className="w-12 h-12 bg-slate-700 rounded-xl"></div>
                                  <div className="space-y-2">
                                    <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                                    <div className="h-3 bg-slate-700 rounded w-full"></div>
                                    <div className="h-3 bg-slate-700 rounded w-2/3"></div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    ) : getFilteredMiniServices().length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {getFilteredMiniServices().map((service, index) => (
                          <motion.div
                            key={`mini-service-${service.id}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                          >                            <MiniAppCard
                              title={service.name}
                              description={service.description}
                              icon={service.icon}
                              serviceType={service.serviceType}
                              color={service.color}
                              isCustom={service.isCustom}
                              id={service.id}
                              onDelete={service.onDelete}
                              usageStats={service.usageStats}
                              is_enhanced={service.is_enhanced}
                              requiresApiKey={service.requiresApiKey}
                              owner_username={service.owner_username}
                              is_public={service.is_public}
                              favorite_count={service.favorite_count}
                              is_favorited={service.is_favorited}
                            />
                          </motion.div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  /* Table View */
                  <div className="max-h-[700px] overflow-y-auto pr-2 scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-purple-600">
                    {getLoadingState() ? (
                      <Card className="bg-white/5 backdrop-blur-sm border-purple-900/20 p-8 text-center rounded-2xl">
                        <div className="flex items-center justify-center space-x-3">
                          <Loader2 className="h-6 w-6 text-purple-400 animate-spin" />
                          <span className="text-slate-400">Loading workflows...</span>
                        </div>
                      </Card>
                    ) : getFilteredMiniServices().length > 0 ? (
                      renderTableView()
                    ) : null}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </section>

          {/* Empty States */}
          {activeFilter === "favourites" && getFilteredMiniServices().length === 0 && !getLoadingState() && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Card className="bg-white/5 backdrop-blur-sm border-orange-900/20 p-12 text-center rounded-2xl">
                <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Star className="h-10 w-10 text-amber-400" />
                </div>
                <h3 className="text-white font-semibold text-xl mb-2">No favorites yet</h3>
                <p className="text-slate-400 mb-6 max-w-md mx-auto">
                  Start exploring workflows and click the star icon to save your favorites for quick access.
                </p>
                <Button
                  onClick={() => setActiveFilter("all")}
                  className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl"
                >
                  Explore Workflows
                </Button>
              </Card>
            </motion.div>
          )}

          {getFilteredMiniServices().length === 0 &&
            activeFilter !== "favourites" &&
            activeFilter !== "trending" &&
            !getLoadingState() && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Card className="bg-white/5 backdrop-blur-sm border-orange-900/20 p-12 text-center rounded-2xl">
                  <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Wand2 className="h-10 w-10 text-orange-400" />
                  </div>
                  <h3 className="text-white font-semibold text-xl mb-2">No workflows found</h3>
                  <p className="text-slate-400 mb-6 max-w-md mx-auto">
                    {activeFilter === "created"
                      ? "You haven't created any workflows yet. Start building your first AI automation!"
                      : "Get started by creating your first AI workflow to automate your tasks."}
                  </p>
                  <Button
                    onClick={() => router.push("/apps/create")}
                    className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create Your First Workflow
                  </Button>
                </Card>
              </motion.div>
            )}

          {activeFilter === "trending" && getFilteredMiniServices().length === 0 && !getLoadingState() && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Card className="bg-white/5 backdrop-blur-sm border-orange-900/20 p-12 text-center rounded-2xl">
                <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Flame className="h-10 w-10 text-orange-400" />
                </div>
                <h3 className="text-white font-semibold text-xl mb-2">No trending workflows yet</h3>
                <p className="text-slate-400 mb-6 max-w-md mx-auto">
                  Workflows will appear here based on their popularity and community engagement.
                </p>
                <Button
                  onClick={() => setActiveFilter("all")}
                  className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl"
                >
                  View All Workflows
                </Button>
              </Card>
            </motion.div>
          )}

          {(searchQuery || inputTypeFilter || outputTypeFilter) &&
            getFilteredMiniServices().length === 0 &&
            activeFilter !== "favourites" &&
            !getLoadingState() && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Card className="bg-white/5 backdrop-blur-sm border-orange-900/20 p-12 text-center rounded-2xl">
                  <div className="w-20 h-20 bg-slate-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="h-10 w-10 text-slate-400" />
                  </div>
                  <h3 className="text-white font-semibold text-xl mb-2">No matching workflows found</h3>
                  <p className="text-slate-400 mb-6 max-w-md mx-auto">
                    We couldn't find any workflows matching your search criteria. Try adjusting your filters or search
                    terms.
                  </p>
                  <div className="flex gap-3 justify-center">
                    {searchQuery && (
                      <Button
                        onClick={() => setSearchQuery("")}
                        variant="outline"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700 rounded-xl"
                      >
                        <X className="h-4 w-4 mr-2" /> Clear Search
                      </Button>
                    )}
                    {(inputTypeFilter || outputTypeFilter) && (
                      <Button
                        onClick={() => {
                          setInputTypeFilter(null)
                          setOutputTypeFilter(null)
                        }}
                        variant="outline"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700 rounded-xl"
                      >
                        <X className="h-4 w-4 mr-2" /> Clear Filters
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            )}

          {/* Recent Activity Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-16"
          >
            <div className="mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r text-white bg-clip-text text-transparent mb-2">
                Recent Activity
              </h2>
              <p className="text-slate-400">Your latest workflow interactions and updates</p>
            </div>

            {recentActivitiesLoading ? (
              <Card className="bg-white/5 backdrop-blur-sm border-orange-900/20 p-8 text-center rounded-2xl">
                <div className="flex items-center justify-center space-x-3">
                  <Loader2 className="h-6 w-6 text-orange-400 animate-spin" />
                  <span className="text-slate-400">Loading your recent activities...</span>
                </div>
              </Card>
            ) : recentActivities.length > 0 ? (
              <Card className="bg-white/5 backdrop-blur-sm border-orange-900/20 overflow-hidden rounded-2xl">
                <div className="divide-y divide-white/10">{recentActivities.map(renderActivityItem)}</div>
              </Card>
            ) : (
              <Card className="bg-white/5 backdrop-blur-sm border-orange-900/20 p-12 text-center rounded-2xl">
                <div className="w-20 h-20 bg-slate-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Activity className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-white font-semibold text-xl mb-2">No recent activities</h3>
                <p className="text-slate-400 mb-6 max-w-md mx-auto">
                  Start using AI workflows to see your activity history here. Your interactions and creations will be
                  tracked.
                </p>
               
              </Card>
            )}
          </motion.section>
        </div>
      </main>
    </div>
  )
}
