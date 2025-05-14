"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { ArrowRight, Trash2, Loader2, Clock, Cpu } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { deleteMiniService } from "@/lib/services"
import Cookies from "js-cookie"
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
}: Readonly<MiniAppCardProps>) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [serviceStats, setServiceStats] = useState<UsageStats | null>(usageStats || null)
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    if (isAddCard) {
      router.push("/apps/create/service-workflow-builder")
      return
    }

    if (isCustom && id) {
      try {
        setIsLoading(true)
        const currentUserId = Cookies.get("user_id") || "0"
        const response = await fetch(
          `http://127.0.0.1:8000/api/v1/mini-services/${id}?current_user_id=${currentUserId}`
        )

        if (response.ok) {
          const data = await response.json()
          setServiceStats({
            average_token_usage: data.average_token_usage,
            run_time: data.run_time,
            input_type: data.input_type,
            output_type: data.output_type
          })
        }
        router.push(`/apps/service/${id}`)
      } catch (error) {
        console.error("Error fetching service stats:", error)
        // Hata durumunda da yönlendirme yap
        router.push(`/apps/service/${id}`)
      } finally {
        setIsLoading(false)
      }
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

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!id) return;

    setIsDeleting(true);

    try {
      // Silme işlemini merkezi fonksiyon ile gerçekleştir
      const success = await deleteMiniService(id, {
        showToast: true,
        toastMessage: `"${title}" has been deleted successfully.`,
        onSuccess: () => {
          setShowDeleteDialog(false);
        }
      });

      // Silme işlemi başarılı olduysa UI güncellemesi için callback'i çağır
      // Ancak burada silme işlemi YAPMA, sadece UI güncellemesi yap
      if (success && onDelete) {
        try {
          // Callback'e silme işlemi sonucunu parametre olarak aktar
          // Böylece callback içinde tekrar silme işlemi yapmaya gerek kalmaz
          onDelete(id);
        } catch (callbackError) {
          console.error("Error in onDelete callback:", callbackError);
        }
      }
      
      // İşlem başarıyla tamamlandıktan sonra yönlendirme
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
        className="cursor-pointer group relative h-[220px] transform transition-all duration-300"
      >
        <div
          className={cn(
            "absolute inset-0 rounded-xl bg-gradient-to-br opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300",
            color,
          )}
        />
        <div
          className={cn(
            "h-full bg-black/40 backdrop-blur-sm rounded-xl border border-purple-900/30 flex flex-col transition-all duration-300",
            isHovering && "scale-105 z-10",
            isAddCard ? "p-5 justify-center items-center" : "p-4 pb-14"
          )}
        >
          {isAddCard ? (
            // Simplified "Create New" card
            <>
              <div className={cn("w-16 h-16 rounded-lg flex items-center justify-center bg-gradient-to-br mb-5", color)}>
                {icon}
              </div>
              <p className="text-white text-center font-medium">Create New</p>
            </>
          ) : (
            // Regular service card
            <>
              {/* Service icon and title section */}
              <div className="flex items-start space-x-3 mb-2">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br", color)}>
                  {icon}
                </div>
                <div className="flex-1 pr-5">
                  <h3 className="text-sm font-semibold text-white">{title}</h3>
                </div>

                {/* Delete button for custom services */}
                {isCustom && (
                  <button
                    onClick={handleDeleteClick}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 text-gray-400 hover:text-red-400 hover:bg-black/60 transition-colors z-10"
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

              {/* Description - with fixed height */}
              <div className="h-12 mb-3"> {/* Fixed height container for description */}
                <p className="text-gray-300 text-xs line-clamp-2">{description}</p>
              </div>

              {/* Service details - more compact */}
              <div className="mb-2 text-xs">
                <div className="flex items-center">
                  <span className="text-gray-500 w-14 inline-block">Input:</span>
                  <span className="text-gray-300">{serviceStats?.input_type || "Text"}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-500 w-14 inline-block">Output:</span>
                  <span className="text-gray-300">{serviceStats?.output_type || "Text"}</span>
                </div>
              </div>

              {/* Stats - side by side with better spacing */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-black/30 rounded p-1.5">
                  <span className="block text-gray-500 text-[10px]">Avg. Tokens</span>
                  <span className="text-gray-300 flex items-center">
                    {isLoading ? (
                      <Loader2 className="h-2.5 w-2.5 animate-spin text-purple-400 mr-1" />
                    ) : (
                      serviceStats?.average_token_usage?.total_tokens !== undefined ?
                        Math.round(serviceStats.average_token_usage.total_tokens) :
                        "—"
                    )}
                  </span>
                </div>
                <div className="bg-black/30 rounded p-1.5">
                  <span className="block text-gray-500 text-[10px]">Run time</span>
                  <span className="text-gray-300 flex items-center">
                    {isLoading ? (
                      <Loader2 className="h-2.5 w-2.5 animate-spin text-purple-400 mr-1" />
                    ) : (
                      serviceStats?.run_time !== undefined ?
                        `${Math.round(serviceStats.run_time)}s` :
                        "—"
                    )}
                  </span>
                </div>
              </div>

              {/* Open app button - positioned at bottom edge of card */}
              <button
                className="absolute bottom-0 left-0 right-0 text-center py-2.5 rounded-b-xl bg-black/40 hover:bg-black/60 text-purple-400 hover:text-purple-300 transition-colors border-t border-purple-900/30 hover:border-purple-500/50 text-sm flex items-center justify-center"
              >
                <span>Open App</span>
                <ArrowRight className="ml-1.5 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </>
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
    </>
  )
}