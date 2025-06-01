"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { ArrowRight, Trash2, Loader2, Info, Play, RotateCcw } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { deleteMiniService } from "@/lib/services"
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
}: Readonly<MiniAppCardProps>) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
  const [titleNeedsAnimation, setTitleNeedsAnimation] = useState(false)
  const [backTitleNeedsAnimation, setBackTitleNeedsAnimation] = useState(false)
  const titleRef = useRef<HTMLSpanElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const backTitleRef = useRef<HTMLSpanElement>(null)
  const backContainerRef = useRef<HTMLDivElement>(null)

  // Check if title needs animation on mount and when title changes
  useEffect(() => {
    if (titleRef.current && containerRef.current && !isAddCard) {
      const titleWidth = titleRef.current.scrollWidth
      const containerWidth = containerRef.current.clientWidth - 80 // Account for buttons and padding
      setTitleNeedsAnimation(titleWidth > containerWidth)
    }
    
    if (backTitleRef.current && backContainerRef.current && !isAddCard) {
      const titleWidth = backTitleRef.current.scrollWidth
      const containerWidth = backContainerRef.current.clientWidth - 40 // Account for back button
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
  };  return (
    <>      <div
        onClick={handleClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className="cursor-pointer group relative h-80 transform transition-all duration-300 p-3"
        style={{ perspective: '1000px' }}
      >{/* Background glow effects - positioned behind everything */}
        <div
          className={cn(
            "absolute -inset-1 rounded-3xl bg-gradient-to-br opacity-0 group-hover:opacity-20 transition-all duration-700 blur-2xl",
            color,
          )}
        />
        
        {/* Secondary glow layer for depth */}
        <div
          className={cn(
            "absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-all duration-500 delay-100 blur-xl",
            color,
          )}
        />

        {/* Card container with flip animation */}
        <div
          className={cn(
            "h-full transform-style-preserve-3d transition-transform duration-700 relative z-10",
            isFlipped && "rotate-y-180"
          )}
          style={{ transformStyle: 'preserve-3d' }}
        >{/* Front side of card */}          <div
            className={cn(
              "h-full bg-transparent rounded-2xl border border-gray-700/50 flex flex-col transition-all duration-500 relative overflow-hidden absolute inset-3 shadow-2xl",
              isHovering && "scale-[1.01] shadow-purple-900/30 border-purple-600/60",
              isAddCard ? "p-6 justify-center items-center" : "p-5"
            )}
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* Background glow effect on hover */}
            <div 
              className={cn(
                "absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 transition-all duration-700",
                isHovering && "opacity-20",
                color
              )}
            />            {/* Animated background gradient mesh */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-500/20 via-transparent to-indigo-500/20 animate-pulse"></div>
              <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-pink-500/10 to-transparent rounded-full"></div>
              <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full"></div>
            </div>

            {/* Enhanced border highlights */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent"></div>            {isAddCard ? (
              // Enhanced "Create New" card
              <>
                <div className={cn(
                  "w-20 h-20 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 mb-6 relative overflow-hidden",
                  color
                )}>
                  <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10 transform transition-transform duration-300 group-hover:scale-110">
                    {icon}
                  </div>
                </div>
                <div className="text-center space-y-3">
                  <h3 className="text-white text-xl font-bold tracking-wide bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Create New Service
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                    Build a custom AI workflow with our intuitive drag-and-drop builder
                  </p>                  <div className="inline-flex items-center text-purple-400 text-xs font-medium bg-purple-500/10 px-3 py-1 rounded-full">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></span>
                    {" "}Click to get started
                  </div>
                </div>
              </>
            ) : (              // Enhanced regular service card
              <>
                {/* Service icon and title section with better visual hierarchy */}                <div className="flex items-start space-x-4 mb-4 relative z-10">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-lg transition-all duration-500 group-hover:scale-110 relative overflow-hidden",
                    color
                  )}>
                    <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10 transform transition-transform duration-300 group-hover:scale-110">
                      {icon}
                    </div>
                  </div>
                    <div className="flex-1 min-w-0 pr-20" ref={containerRef}>                    <div className="flex items-center mb-1">
                      <h3 className="text-base font-bold text-white tracking-wide flex items-center bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent overflow-hidden">
                        <span 
                          ref={titleRef}
                          className={cn(
                            "whitespace-nowrap",
                            titleNeedsAnimation && "title-slide"
                          )}
                        >
                          {title}
                        </span>
                        {is_enhanced === true && (
                          <span className="ml-2 text-yellow-400 animate-pulse flex-shrink-0" title="Enhanced Service">
                            ✨
                          </span>
                        )}
                      </h3>
                    </div>
                    
                    {/* Owner username display */}
                    {owner_username && (
                      <div className="mb-2">
                        <span className="text-xs text-gray-500">by </span>
                        <span className="text-xs font-medium text-purple-300">{owner_username}</span>
                      </div>
                    )}
                    
                    {/* Service type indicators */}
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="inline-flex items-center text-xs font-medium text-gray-400 bg-gray-800/50 px-2 py-1 rounded-md">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1.5"></span>
                        {usageStats?.input_type ?? "Text"}
                      </div>
                      <span className="text-gray-500">→</span>
                      <div className="inline-flex items-center text-xs font-medium text-gray-400 bg-gray-800/50 px-2 py-1 rounded-md">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-1.5"></span>
                        {usageStats?.output_type ?? "Text"}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="absolute top-0 right-0 flex gap-1.5">                    {/* Info button */}
                    <button
                      onClick={handleInfoClick}
                      className="p-2 rounded-xl bg-gray-800/60 text-gray-400 hover:text-blue-400 hover:bg-blue-500/20 transition-all duration-300 hover:scale-110 border border-gray-700/50 hover:border-blue-500/50"
                      aria-label="Show description"
                      title="Show description"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                    
                    {/* Delete button */}
                    {isCustom && (
                      <button
                        onClick={handleDeleteClick}
                        className="p-2 rounded-xl bg-gray-800/60 text-gray-400 hover:text-red-400 hover:bg-red-500/20 transition-all duration-300 hover:scale-110 border border-gray-700/50 hover:border-red-500/50"
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
                </div>                {/* Stats with enhanced visual design */}
                <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
                  <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-xl p-3 border border-gray-700/30 hover:border-purple-500/30 transition-all duration-300 group/stat">
                    <div className="flex items-center justify-between mb-1">
                      <span className="block text-gray-400 text-xs font-medium">Tokens</span>
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full group-hover/stat:animate-pulse"></div>
                    </div>                    <span className="text-white font-bold text-lg">
                      {usageStats?.average_token_usage?.total_tokens !== undefined && !isNaN(usageStats.average_token_usage.total_tokens) ?
                        Math.round(usageStats.average_token_usage.total_tokens) :
                        "—"
                      }
                    </span>
                  </div>
                  
                  <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-xl p-3 border border-gray-700/30 hover:border-purple-500/30 transition-all duration-300 group/stat">
                    <div className="flex items-center justify-between mb-1">
                      <span className="block text-gray-400 text-xs font-medium">Runs</span>
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full group-hover/stat:animate-pulse"></div>
                    </div>
                    <span className="text-white font-bold text-lg">
                      {usageStats?.run_time !== undefined && !isNaN(usageStats.run_time) ?
                        Math.round(usageStats.run_time) :
                        "—"
                      }
                    </span>
                  </div>
                </div>                {/* Enhanced "Run Service" button with better hover effects */}
                <button
                  className="absolute bottom-0 left-0 right-0 text-center py-4 bg-gradient-to-r from-purple-600/80 via-purple-700/80 to-purple-600/80 hover:from-purple-500/90 hover:via-purple-600/90 hover:to-purple-500/90 text-white transition-all duration-300 border-t border-purple-500/40 text-sm font-semibold flex items-center justify-center group/button"
                >
                  <div className="flex items-center space-x-2 relative z-10">
                    <Play className="h-4 w-4 transition-transform duration-300 group-hover/button:scale-110" />
                    <span>Run Service</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/button:translate-x-1" />
                  </div>

                  {/* Enhanced shine effect */}
                  <div className="absolute inset-0 opacity-0 group-hover/button:opacity-100 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-opacity duration-700 ease-in-out"></div>
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover/button:opacity-100 transition-opacity duration-300"></div>
                </button>
              </>
            )}
          </div>

          {/* Back side of card (description) */}          {!isAddCard && (            <div
              className={cn(
                "h-full bg-transparent rounded-xl border border-purple-900/40 flex flex-col transition-all duration-300 relative overflow-hidden absolute inset-2 p-4 rotate-y-180",
                isHovering && "scale-[1.01] shadow-lg shadow-purple-900/20 z-10 border-purple-600/40"
              )}
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              {/* Subtle background pattern */}
              <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.15)_0%,_transparent_70%)]"></div>

              {/* Back button */}
              <div className="absolute top-3 right-3">
                <button
                  onClick={handleInfoClick}
                  className="p-1.5 rounded-full bg-black/60 text-gray-400 hover:text-blue-400 hover:bg-black/80 transition-all hover:scale-110 z-10"
                  aria-label="Go back"
                  title="Go back"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
              </div>              {/* Title */}
              <div className="flex items-center space-x-3 mb-4">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br shadow-md",
                  color
                )}>
                  {icon}
                </div>                <div className="flex-1 min-w-0" ref={backContainerRef}>
                  <h3 className="text-sm font-semibold text-white tracking-wide flex items-center overflow-hidden">
                    <span 
                      ref={backTitleRef}
                      className={cn(
                        "whitespace-nowrap",
                        backTitleNeedsAnimation && "title-slide"
                      )}
                    >
                      {title}
                    </span>
                    {is_enhanced === true && (
                      <span className="ml-2 text-yellow-400 flex-shrink-0" title="Enhanced Service">
                        ✨
                      </span>
                    )}
                  </h3>
                  {owner_username && (
                    <div className="mt-1">
                      <span className="text-[10px] text-gray-500">by </span>
                      <span className="text-[10px] font-medium text-purple-300">{owner_username}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="flex-1 overflow-y-auto">
                <div className="bg-black/40 rounded-md p-3 h-full">
                  <h4 className="text-xs font-medium text-purple-300 mb-2">Description</h4>
                  <p className="text-gray-300 text-xs leading-relaxed">{description}</p>
                </div>
              </div>

              {/* Quick stats on back */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="bg-black/40 rounded-md p-2 text-center">
                  <span className="block text-purple-300/80 text-[10px] font-medium">Type</span>
                  <span className="text-gray-200 text-xs font-semibold">
                    {usageStats?.input_type} → {usageStats?.output_type}
                  </span>
                </div>
                <div className="bg-black/40 rounded-md p-2 text-center">
                  <span className="block text-purple-300/80 text-[10px] font-medium">Status</span>
                  <span className="text-green-400 text-xs font-semibold">Active</span>
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
          </AlertDialogFooter>        </AlertDialogContent>
      </AlertDialog>      <style>{`
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