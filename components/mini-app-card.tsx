"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { ArrowRight, Trash2, Loader2, Clock, Cpu, Info, Play, RotateCcw } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
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
  is_enhanced?: boolean
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
}: Readonly<MiniAppCardProps>) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)

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

  return (
    <>
      <div
        onClick={handleClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className="cursor-pointer group relative h-64 transform transition-all duration-300"
        style={{ perspective: '1000px' }}
      >
        {/* Enhanced background glow effect */}
        <div
          className={cn(
            "absolute inset-0 rounded-xl bg-gradient-to-br opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-500",
            color,
          )}
        />

        {/* Card container with flip animation */}
        <div
          className={cn(
            "h-full transform-style-preserve-3d transition-transform duration-700 relative",
            isFlipped && "rotate-y-180"
          )}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front side of card */}
          <div
            className={cn(
              "h-full bg-black/50 backdrop-blur-md rounded-xl border border-purple-900/40 flex flex-col transition-all duration-300 relative overflow-hidden absolute inset-0",
              isHovering && "scale-105 shadow-lg shadow-purple-900/20 z-10 border-purple-600/40",
              isAddCard ? "p-5 justify-center items-center" : "p-4"
            )}
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.15)_0%,_transparent_70%)]"></div>

            {isAddCard ? (
              // Enhanced "Create New" card
              <>
                <div className={cn(
                  "w-16 h-16 rounded-lg flex items-center justify-center bg-gradient-to-br shadow-md transition-transform duration-300 group-hover:scale-110 mb-5",
                  color
                )}>
                  {icon}
                </div>
                <p className="text-white text-center font-medium text-lg tracking-wide">Create New</p>
                <div className="mt-2 text-purple-300/80 text-xs text-center">Click to add service</div>
              </>
            ) : (
              // Enhanced regular service card
              <>
                {/* Top shine effect */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>

                {/* Service icon and title section with better visual hierarchy */}
                <div className="flex items-center space-x-3 mb-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br shadow-md transition-all duration-300 group-hover:scale-110",
                    color
                  )}>
                    {icon}
                  </div>
                  <div className="flex-1 pr-6">
                    <h3 className="text-sm font-semibold text-white tracking-wide flex items-center">
                      {title}
                      {is_enhanced && (
                        <span className="ml-2 text-yellow-400" title="Enhanced Service">
                          ✨
                        </span>
                      )}
                    </h3>
                  </div>

                  {/* Action buttons */}
                  <div className="absolute top-3 right-3 flex gap-1">
                    {/* Info button */}
                    <button
                      onClick={handleInfoClick}
                      className="p-1.5 rounded-full bg-black/60 text-gray-400 hover:text-blue-400 hover:bg-black/80 transition-all hover:scale-110 z-10"
                      aria-label="Show description"
                      title="Show description"
                    >
                      <Info className="h-3 w-3" />
                    </button>
                    
                    {/* Delete button */}
                    {isCustom && (
                      <button
                        onClick={handleDeleteClick}
                        className="p-1.5 rounded-full bg-black/60 text-gray-400 hover:text-red-400 hover:bg-black/80 transition-all hover:scale-110 z-10"
                        aria-label="Delete service"
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <Loader2 className="h-3 w-3 animate-spin text-purple-400" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Service details with improved styling */}
                <div className="mb-3 text-xs space-y-1">
                  <div className="flex items-center">
                    <span className="text-gray-400 w-14 inline-block font-medium">Input:</span>
                    <span className="text-gray-200">{usageStats?.input_type || "Text"}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-400 w-14 inline-block font-medium">Output:</span>
                    <span className="text-gray-200">{usageStats?.output_type || "Text"}</span>
                  </div>
                </div>

                {/* Stats with enhanced visual design */}
                <div className="grid grid-cols-2 gap-3 mb-12">
                  <div className="bg-black/40 rounded-md p-2 backdrop-blur-sm border border-purple-900/20">
                    <span className="block text-purple-300/80 text-[10px] font-medium mb-0.5">Avg. Tokens</span>
                    <span className="text-gray-200 flex items-center font-semibold">
                      {usageStats?.average_token_usage?.total_tokens !== undefined ?
                        Math.round(usageStats.average_token_usage.total_tokens) :
                        "—"
                      }
                    </span>
                  </div>
                  <div className="bg-black/40 rounded-md p-2 backdrop-blur-sm border border-purple-900/20">
                    <span className="block text-purple-300/80 text-[10px] font-medium mb-0.5">Total Runs</span>
                    <span className="text-gray-200 flex items-center font-semibold">
                      {usageStats?.total_runs !== undefined ?
                        usageStats.total_runs :
                        "—"
                      }
                    </span>
                  </div>
                </div>

                {/* Enhanced "Open App" button with better hover effects */}
                <button
                  className="absolute bottom-0 left-0 right-0 text-center py-3 bg-gradient-to-r from-purple-900/60 via-purple-800/60 to-purple-900/60 hover:from-purple-800/70 hover:to-purple-700/70 text-purple-200 transition-all duration-300 border-t border-purple-500/30 text-sm font-medium flex items-center justify-center group"
                >
                  <Play className="mr-1.5 h-3 w-3" />
                  <span>Run Service</span>
                  <ArrowRight className="ml-1.5 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />

                  {/* Subtle shine effect on button hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-transparent via-white/5 to-transparent transition-opacity duration-1000 ease-in-out"></div>
                </button>
              </>
            )}
          </div>

          {/* Back side of card (description) */}
          {!isAddCard && (
            <div
              className={cn(
                "h-full bg-black/50 backdrop-blur-md rounded-xl border border-purple-900/40 flex flex-col transition-all duration-300 relative overflow-hidden absolute inset-0 p-4 rotate-y-180",
                isHovering && "scale-105 shadow-lg shadow-purple-900/20 z-10 border-purple-600/40"
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
              </div>

              {/* Title */}
              <div className="flex items-center space-x-3 mb-4">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br shadow-md",
                  color
                )}>
                  {icon}
                </div>
                <h3 className="text-sm font-semibold text-white tracking-wide flex items-center">
                  {title}
                  {is_enhanced && (
                    <span className="ml-2 text-yellow-400" title="Enhanced Service">
                      ✨
                    </span>
                  )}
                </h3>
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
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <style jsx>{`
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        .transform-style-preserve-3d {
          transform-style: preserve-3d;
        }
      `}</style>
    </>
  )
}