"use client"
/**
 * Service Card Component
 *
 * Bu bileşen, anasayfada ve dashboardda görüntülenecek her bir AI servisi için
 * etkileşimli bir kart oluşturur. Yerleşik servisler ve özel servisler için kullanılır.
 *
 * Özellikler:
 * - Özelleştirilebilir başlık, açıklama ve ikon
 * - Renk temalarıyla görsel özelleştirme
 * - Yerleşik ve özel servislerin yönetimi
 * - Hover efektleri ve animasyonlar
 * - Özel servisler için silme işlevi
 * - Tıklamada ilgili servis sayfasına yönlendirme
 * - Onay diyalogları ile güvenli silme işlemi
 */
import type React from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { ArrowRight, Trash2 } from "lucide-react"
import { useState } from "react"
import { deleteCustomService } from "@/lib/custom-services"
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

interface MiniAppCardProps {
  title: string
  description: string
  icon: React.ReactNode
  serviceType: string
  color: string
  isAddCard?: boolean
  isCustom?: boolean
  id?: number
  onDelete?: (id: number) => Promise<boolean>
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
}: MiniAppCardProps) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleClick = () => {
    if (isAddCard) {
      router.push("/apps/create/service-workflow-builder") // This redirects to the workflow builder
    } else if (isCustom && id) {
      // For custom services, use the ID directly
      router.push(`/apps/service/${id}`)
    } else {
      // For built-in services, get the ID from the serviceType
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
    if (!id) return

    setIsDeleting(true)

    try {
      if (onDelete) {
        // Use the provided onDelete function for mini-services
        const success = await onDelete(id)
        if (!success) {
          console.error("Delete failed from parent component")
          return
        }
      } else {
        // Use the default deleteCustomService for custom services
        deleteCustomService(id)

        // Trigger a refresh to update the UI
        window.dispatchEvent(new Event("storage"))
      }

      // Close the dialog
      setShowDeleteDialog(false)
    } catch (error) {
      console.error("Error deleting service:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div onClick={handleClick} className="cursor-pointer group relative h-full">
        <div
          className={cn(
            "absolute inset-0 rounded-xl bg-gradient-to-br opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300",
            color,
          )}
        />
        <div className="relative h-full bg-black/40 backdrop-blur-sm rounded-xl border border-purple-900/30 p-6 flex flex-col hover:border-purple-500/50 transition-colors duration-300">
          {/* Delete button for custom services */}
          {isCustom && (
            <button
              onClick={handleDeleteClick}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 text-gray-400 hover:text-red-400 hover:bg-black/60 transition-colors z-10"
              aria-label="Delete service"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}

          <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-gradient-to-br", color)}>
            {icon}
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
          <p className="text-gray-400 text-sm flex-grow">{description}</p>
          <div className="mt-4 text-xs font-medium text-purple-400 group-hover:text-purple-300 transition-colors flex items-center">
            <span>{isAddCard ? "Create New" : "Open App"}</span>
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
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
