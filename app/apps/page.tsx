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
  SquarePlus,
  Eraser,
  Check,
  Bot,
  Sparkle,
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
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { decodeJWT, getAccessToken } from "@/lib/auth"
import { deleteMiniService, getFavoriteServices, getFavoriteCount, toggleFavorite, checkIfFavorited, type FavoriteService } from "@/lib/services"
import { Play } from "next/font/google"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  id: number;
  name: string;
  description: string;
  icon: React.ReactNode;
  serviceType: string;
  color: string;
  isCustom?: boolean;
  owner_id?: number;
  owner_username?: string;
  onDelete?: (id: number) => Promise<boolean> | boolean;
  usageStats?: {
    average_token_usage: {
      input_type: number;
      output_type: number;
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
    run_time: number;
    input_type: string;
    output_type: string;
    total_runs?: number;
  };
  is_enhanced?: boolean;
  created_at?: string;
  requiresApiKey?: boolean;
  is_favorited?: boolean;
  favorite_count?: number; // Add favorite count for sorting
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
  owner_username?: string
  average_token_usage: any
  run_time: number
  is_enhanced: boolean
  created_at: string
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

type SortOption = 'name' | 'created' | 'usage' | 'runs' | 'type' | 'favorites'
type SortDirection = 'asc' | 'desc'

export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [customServices, setCustomServices] = useState<Service[]>([])
  const [miniServices, setMiniServices] = useState<Service[]>([])
  const [favoriteServices, setFavoriteServices] = useState<Service[]>([])
  const [miniServicesLoading, setMiniServicesLoading] = useState(false)
  const [favoritesLoading, setFavoritesLoading] = useState(false)
  const [user_id, setUserId] = useState<number | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [recentActivities, setRecentActivities] = useState<Process[]>([])
  const [recentActivitiesLoading, setRecentActivitiesLoading] = useState(false)
  const [activeFilter, setActiveFilter] = useState<"all" | "trending" | "favourites" | "created">("all")
  const [searchQuery, setSearchQuery] = useState("")
  
  // New filter and sort states
  const [sortBy, setSortBy] = useState<SortOption>('created')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [inputTypeFilter, setInputTypeFilter] = useState<string | null>(null)
  const [outputTypeFilter, setOutputTypeFilter] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card')
  const [favoriteLoadingStates, setFavoriteLoadingStates] = useState<Record<number, boolean>>({})
  const [serviceFavoriteStates, setServiceFavoriteStates] = useState<Record<number, boolean>>({})
  
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
          // In a real application, this would be fetched from an API
          const savedServices = localStorage.getItem("customServices")
          if (savedServices) {
            const services = JSON.parse(savedServices)
            const formattedServices = services.map((service: any) => ({
              id: service.id,
              name: service.name,
              description: service.description,
              icon: getIconComponent(service.icon),
              serviceType: service.serviceType,
              color: service.color || getColorForService(service.input_type, service.output_type),
              isCustom: true,
              onDelete: handleMiniServiceDelete,
              usageStats: {
                average_token_usage: service.average_token_usage,
                run_time: service.run_time,
                input_type: service.input_type,
                output_type: service.output_type
              },
              is_enhanced: service.is_enhanced,
              requiresApiKey: service.requiresApiKey
            }))

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
    }

    const handleFavoriteToggled = () => {
      console.log("Favorite toggled event detected")
      
      // Only refresh favorites if favorites tab is active, otherwise just trigger a re-render
      if (activeFilter === "favourites") {
        setRefreshTrigger((prev) => prev + 1)
      }
      
      // Force a re-render of cards to update favorite counts without full page refresh
      setMiniServices((prev) => [...prev])
    }

    window.addEventListener("miniServiceCreated", handleMiniServiceCreated)
    window.addEventListener("favoriteToggled", handleFavoriteToggled)

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
      window.removeEventListener("favoriteToggled", handleFavoriteToggled)
    }
  }, [refreshMiniServices, activeFilter])

  // Handle mini service deletion
  const handleMiniServiceDelete = async (id: number): Promise<boolean> => {
    console.log(`[DASHBOARD] Handling mini service delete UI update for ID: ${id}`);
    
    // Burada API çağrısı yapmayın, sadece UI güncelleme işlemi yapın
    // Çünkü silme işlemi zaten MiniAppCard içinde yapıldı
    setMiniServices((prev) => prev.filter((service) => service.id !== id));
    
    // İşlem başarılı olduğu için true döndürün
    return true;
  };

  // Check if current user is the owner of a service
  const isCurrentUserOwner = (ownerUsername?: string): boolean => {
    if (!ownerUsername) return true // If no owner specified, allow delete (backward compatibility)
    
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
    if (!service.id) return;
    
    try {
      const success = await deleteMiniService(service.id, {
        showToast: true,
        toastMessage: `"${service.name}" has been deleted successfully.`,
        onSuccess: () => {
          // Update the services list in state
          setMiniServices((prev) => prev.filter((s) => s.id !== service.id));
        }
      });

      if (success) {
        // Refresh the page after a short delay for better UX
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: "There was a problem deleting this service. Please try again.",
      });
    }
  };

  // Handle table view service favorite toggle
  const handleTableServiceFavorite = async (service: any) => {
    if (!service.id) return;
    
    // Set loading state for this specific service
    setFavoriteLoadingStates(prev => ({ ...prev, [service.id]: true }));
    
    try {
      const result = await toggleFavorite(service.id);
      
      if (result.success) {
        // Update the favorite count in the services list
        setMiniServices((prev) => prev.map((s) => 
          s.id === service.id 
            ? { 
                ...s, 
                favorite_count: result.isFavorited 
                  ? (s.favorite_count || 0) + 1 
                  : Math.max(0, (s.favorite_count || 0) - 1)
              }
            : s
        ));
        
        // Update the favorite status for this service
        setServiceFavoriteStates(prev => ({ 
          ...prev, 
          [service.id]: result.isFavorited 
        }));
        
        toast({
          title: "Success",
          description: `"${service.name}" has been ${result.isFavorited ? "added to" : "removed from"} favorites.`,
        });
        
        // If we're in favorites view and unfavorited, refresh the list
        if (activeFilter === "favourites" && !result.isFavorited) {
          setRefreshTrigger(prev => prev + 1);
        }
      } else {
        throw new Error("Failed to toggle favorite");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({
        variant: "destructive",
        title: "Favorite Toggle Failed",
        description: "There was a problem updating the favorite status. Please try again.",
      });
    } finally {
      // Clear loading state for this specific service
      setFavoriteLoadingStates(prev => ({ ...prev, [service.id]: false }));
    }
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
          // Fetch favorite counts for all services in parallel
          const formattedServicesPromises = userCreatedServices.map(async (service) => {
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

            // Fetch favorite count and status for this service
            const [favoriteCount, isFavorited] = await Promise.all([
              getFavoriteCount(service.id),
              checkIfFavorited(service.id)
            ])

            return {
              id: service.id,
              name: service.name,
              description: service.description,
              icon: getIconComponent(iconName),
              serviceType: "mini-service",
              color,
              isCustom: true, // Mark as custom so it can be deleted
              owner_id: service.owner_id, // Add owner_id for filtering
              owner_username: service.owner_username, // Add owner_username from API
              onDelete: handleMiniServiceDelete, // Add delete handler
              usageStats: {
                average_token_usage: service.average_token_usage,
                run_time: service.run_time,
                input_type: service.input_type,
                output_type: service.output_type,
                total_runs: Math.floor(Math.random() * 100) + 1 // Temporary random data
              },
              is_enhanced: service.is_enhanced,
              created_at: service.created_at,
              favorite_count: favoriteCount, // Add favorite count for sorting
            }
          })

          // Wait for all favorite counts to be fetched
          const formattedServices = await Promise.all(formattedServicesPromises)

          setMiniServices(formattedServices)
          
          // Store favorite states for table view - we need to collect them from the parallel promises
          const favoriteStates: Record<number, boolean> = {}
          await Promise.all(
            userCreatedServices.map(async (service, index) => {
              const isFavorited = await checkIfFavorited(service.id)
              favoriteStates[service.id] = isFavorited
            })
          )
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

  // Fetch user's favorite services
  useEffect(() => {
    if (isAuthenticated && activeFilter === "favourites") {
      const fetchFavoriteServices = async () => {
        try {
          setFavoritesLoading(true)
          
          const favoriteData = await getFavoriteServices(0, 100)
          console.log("Fetched favorite services:", favoriteData)
          console.log("Favorite data length:", favoriteData?.length)
          console.log("First favorite item:", favoriteData?.[0])

          // Backend now returns full mini service details, so we need to fetch favorite counts and states
          const formattedFavoritesPromises = favoriteData.map(async (service: FavoriteService) => {
            console.log("Processing favorite service:", service)
            
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

            // Fetch favorite count and state for this service (same as regular services)
            const [favoriteCount, isFavorited] = await Promise.all([
              getFavoriteCount(service.id),
              checkIfFavorited(service.id)
            ])

            const formattedService = {
              id: service.id,
              name: service.name,
              description: service.description,
              icon: getIconComponent(iconName),
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
                total_runs: Math.floor(Math.random() * 100) + 1
              },
              is_enhanced: service.is_enhanced,
              created_at: service.created_at,
              favorite_count: favoriteCount, // Add favorite count for consistency with other views
            }
            
            console.log("Formatted favorite service:", formattedService)
            return formattedService
          })

          // Wait for all favorite services to be processed with their counts
          const formattedFavorites = await Promise.all(formattedFavoritesPromises)

          // Store favorite states for table view
          const favoriteStates: Record<number, boolean> = {}
          formattedFavorites.forEach((service) => {
            favoriteStates[service.id] = true // We know these are all favorited since they came from favorites endpoint
          })
          setServiceFavoriteStates(favoriteStates)

          console.log("All formatted favorites:", formattedFavorites)
          setFavoriteServices(formattedFavorites)
        } catch (error) {
          console.error("Error fetching favorite services:", error)
          setFavoriteServices([])
        } finally {
          setFavoritesLoading(false)
        }
      }

      fetchFavoriteServices()
    }
  }, [isAuthenticated, activeFilter, refreshTrigger])

  // Get icon component by name
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "MessageSquare":
        return <MessageSquare className="h-6 w-6 text-white" />
      case "FileText":
        return <FileText className="h-6 w-6 text-white" />
      case "ImageIcon":
        return <ImageIcon className="h-6 w-6 text-white" />
      case "Video":
        return <Video className="h-6 w-6 text-white" />
      case "Headphones":
        return <Headphones className="h-6 w-6 text-white" />
      case "BookOpen":
        return <BookOpen className="h-6 w-6 text-white" />
      case "FileVideo":
        return <FileVideo className="h-6 w-6 text-white" />
      default:
        return <Wand2 className="h-6 w-6 text-white" />
    }
  }

  // Get color based on input/output type
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
  const getActivityIcon = (serviceType: string, activityType?: number) => {
    // If we have an explicit activity type, use that first
    if (activityType !== undefined) {
      switch (activityType) {
        case 0:  // created a service
          return <SquarePlus className="h-5 w-5 text-blue-400" />
        case 1:  // created an agent
          return <Bot className="h-5 w-5 text-green-400" />
        case 2:  // enhance  related
          return <Sparkles className="h-5 w-5 text-orange-400" />
        case 3:  // delete agent
          return <BotOff className="h-5 w-5 text-red-400" />
        case 4:  // delete service
          return <Eraser className="h-5 w-5 text-emerald-400" />
        case 5:  // run service/workflow related
          return <Check className="h-5 w-5 text-indigo-400" />
      }
    }
    
    // Fallback to service type if activity type is not available
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
  // Helper function to get background color based on activity type
  const getActivityBgColor = (serviceType: string, activityType?: number) => {
    // If we have an explicit activity type, use that first
    if (activityType !== undefined) {
      switch (activityType) {
        case 0:  return "bg-blue-600/20"    // Video related
        case 1:  return "bg-green-600/20"   // Chat related
        case 2:  return "bg-orange-600/20"  // Audio related
        case 3:  return "bg-red-600/20"     // Video captions related
        case 4:  return "bg-emerald-600/20" // Document related
        case 5:  return "bg-indigo-600/20"  // Mini service/workflow related
      }
    }
    
    // Fallback to service type
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

  // Helper function to update the Recent Activity section rendering
  const renderActivityItem = (activity: Process) => {
    return (
      <div key={activity.id} className="flex items-start gap-4 p-4 rounded-lg hover:bg-white/5 transition-colors">
        <div className={`w-10 h-10 rounded-full ${getActivityBgColor(activity.service_type, activity.type)} flex items-center justify-center flex-shrink-0`}>
          {getActivityIcon(activity.service_type, activity.type)}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h3 className="text-white font-medium">{getActivityTitle(activity)}</h3>
            <span className="text-gray-500 text-xs">{formatDate(activity.created_at)}</span>
          </div>
          <p className="text-gray-400 text-sm mt-1">
            {activity.description || getActivityDescription(activity)}
          </p>
          
          {/* Status indicator when applicable */}
          {activity.status && activity.status !== "completed" && (
            <span className={`inline-flex items-center mt-2 px-2 py-0.5 rounded text-xs font-medium ${
              activity.status === "in_progress" 
                ? "bg-blue-900/30 text-blue-300"
                : activity.status === "failed"
                ? "bg-red-900/30 text-red-300"
                : "bg-gray-800 text-gray-300"
            }`}>
              {activity.status === "in_progress" ? "In Progress" : 
               activity.status === "failed" ? "Failed" : 
               activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
            </span>
          )}
        </div>
      </div>
    )
  }


  // Helper function to format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    
    // Today
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    }
    
    // Yesterday
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
    }
    
    // This week (within 7 days)
    const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (daysDiff < 7) {
      return date.toLocaleDateString(undefined, { weekday: 'short' }) + 
             ` at ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
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
    switch (process.type) {
      case 0:  // created a service
          return "Service Created"
        case 1:  // created an agent
          return "Agent Created"
        case 2:  // enhance  related
          return "Agent Enhanced"
        case 3:  // delete agent
          return "Agent Deleted"
        case 4:  // delete service
          return "Service Deleted"
        case 5:  // run service/workflow related
          return "Service Ran Successfully"
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

  // Enhanced filtering logic
  const filterServicesByCategory = (services: Service[]) => {
    switch (activeFilter) {
      case "trending":
        return services.filter(service => (service.usageStats?.total_runs || 0) > 50)
      case "favourites":
        return favoriteServices // Return the actual favorite services
      case "created":
        return services.filter(service => service.isCustom && service.owner_id === user_id)
      default:
        return services
    }
  }

  // Type filtering for input and output types separately
  const filterServicesByType = (services: Service[]) => {
    if (!inputTypeFilter && !outputTypeFilter) return services

    return services.filter(service => {
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
      service => 
        service.name.toLowerCase().includes(query) || 
        service.description.toLowerCase().includes(query) ||
        service.usageStats?.input_type?.toLowerCase().includes(query) ||
        service.usageStats?.output_type?.toLowerCase().includes(query)
    )
  }

  // Enhanced filtering and sorting function
  const filterAndSortServices = (services: Service[]) => {
    let filteredServices = [...services]
    
    // Apply category filter
    filteredServices = filterServicesByCategory(filteredServices)
    
    // Apply search filter
    filteredServices = filterServicesBySearch(filteredServices)
    
    // Apply type filter
    filteredServices = filterServicesByType(filteredServices)
    
    // Apply sorting
    filteredServices.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'created':
          const dateA = new Date(a.created_at || '').getTime()
          const dateB = new Date(b.created_at || '').getTime()
          comparison = dateA - dateB
          break
        case 'usage':
          const tokensA = a.usageStats?.average_token_usage?.total_tokens || 0
          const tokensB = b.usageStats?.average_token_usage?.total_tokens || 0
          comparison = tokensA - tokensB
          break
        case 'runs':
          const runsA = a.usageStats?.total_runs || 0
          const runsB = b.usageStats?.total_runs || 0
          comparison = runsA - runsB
          break
        case 'type':
          const typeA = `${a.usageStats?.input_type || ''}-${a.usageStats?.output_type || ''}`
          const typeB = `${b.usageStats?.input_type || ''}-${b.usageStats?.output_type || ''}`
          comparison = typeA.localeCompare(typeB)
          break
        case 'favorites':
          const favCountA = a.favorite_count || 0
          const favCountB = b.favorite_count || 0
          comparison = favCountA - favCountB
          break
      }
      
      return sortDirection === 'asc' ? comparison : -comparison
    })
    
    return filteredServices
  }

  // Get filtered services for display
  const getFilteredMiniServices = () => {
    if (activeFilter === "all" || activeFilter === "trending" || activeFilter === "favourites" || activeFilter === "created") {
      return filterAndSortServices(miniServices)
    }
    return []
  }

  // Helper function to render table view
  const renderTableView = () => {
    const services = getFilteredMiniServices()
    
    return (
      <div className="bg-black/60 backdrop-blur-md rounded-xl border border-purple-900/30 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-purple-900/30 hover:bg-purple-900/20">
              <TableHead className="text-purple-300 font-semibold">Service</TableHead>
              <TableHead className="text-purple-300 font-semibold">Type</TableHead>
              <TableHead className="text-purple-300 font-semibold">Owner</TableHead>
              <TableHead className="text-purple-300 font-semibold">Token Usage</TableHead>
              <TableHead className="text-purple-300 font-semibold">Runs</TableHead>
              <TableHead className="text-purple-300 font-semibold">Favorites</TableHead>
              <TableHead className="text-purple-300 font-semibold">Created</TableHead>
              <TableHead className="text-purple-300 font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => (
              <TableRow 
                key={`table-service-${service.id}`}
                className="border-purple-900/20 hover:bg-purple-900/10 cursor-pointer transition-colors"
                onClick={() => {
                  if (service.isCustom && service.id) {
                    router.push(`/apps/service/${service.id}`)
                  }
                }}
              >
                <TableCell className="py-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${service.color}`}>
                      {service.icon}
                    </div>
                    <div>
                      <div className="font-medium text-white">{service.name}</div>
                      <div className="text-sm text-gray-400 truncate max-w-xs">{service.description}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-gray-300">
                  <div className="flex flex-col space-y-1">
                    <span className="text-xs text-emerald-400">{service.usageStats?.input_type || 'Text'}</span>
                    <span className="text-xs text-gray-500">→</span>
                    <span className="text-xs text-blue-400">{service.usageStats?.output_type || 'Text'}</span>
                  </div>
                </TableCell>
                <TableCell className="text-gray-300">
                  {service.owner_username && (
                    <span className="text-sm text-purple-300">{service.owner_username}</span>
                  )}
                </TableCell>
                <TableCell className="text-gray-300">
                  <span className="text-sm">
                    {service.usageStats?.average_token_usage?.total_tokens !== undefined && 
                     !isNaN(service.usageStats.average_token_usage.total_tokens) && 
                     service.usageStats.average_token_usage.total_tokens > 0
                      ? Math.round(service.usageStats.average_token_usage.total_tokens).toLocaleString()
                      : '—'
                    }
                  </span>
                </TableCell>
                <TableCell className="text-gray-300">
                  <span className="text-sm">
                    {service.usageStats?.total_runs !== undefined && 
                     !isNaN(service.usageStats.total_runs) && 
                     service.usageStats.total_runs > 0
                      ? service.usageStats.total_runs.toLocaleString()
                      : '—'
                    }
                  </span>
                </TableCell>
                <TableCell className="text-gray-300">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-orange-400" />
                    <span className="text-sm">{service.favorite_count || 0}</span>
                  </div>
                </TableCell>
                <TableCell className="text-gray-300">
                  <span className="text-sm">
                    {service.created_at ? new Date(service.created_at).toLocaleDateString() : '—'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {/* Favorite Button */}
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
                          ? "text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/20"
                          : "text-yellow-400/60 hover:text-yellow-400 hover:bg-yellow-900/20"
                      }`}
                      title={serviceFavoriteStates[service.id] ? "Remove from favorites" : "Add to favorites"}
                    >
                      {favoriteLoadingStates[service.id] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Star 
                          className={`h-4 w-4 ${
                            serviceFavoriteStates[service.id] ? "fill-yellow-400" : "stroke-2"
                          }`} 
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
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-gray-900 border border-purple-900/30 text-white">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Service</AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-400">
                              Are you sure you want to delete "{service.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700">
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black">
      <NavBar />

      <main className="pt-24 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Search and Filter Bar */}
          <div>
            <div className="flex flex-col gap-4">
              <h1 className="text-3xl font-bold text-white"></h1>
               <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 mb-6 gap-4">
                <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center">
                  {activeFilter === "trending" ? "Trending AI Workflows" :
                   activeFilter === "favourites" ? "Your Favourite Workflows" :
                   activeFilter === "created" ? "Created By You" :
                   "All Workflows"}
                  <span className="ml-3 text-sm bg-purple-900/40 text-purple-300 px-2 py-1 rounded-full">
                    {getFilteredMiniServices().length}
                  </span>
                </h2>
                
                {/* Create New Mini Service Button - now positioned at the rightmost */}
                <Button
                  onClick={() => router.push("/apps/create")}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 shadow-lg transition-all duration-200 hover:shadow-purple-500/25 whitespace-nowrap"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create New Mini Service
                </Button>
              </div>  
              {/* Reorganized layout: Search & Filters on left, Sort & View controls on right */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                
                {/* Left side: Search and Filters */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                  {/* Search Bar */}
                  <div className="relative flex-grow max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder="Search services..." 
                      className="pl-10 bg-black/40 border-purple-900/30 text-white focus:ring-purple-500 focus:border-purple-500"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-200"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  {/* Type Filters */}
                  <div className="flex gap-2">
                    <Select value={inputTypeFilter || "all"} onValueChange={(value) => setInputTypeFilter(value === "all" ? null : value)}>
                      <SelectTrigger className="w-[140px] bg-black/40 border-purple-900/30 text-white">
                        <SelectValue placeholder="Input Type" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-purple-900/30">
                        <SelectItem value="all">All Inputs</SelectItem>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="sound">Audio/Video</SelectItem>
                        <SelectItem value="document">Document</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={outputTypeFilter || "all"} onValueChange={(value) => setOutputTypeFilter(value === "all" ? null : value)}>
                      <SelectTrigger className="w-[140px] bg-black/40 border-purple-900/30 text-white">
                        <SelectValue placeholder="Output Type" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-purple-900/30">
                        <SelectItem value="all">All Outputs</SelectItem>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="sound">Audio/Video</SelectItem>
                        <SelectItem value="document">Document</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Clear Type Filters Button */}
                    {(inputTypeFilter || outputTypeFilter) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setInputTypeFilter(null)
                          setOutputTypeFilter(null)
                        }}
                        className="bg-black/40 border-purple-900/30 text-white hover:bg-purple-900/30"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Right side: Sort and View Controls */}
                <div className="flex gap-2 flex-shrink-0">
                  {/* Enhanced Sort Dropdown with current state display */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="bg-black/40 border-purple-900/30 text-white hover:bg-purple-900/30 min-w-[180px] justify-start">
                        {sortDirection === 'asc' ? <SortAsc className="h-4 w-4 mr-2" /> : <SortDesc className="h-4 w-4 mr-2" />}
                        <span className="text-sm">
                          Sort by: {
                            sortBy === 'name' ? 'Name' :
                            sortBy === 'created' ? 'Created Date' :
                            sortBy === 'usage' ? 'Token Usage' :
                            sortBy === 'runs' ? 'Total Runs' :
                            sortBy === 'type' ? 'Type' :
                            sortBy === 'favorites' ? 'Favorites' : 'Created Date'
                          } {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                        <ChevronDown className="h-4 w-4 ml-auto" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-gray-900 border-purple-900/30" align="end">
                      <DropdownMenuLabel className="text-gray-400">Sort by</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setSortBy('name')} 
                        className={`text-white hover:bg-purple-900/30 ${sortBy === 'name' ? 'bg-purple-900/50' : ''}`}
                      >
                        <span className="flex-1">Name</span>
                        {sortBy === 'name' && <span className="text-purple-400 ml-2">✓</span>}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setSortBy('created')} 
                        className={`text-white hover:bg-purple-900/30 ${sortBy === 'created' ? 'bg-purple-900/50' : ''}`}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        <span className="flex-1">Created Date</span>
                        {sortBy === 'created' && <span className="text-purple-400 ml-2">✓</span>}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setSortBy('usage')} 
                        className={`text-white hover:bg-purple-900/30 ${sortBy === 'usage' ? 'bg-purple-900/50' : ''}`}
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        <span className="flex-1">Token Usage</span>
                        {sortBy === 'usage' && <span className="text-purple-400 ml-2">✓</span>}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setSortBy('runs')} 
                        className={`text-white hover:bg-purple-900/30 ${sortBy === 'runs' ? 'bg-purple-900/50' : ''}`}
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        <span className="flex-1">Total Runs</span>
                        {sortBy === 'runs' && <span className="text-purple-400 ml-2">✓</span>}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setSortBy('type')} 
                        className={`text-white hover:bg-purple-900/30 ${sortBy === 'type' ? 'bg-purple-900/50' : ''}`}
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        <span className="flex-1">Type</span>
                        {sortBy === 'type' && <span className="text-purple-400 ml-2">✓</span>}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setSortBy('favorites')} 
                        className={`text-white hover:bg-purple-900/30 ${sortBy === 'favorites' ? 'bg-purple-900/50' : ''}`}
                      >
                        <Star className="h-4 w-4 mr-2" />
                        <span className="flex-1">Favorites</span>
                        {sortBy === 'favorites' && <span className="text-purple-400 ml-2">✓</span>}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')} className="text-white hover:bg-purple-900/30">
                        {sortDirection === 'asc' ? <SortDesc className="h-4 w-4 mr-2" /> : <SortAsc className="h-4 w-4 mr-2" />}
                        Switch to {sortDirection === 'asc' ? 'Descending' : 'Ascending'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* View Toggle Buttons */}
                  <div className="flex gap-1 bg-black/40 border border-purple-900/30 rounded-md p-1">
                    <Button
                      variant={viewMode === 'card' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('card')}
                      className={viewMode === 'card' 
                        ? "bg-purple-600 text-white hover:bg-purple-700" 
                        : "text-gray-400 hover:text-white hover:bg-purple-900/30"
                      }
                      title="Card view"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'table' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('table')}
                      className={viewMode === 'table' 
                        ? "bg-purple-600 text-white hover:bg-purple-700" 
                        : "text-gray-400 hover:text-white hover:bg-purple-900/30"
                      }
                      title="Table view"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            

            {/* Search Results Info */}
            {searchQuery && (
              <div className="mt-2 text-sm text-gray-400">
                <span>Search results for: <span className="text-purple-400 font-medium">"{searchQuery}"</span></span>
                {activeFilter !== "all" && (
                  <span> in <span className="text-purple-400 font-medium">{activeFilter}</span></span>
                )}
              </div>
            )}

            {/* Active Filters Display */}
            {(inputTypeFilter || outputTypeFilter) && (
              <div className="mt-2 flex flex-wrap gap-2">
                {inputTypeFilter && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-900/40 text-purple-300">
                    Input: {inputTypeFilter}
                    <button
                      onClick={() => setInputTypeFilter(null)}
                      className="ml-1 hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {outputTypeFilter && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-900/40 text-purple-300">
                    Output: {outputTypeFilter}
                    <button
                      onClick={() => setOutputTypeFilter(null)}
                      className="ml-1 hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
           
            {/* Category Filter Tabs - Now on a separate row with icons */}
              <div className="mt-4">
              <Tabs 
                value={activeFilter} 
                onValueChange={(v) => setActiveFilter(v as "all" | "trending" | "favourites" | "created")}
                className="w-full"
                
              >
                <TabsList className="grid grid-cols-4 h-12 bg-black/40 border border-purple-900/30 w-full max-w-lg">
                  <TabsTrigger 
                    value="all" 
                    className="data-[state=active]:bg-purple-600 data-[state=active]:text-white flex items-center gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    All
                  </TabsTrigger>
                  <TabsTrigger 
                    value="trending" 
                    className="data-[state=active]:bg-purple-600 data-[state=active]:text-white flex items-center gap-2"
                  >
                    <TrendingUp className="h-4 w-4" />
                    Trending
                  </TabsTrigger>
                  <TabsTrigger 
                    value="favourites" 
                    className="data-[state=active]:bg-purple-600 data-[state=active]:text-white flex items-center gap-2"
                  >
                    <Star className="h-4 w-4" />
                    Favorites
                  </TabsTrigger>
                  <TabsTrigger 
                    value="created" 
                    className="data-[state=active]:bg-purple-600 data-[state=active]:text-white flex items-center gap-2"
                  >
                    <Bot className="h-4 w-4" />
                    Created By You
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            
          </div>

          {/* Services Display Section */}
          {getFilteredMiniServices().length > 0 && (
            <section className="mb-12">
              {viewMode === 'card' ? (
                /* Card View */
                <div 
                  className="max-h-[700px] overflow-y-auto pr-2 custom-scrollbar px-4 py-6 bg-black/60 backdrop-blur-md rounded-xl border border-purple-900/30"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#8b5cf6 transparent'
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-4">
                    {(miniServicesLoading || (activeFilter === "favourites" && favoritesLoading)) ? (
                      // Placeholder cards during loading
                      Array.from({ length: 6 }).map((_, index) => (
                        <div
                          key={`placeholder-${index}`}
                          className="h-[320px] bg-black/40 backdrop-blur-sm rounded-xl border border-purple-900/30 animate-pulse"
                        />
                      ))
                    ) : (
                      getFilteredMiniServices().map((service) => (
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
                          is_enhanced={service.is_enhanced}
                          requiresApiKey={service.requiresApiKey}
                          owner_username={service.owner_username}
                        />
                      ))
                    )}
                  </div>
                </div>
              ) : (
                /* Table View */
                <div className="max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                  {(miniServicesLoading || (activeFilter === "favourites" && favoritesLoading)) ? (
                    <div className="bg-black/60 backdrop-blur-md rounded-xl border border-purple-900/30 p-8 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="h-6 w-6 text-purple-500 animate-spin" />
                        <span className="text-gray-400">Loading services...</span>
                      </div>
                    </div>
                  ) : (
                    renderTableView()
                  )}
                </div>
              )}
            </section>
          )}

          {/* Show special message for Favourites */}
          {activeFilter === "favourites" && getFilteredMiniServices().length === 0 && !favoritesLoading && (
            <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-purple-900/30 p-8 text-center my-12">
              <div className="w-16 h-16 bg-purple-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-purple-400 opacity-60" />
              </div>
              <h3 className="text-white font-medium text-lg mb-1">No favorites yet</h3>
              <p className="text-gray-400">
                Star your favourite services to see them here.
              </p>
            </div>
          )}

          {/* Show empty state when no services are available and not favourites */}
          {getFilteredMiniServices().length === 0 && activeFilter !== "favourites" && !miniServicesLoading && (
            <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-purple-900/30 p-8 text-center my-12">
              <div className="w-16 h-16 bg-purple-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wand2 className="h-8 w-8 text-purple-400 opacity-60" />
              </div>
              <h3 className="text-white font-medium text-lg mb-1">No AI workflows found</h3>
              <p className="text-gray-400 mb-4">
                {activeFilter === "created" ? "You haven't created any workflows yet." :
                 activeFilter === "trending" ? "No trending workflows at the moment." :
                 "Start by creating your first AI workflow."}
              </p>
              <button
                onClick={() => router.push("/apps/create/service-workflow-builder")}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center mx-auto"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Workflow
              </button>
            </div>
          )}

          {/* Show No Results Message when necessary */}
          {(searchQuery || inputTypeFilter || outputTypeFilter) && 
           getFilteredMiniServices().length === 0 && 
           activeFilter !== "favourites" && (
            <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-purple-900/30 p-8 text-center my-12">
              <div className="w-16 h-16 bg-purple-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-purple-400 opacity-60" />
              </div>
              <h3 className="text-white font-medium text-lg mb-1">No matching services found</h3>
              <p className="text-gray-400">
                We couldn't find any services matching your criteria.
                Try adjusting your filters or search terms.
              </p>
              <div className="flex gap-2 justify-center mt-4">
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="px-4 py-2 bg-purple-600/20 text-purple-300 hover:bg-purple-600/40 transition rounded-md flex items-center"
                  >
                    <X className="h-4 w-4 mr-2" /> Clear Search
                  </button>
                )}
                {(inputTypeFilter || outputTypeFilter) && (
                  <button 
                    onClick={() => {
                      setInputTypeFilter(null)
                      setOutputTypeFilter(null)
                    }}
                    className="px-4 py-2 bg-purple-600/20 text-purple-300 hover:bg-purple-600/40 transition rounded-md flex items-center"
                  >
                    <X className="h-4 w-4 mr-2" /> Clear Filters
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Recent Activity Section - unchanged */}
          <section className="mt-16">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">Recent Activity</h2>
            
            {recentActivitiesLoading ? (
              <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-purple-900/30 p-6 flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-purple-400 animate-spin mr-3" />
                <span className="text-purple-300">Loading your recent activities...</span>
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-purple-900/30 overflow-hidden">
                <div className="divide-y divide-purple-900/30">
                  {recentActivities.map(renderActivityItem)}
                </div>
                
                
              </div>
            ) : (
              <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-purple-900/30 p-8 text-center">
                <div className="w-16 h-16 bg-purple-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-purple-400 opacity-60" />
                </div>
                <p className="text-gray-300 font-medium">You don't have any recent activities yet</p>
                <p className="text-gray-500 text-sm mt-2">Try out one of our AI services to get started!</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}