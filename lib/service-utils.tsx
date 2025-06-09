import React from "react"
import {
  MessageSquare,
  FileText,
  ImageIcon,
  Video,
  Headphones,
  BookOpen,
  FileVideo,
  Wand2,
} from "lucide-react"

export interface ServiceTypeConfig {
  iconName: string
  iconComponent: React.ReactNode
  color: string
}

/**
 * Get the icon name based on input and output types
 */
export function getServiceIconName(inputType: string, outputType: string): string {
  if (inputType === "text" && outputType === "text") {
    return "MessageSquare"
  } else if (inputType === "text" && outputType === "image") {
    return "ImageIcon"
  } else if (inputType === "text" && outputType === "sound") {
    return "Headphones"
  } else if (inputType === "sound" || outputType === "sound") {
    return "Headphones"
  } else if (inputType === "image" || outputType === "image") {
    return "ImageIcon"
  } else if (inputType === "video" || outputType === "video") {
    return "Video"
  } else if (inputType === "document" || outputType === "document") {
    return "FileText"
  }
  
  return "Wand2"
}

/**
 * Get the background color based on input and output types
 */
export function getServiceColor(inputType: string, outputType: string): string {
  if (inputType === "text" && outputType === "text") {
    return "bg-purple-600"
  } else if (inputType === "text" && outputType === "image") {
    return "bg-pink-600"
  } else if (inputType === "text" && outputType === "sound") {
    return "bg-orange-600"
  } else if (inputType === "sound" || outputType === "sound") {
    return "bg-blue-600"
  } else if (inputType === "image" || outputType === "image") {
    return "bg-green-600"
  } else if (inputType === "video" || outputType === "video") {
    return "bg-red-600"
  } else if (inputType === "document" || outputType === "document") {
    return "bg-amber-600"
  }
  
  return "bg-indigo-600"
}

/**
 * Get the React icon component based on icon name
 */
export function getIconComponent(iconName: string, className: string = "h-5 w-5"): React.ReactNode {
  switch (iconName) {
    case "MessageSquare":
      return <MessageSquare className={className} />
    case "FileText":
      return <FileText className={className} />
    case "ImageIcon":
      return <ImageIcon className={className} />
    case "Video":
      return <Video className={className} />
    case "Headphones":
      return <Headphones className={className} />
    case "BookOpen":
      return <BookOpen className={className} />
    case "FileVideo":
      return <FileVideo className={className} />
    default:
      return <Wand2 className={className} />
  }
}

/**
 * Get complete service type configuration (icon name, component, and color)
 */
export function getServiceTypeConfig(inputType: string, outputType: string, iconClassName: string = "h-5 w-5"): ServiceTypeConfig {
  const iconName = getServiceIconName(inputType, outputType)
  const iconComponent = getIconComponent(iconName, iconClassName)
  const color = getServiceColor(inputType, outputType)
  
  return {
    iconName,
    iconComponent,
    color,
  }
}

/**
 * Get serializable icon object (for API responses or storage)
 */
export function getSerializableIcon(inputType: string, outputType: string): { iconName: string } {
  const iconName = getServiceIconName(inputType, outputType)
  return { iconName }
}

/**
 * Get color for service preview (handles compound types)
 */
export function getServicePreviewColor(inputType: string, outputType: string): string {
  // Handle compound output types for workflow combinations
  if (outputType === "text-audio") {
    return "bg-orange-600"
  } else if (outputType === "text-video") {
    return "bg-red-600"
  }
  
  // Use standard service color function for regular combinations
  return getServiceColor(inputType, outputType)
}

/**
 * Get icon component for service preview (handles compound types)
 */
export function getServicePreviewIconComponent(inputType: string, outputType: string, className: string = "h-5 w-5"): React.ReactNode {
  // Handle compound output types for workflow combinations
  if (outputType === "text-audio") {
    return <Headphones className={className} />
  } else if (outputType === "text-video") {
    return <Video className={className} />
  }
  
  // Use standard service icon function for regular combinations
  const iconName = getServiceIconName(inputType, outputType)
  return getIconComponent(iconName, className)
}

/**
 * Get icon component class for service preview (returns React component class, not element)
 */
export function getServicePreviewIconClass(inputType: string, outputType: string): React.ComponentType<any> {
  // Handle compound output types for workflow combinations
  if (outputType === "text-audio") {
    return Headphones
  } else if (outputType === "text-video") {
    return Video
  }
  
  // Use standard service icon name and convert to component class
  const iconName = getServiceIconName(inputType, outputType)
  
  switch (iconName) {
    case "MessageSquare": return MessageSquare
    case "ImageIcon": return ImageIcon
    case "Video": return Video
    case "FileText": return FileText
    case "Headphones": return Headphones
    case "BookOpen": return BookOpen
    case "FileVideo": return FileVideo
    default: return Wand2
  }
}

// Define input and output type options for UI
export const inputTypes = [
  { value: "text", label: "Text", icon: MessageSquare },
  { value: "image", label: "Image", icon: ImageIcon },
  { value: "sound", label: "Sound", icon: Headphones },
  { value: "video", label: "Video", icon: Video },
  { value: "document", label: "Document", icon: FileText },
]

export const outputTypes = [
  { value: "text", label: "Text", icon: MessageSquare },
  { value: "image", label: "Image", icon: ImageIcon },
  { value: "sound", label: "Sound", icon: Headphones },
  { value: "video", label: "Video", icon: Video },
  { value: "document", label: "Document", icon: FileText },
]

export const iconOptions = [
  { value: "BookOpen", label: "Book", icon: BookOpen },
  { value: "Video", label: "Video", icon: Video },
  { value: "Headphones", label: "Headphones", icon: Headphones },
  { value: "ImageIcon", label: "Image", icon: ImageIcon },
  { value: "FileText", label: "Document", icon: FileText },
  { value: "MessageSquare", label: "Chat", icon: MessageSquare },
  { value: "FileVideo", label: "Video File", icon: FileVideo },
  { value: "Wand2", label: "Magic Wand", icon: Wand2 },
]

export const colorOptions = [
  { value: "bg-blue-600", label: "Blue" },
  { value: "bg-purple-600", label: "Purple" },
  { value: "bg-green-600", label: "Green" },
  { value: "bg-pink-600", label: "Pink" },
  { value: "bg-orange-600", label: "Orange" },
  { value: "bg-red-600", label: "Red" },
  { value: "bg-emerald-600", label: "Teal" },
  { value: "bg-amber-600", label: "Amber" },
  { value: "bg-indigo-600", label: "Indigo" },
] 