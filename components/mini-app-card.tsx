"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { ArrowRight, Trash2, Loader2, Info, Play, RotateCcw, Star } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { deleteMiniService, toggleFavorite, getFavoriteCount, checkIfFavorited } from "@/lib/services"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import { getAccessToken, decodeJWT } from "@/lib/auth"

interface UsageStats {
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
}

interface MiniAppCardProps {
  title: string
  description: string
  icon: React.ReactNode
  serviceType: string
  color: string
  isAddCard?: boolean
  isCustom?: boolean
  id?: number
  onDelete?: (id: number) => Promise<boolean> | boolean
  usageStats?: UsageStats
  is_enhanced?: boolean | null
  requiresApiKey?: boolean
  owner_username?: string
  is_public?: boolean
}

export function MiniAppCard({
  title,
  description,
  icon,
  serviceType,
  color,
  isAddCard = false,
  isCustom = false,
  id,
  onDelete,
  usageStats,
  is_enhanced,
  requiresApiKey,
  owner_username,
  is_public,
}: Readonly<MiniAppCardProps>) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
  const [titleNeedsAnimation, setTitleNeedsAnimation] = useState(false)
  const [backTitleNeedsAnimation, setBackTitleNeedsAnimation] = useState(false)
  const titleRef = useRef<HTMLSpanElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const backTitleRef = useRef<HTMLSpanElement>(null)
  const backContainerRef = useRef<HTMLDivElement>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteCount, setFavoriteCount] = useState(0)  // Check if current user is the owner of the service
  const isCurrentUserOwner = (): boolean => {
    if (!owner_username) {
      return true // If no owner specified, allow delete (backward compatibility)
    }

    try {
      const token = getAccessToken()
      if (!token) return false

      const decodedToken = decodeJWT(token)
      if (!decodedToken?.username) return false

      return decodedToken.username === owner_username
    } catch (error) {
      console.error("Error checking user ownership:", error)
      return false
    }
  }

  // Check if title needs animation on mount and when title changes
  useEffect(() => {
    if (titleRef.current && containerRef.current && !isAddCard) {
      const titleWidth = titleRef.current.scrollWidth
      const containerWidth = containerRef.current.clientWidth - 60 // Account for smaller buttons and padding
      setTitleNeedsAnimation(titleWidth > containerWidth)
    }

    if (backTitleRef.current && backContainerRef.current && !isAddCard) {
      const titleWidth = backTitleRef.current.scrollWidth
      const containerWidth = backContainerRef.current.clientWidth - 30 // Account for smaller back button
      setBackTitleNeedsAnimation(titleWidth > containerWidth)
    }
  }, [title, isAddCard, isFlipped])

  const handleClick = () => {
    if (isAddCard) {
      router.push("/apps/create/service-workflow-builder")
      return
    }

    if (isCustom && id) {
      router.push(`/apps/service/${id}`)
    } else {
      const serviceId = getServiceIdByType(serviceType)
      router.push(`/apps/service/${serviceId}`)
    }
  }

  // Helper function to get service ID by type
  const getServiceIdByType = (type: string): number => {
    const serviceMap: Record<string, number> = {
      "video-translation": 6,
      "bedtime-story": 3,
      "ai-chat": 7,
      "text-to-image": 8,
      "audio-documents": 9,
      "video-captions": 10,
      "daily-recap": 4,
    }

    return serviceMap[type] || 0
  }

  // Handle delete button click
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    setShowDeleteDialog(true)
  }

  // Handle info button click (flip card)
  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    setIsFlipped(!isFlipped)
  }

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!id) return;

    setIsDeleting(true);

    try {
      const success = await deleteMiniService(id, {
        showToast: true,
        toastMessage: `"${title}" has been deleted successfully.`,
        onSuccess: () => {
          setShowDeleteDialog(false);
        }
      });

      if (success && onDelete) {
        try {
          onDelete(id);
        } catch (callbackError) {
          console.error("Error in onDelete callback:", callbackError);
        }
      }

      if (success) {
        setTimeout(() => {
          router.refresh();
          router.push("/apps");
        }, 300);
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: "There was a problem deleting this service. Please try again.",
      });
      setShowDeleteDialog(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle favorite button click
  const handleFavoriteClick = async () => {
    if (!id) return;

    setIsTogglingFavorite(true);

    try {
      const result = await toggleFavorite(id);

      if (result.success) {
        setIsFavorite(result.isFavorited);

        // Refresh favorite count from server to ensure accuracy
        try {
          const updatedCount = await getFavoriteCount(id);
          setFavoriteCount(updatedCount);
        } catch (error) {
          console.error("Error refreshing favorite count:", error);
          // Fallback to local update if server refresh fails
          if (result.isFavorited) {
            setFavoriteCount(favoriteCount + 1);
          } else {
            setFavoriteCount(Math.max(0, favoriteCount - 1));
          }
        }

        toast({
          title: "Success",
          description: `"${title}" has been ${result.isFavorited ? "added to" : "removed from"} favorites.`,
        });

        // Dispatch event to notify other components about favorite change
        window.dispatchEvent(new Event("favoriteToggled"));
      } else {
        throw new Error("Failed to toggle favorite");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({
        variant: "destructive",
        title: "Favorite Toggle Failed",
        description: "There was a problem toggling this service's favorite status. Please try again.",
      });
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  // Load favorite status and count
  useEffect(() => {
    if (id) {
      const loadFavoriteStatus = async () => {
        try {

          const isFavorited = await checkIfFavorited(id);

          setIsFavorite(isFavorited);

          const count = await getFavoriteCount(id);

          setFavoriteCount(count);
        } catch (error) {

        }
      };
      loadFavoriteStatus();
    }
  }, [id]);

  return (
    <>
      <div
        onClick={handleClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className="cursor-pointer group relative h-64 transform transition-all duration-200 p-2"
        style={{ perspective: '1000px' }}
      >
        {/* Lightweight background glow */}
        <div
          className={cn(
            "absolute -inset-1 rounded-3xl bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-200 blur-lg",
            color,
          )}
        />

        {/* Card container with flip animation */}
        <div
          className={cn(
            "h-full transform-style-preserve-3d transition-transform duration-400 relative z-10",
            isFlipped && "rotate-y-180"
          )}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front side of card */}
          <div
            className={cn(
              "h-full bg-gradient-to-br from-gray-900/40 via-gray-800/30 to-gray-900/40 backdrop-blur-xl rounded-xl border border-gray-600/30 flex flex-col transition-all duration-200 relative overflow-hidden absolute inset-2 shadow-2xl",
              isHovering && "border-purple-500/50 from-gray-900/60 via-gray-800/50 to-gray-900/60",
              isAddCard ? "p-4 justify-center items-center" : "p-4"
            )}
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* Lightweight background glow effect on hover */}
            <div
              className={cn(
                "absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 transition-opacity duration-200",
                isHovering && "opacity-10",
                color
              )}
            />
            {/* Subtle static background with depth */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-500/20 via-transparent to-blue-500/20"></div>
              <div className="absolute top-0 right-0 w-3/4 h-3/4 bg-gradient-to-bl from-pink-500/15 to-transparent rounded-full blur-xl"></div>
              <div className="absolute bottom-0 left-0 w-3/4 h-3/4 bg-gradient-to-tr from-cyan-500/15 to-transparent rounded-full blur-xl"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
            </div>

            {/* Simplified border effects */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent group-hover:via-purple-300/70 transition-all duration-200"></div>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200"></div>
            {isAddCard ? (
              // Modern "Create New" card
              <>
                <div className={cn(
                  "w-20 h-20 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-2xl transition-all duration-200 group-hover:scale-105 mb-6 relative overflow-hidden border border-white/10",
                  color
                )}>
                  <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
                  <div className="relative z-10 transform transition-transform duration-200 group-hover:scale-110">
                    {icon}
                  </div>
                  {/* Static particles effect */}
                  <div className="absolute top-2 right-2 w-1 h-1 bg-white/60 rounded-full"></div>
                  <div className="absolute bottom-3 left-3 w-1.5 h-1.5 bg-purple-400/80 rounded-full"></div>
                </div>
                <div className="text-center space-y-3 relative z-10">
                  <h3 className="text-white text-xl font-bold tracking-wide bg-gradient-to-r from-white via-purple-100 to-blue-100 bg-clip-text text-transparent">
                    Create New Service
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed max-w-xs mx-auto">
                    Build a custom AI workflow with our intuitive drag-and-drop builder
                  </p>
                  <div className="inline-flex items-center text-purple-300 text-sm font-medium bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10 backdrop-blur-sm border border-purple-400/20 px-4 py-2 rounded-full hover:border-purple-400/40 transition-all duration-200">
                    <span className="w-2 h-2 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full mr-2"></span>
                    Click to get started
                  </div>
                </div>
              </>
            ) : (
              // Enhanced regular service card
              <>
                {/* Modern service icon and title section with glassmorphism */}
                <div className="flex items-start space-x-3 mb-4 relative z-10">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-xl transition-all duration-200 group-hover:scale-105 relative overflow-hidden flex-shrink-0 border border-white/10",
                    color
                  )}>
                    <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl"></div>
                    <div className="relative z-10 transform transition-transform duration-200 group-hover:scale-105">
                      {icon}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 pr-16" ref={containerRef}>
                    <div className="flex items-center mb-2">
                      <h3 className="text-base font-bold text-white tracking-wide flex items-center bg-gradient-to-r from-white via-gray-100 to-gray-200 bg-clip-text text-transparent overflow-hidden">
                        <span
                          ref={titleRef}
                          className={cn(
                            "whitespace-nowrap",
                            titleNeedsAnimation && "title-slide"
                          )}
                        >
                          {title}
                        </span>
                      </h3>
                    </div>                      {/* Owner username and privacy indicator side by side */}
                    <div className="mb-2 flex items-center gap-2 flex-wrap">
                      {/* Owner username with modern styling */}
                      {owner_username && (
                        <div className="inline-flex items-center bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-400/20 rounded-full px-2 py-1">
                          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-1.5"></div>
                          <span className="text-[11px] text-gray-400">created by </span>
                          <span className="text-[11px] font-medium text-purple-300 ml-1">{owner_username}</span>
                        </div>
                      )}                      {/* Privacy indicator for owner */}
                      {isCurrentUserOwner() && (
                        <div className={`inline-flex items-center rounded-full px-2 py-1 border ${is_public === true
                            ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-400/20 text-green-300"
                            : "bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-400/20 text-blue-300"
                          }`}>
                          <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${is_public === true ? "bg-green-400" : "bg-blue-400"
                            }`}></div>
                          <span className="text-[11px] font-medium">
                            {is_public === true ? "Public" : "Private"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Modern service type indicators with glassmorphism */}
                    <div className="flex items-center space-x-2">
                      <div className="inline-flex items-center text-[11px] font-medium text-gray-300 bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-400/20 px-2 py-1 rounded-full backdrop-blur-sm">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1.5"></span>
                        {usageStats?.input_type ?? "Text"}
                      </div>
                      <div className="text-gray-500 text-xs">→</div>
                      <div className="inline-flex items-center text-[11px] font-medium text-gray-300 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-400/20 px-2 py-1 rounded-full backdrop-blur-sm">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-1.5"></span>
                        {usageStats?.output_type ?? "Text"}
                      </div>
                    </div>
                  </div>

                  {/* Modern action buttons with glassmorphism */}
                  <div className="absolute top-0 right-0 flex gap-1.5">
                    {/* Favorite star button with modern design */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFavoriteClick();
                      }}
                      className={cn(
                        "p-2 rounded-xl backdrop-blur-sm transition-all duration-150 border shadow-lg",
                        isFavorite
                          ? "bg-gradient-to-r from-orange-500/60 to-amber-500/60 text-orange-300 border-orange-400/50 hover:from-orange-400/60 hover:to-amber-400/60"
                          : "bg-gradient-to-r from-gray-800/60 to-gray-900/60 text-gray-400 border-gray-600/30 hover:text-orange-400 hover:from-orange-500/20 hover:to-orange-600/20 hover:border-orange-500/50"
                      )}
                      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                      disabled={isTogglingFavorite}
                    >
                      {isTogglingFavorite ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-400" />
                      ) : (
                        <Star className={cn("h-3.5 w-3.5", isFavorite && "fill-current")} />
                      )}
                    </button>

                    {/* Info button with modern design */}
                    <button
                      onClick={handleInfoClick}
                      className="p-2 rounded-xl bg-gradient-to-r from-gray-800/60 to-gray-900/60 backdrop-blur-sm text-gray-400 hover:text-blue-400 hover:from-blue-500/20 hover:to-blue-600/20 transition-all duration-150 border border-gray-600/30 hover:border-blue-500/50 shadow-lg"
                      aria-label="Show description"
                      title="Show description"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>

                    {/* Delete button with modern design */}
                    {isCustom && isCurrentUserOwner() && (
                      <button
                        onClick={handleDeleteClick}
                        className="p-2 rounded-xl bg-gradient-to-r from-gray-800/60 to-gray-900/60 backdrop-blur-sm text-gray-400 hover:text-red-400 hover:from-red-500/20 hover:to-red-600/20 transition-all duration-150 border border-gray-600/30 hover:border-red-500/50 shadow-lg"
                        aria-label="Delete service"
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-400" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
                {/* Modern stats badge with gradient background */}
                <div className="flex justify-between items-center mb-4 relative z-10">
                  {/* Runtime badge */}
                  <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10 backdrop-blur-sm border border-purple-400/20 rounded-full px-3 py-1.5 hover:border-purple-400/40 transition-all duration-150 group/stat">
                    <div className="w-2 h-2 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full"></div>
                    <span className="text-xs font-medium text-gray-300">{usageStats?.run_time !== undefined && !isNaN(usageStats.run_time) ? `${Math.round(usageStats.run_time)} runs` : "No runs"}</span>
                  </div>

                  {/* Status indicator */}
                  <div className="flex items-center space-x-1">
                    {/* Favorites badge */}
                    <div className="inline-flex items-center bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-400/20 rounded-full px-2 py-1">
                      <Star className="h-3 w-3 text-orange-400 mr-1" />
                      <span className="text-orange-300 text-[10px] font-medium">{favoriteCount} favorites</span>
                    </div>

                    {is_enhanced === true && (
                      <div className="inline-flex items-center bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-400/20 rounded-full px-2 py-1">
                        <span className="text-yellow-400 text-xs">✨</span>
                        <span className="text-yellow-300 text-[10px] font-medium ml-1">Enhanced</span>
                      </div>
                    )}
                  </div>
                </div>
                {/* Enhanced "Run Service" button with modern glassmorphism */}
                <button
                  className="absolute bottom-0 left-0 right-0 text-center py-4 bg-gradient-to-r from-purple-600/20 via-blue-600/15 to-purple-600/20 hover:from-purple-500/30 hover:via-blue-500/25 hover:to-purple-500/30 text-white transition-all duration-200 border-t border-purple-400/20 text-sm font-semibold flex items-center justify-center group/button rounded-b-xl backdrop-blur-md hover:backdrop-blur-lg shadow-lg hover:shadow-purple-500/15"
                >
                  <div className="flex items-center space-x-2 relative z-10">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center transition-all duration-200 group-hover/button:bg-white/30">
                      <Play className="h-3 w-3 fill-current" />
                    </div>
                    <span className="tracking-wide">Go to Service</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/button:translate-x-1" />
                  </div>

                  {/* Subtle shimmer effect */}
                  <div className="absolute inset-0 opacity-0 group-hover/button:opacity-100 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-all duration-600 ease-in-out rounded-b-xl transform -skew-x-12 group-hover/button:translate-x-full"></div>

                  {/* Top highlight */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-60"></div>
                </button>
              </>
            )}
          </div>

          {/* Back side of card (description) */}
          {!isAddCard && (
            <div
              className={cn(
                "h-full bg-gradient-to-br from-gray-900/40 via-gray-800/30 to-gray-900/40 backdrop-blur-xl rounded-xl border flex flex-col transition-all duration-200 relative overflow-hidden absolute inset-2 p-4 rotate-y-180 shadow-2xl",
                "border-gray-600/30 group-hover:border-purple-500/50"
              )}
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              {/* Lightweight background glow effect on hover */}
              <div
                className={cn(
                  "absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 transition-opacity duration-200",
                  isHovering && "opacity-10",
                  color
                )}
              />

              {/* Subtle static background with depth */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-500/20 via-transparent to-blue-500/20"></div>
                <div className="absolute top-0 right-0 w-3/4 h-3/4 bg-gradient-to-bl from-pink-500/15 to-transparent rounded-full blur-xl"></div>
                <div className="absolute bottom-0 left-0 w-3/4 h-3/4 bg-gradient-to-tr from-cyan-500/15 to-transparent rounded-full blur-xl"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
              </div>

              {/* RGB gradient border effects for whole card */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/10 via-green-500/10 to-blue-500/10"></div>
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-red-400/30 via-green-400/30 to-blue-400/30"></div>
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-blue-400/30 via-purple-400/30 to-red-400/30"></div>
              <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-green-400/30 via-blue-400/30 to-purple-400/30"></div>
              <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-purple-400/30 via-red-400/30 to-green-400/30"></div>

              {/* Modern back button with glassmorphism */}
              <div className="absolute top-3 right-3 z-20">
                <button
                  onClick={handleInfoClick}
                  className="p-2 rounded-xl bg-gradient-to-r from-gray-800/60 to-gray-900/60 backdrop-blur-sm text-gray-400 hover:text-blue-400 hover:from-blue-500/20 hover:to-blue-600/20 transition-all duration-150 border border-gray-600/30 hover:border-blue-500/50 shadow-lg"
                  aria-label="Go back"
                  title="Go back"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Modern description section - always show with fallback */}
              <div className="flex-1 mb-3 relative z-10">
                <div className="bg-gradient-to-br from-gray-900/60 via-gray-800/40 to-gray-900/60 backdrop-blur-sm rounded-xl p-4 h-full transition-all duration-200 relative overflow-hidden">
                  <div className="relative z-10">
                    <h4 className="text-sm font-semibold text-gray-200 mb-3 flex items-center">
                      <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full mr-2"></div>
                      Service Description
                    </h4>
                    <p className={`text-sm leading-relaxed ${description && description.trim() ? 'text-gray-300' : 'text-gray-500 italic'}`}>
                      {description && description.trim() ? description : 'This service does not have any description.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Compact stats grid without borders */}
              <div className="grid grid-cols-2 gap-3 relative z-10 h-16">
                {/* Service Type Card */}
                <div className="bg-gradient-to-br from-gray-900/60 via-gray-800/40 to-gray-900/60 backdrop-blur-sm rounded-xl p-2 text-center transition-all duration-200 relative overflow-hidden h-full flex flex-col justify-center">
                  <div className="relative z-10">
                    <span className="block text-emerald-300 text-[10px] font-medium mb-1">Service Type</span>
                    <div className="flex items-center justify-center space-x-1">
                      <span className="text-gray-200 text-[10px] font-semibold">{usageStats?.input_type ?? "Text"}</span>
                      <div className="text-emerald-400 text-[10px]">→</div>
                      <span className="text-gray-200 text-[10px] font-semibold">{usageStats?.output_type ?? "Text"}</span>
                    </div>
                  </div>
                </div>

                {/* Tokens Usage Card */}
                <div className="bg-gradient-to-br from-gray-900/60 via-gray-800/40 to-gray-900/60 backdrop-blur-sm rounded-xl p-2 text-center transition-all duration-200 relative overflow-hidden h-full flex flex-col justify-center">
                  <div className="relative z-10">
                    <span className="block text-blue-300 text-[10px] font-medium mb-1">Avg. API Token Usage</span>
                    <span className="text-gray-200 text-[10px] font-semibold">
                      {(() => {
                        const hasTokenUsage = usageStats?.average_token_usage?.total_tokens !== undefined &&
                          !isNaN(usageStats.average_token_usage.total_tokens) &&
                          usageStats.average_token_usage.total_tokens > 0;
                        const hasRuns = usageStats?.run_time !== undefined &&
                          !isNaN(usageStats.run_time) &&
                          usageStats.run_time > 0;

                        if (hasTokenUsage) {
                          return Math.round(usageStats.average_token_usage.total_tokens).toLocaleString();
                        } else if (hasRuns && !hasTokenUsage) {
                          return (
                            <span className="text-emerald-300 text-[9px] leading-tight">
                              No API keys required
                            </span>
                          );
                        } else {
                          return "—";
                        }
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-gray-900 border border-purple-900/30 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete the "{title}" service? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Yes, Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <style>{`
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        .transform-style-preserve-3d {
          transform-style: preserve-3d;
        }
        .title-slide {
          display: inline-block;
          animation: slide-text 10s linear infinite;
        }
        .title-slide:hover {
          animation-play-state: paused;
        }
        @keyframes slide-text {
          0%, 15% {
            transform: translateX(0);
          }
          85%, 100% {
            transform: translateX(calc(-100% + 120px));
          }
        }
      `}</style>
    </>
  )
}