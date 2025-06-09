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
 * Get the color gradient based on input and output types
 */
export function getServiceColor(inputType: string, outputType: string): string {
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
  } else if (inputType === "video" || outputType === "video") {
    return "from-red-600 to-red-800"
  } else if (inputType === "document" || outputType === "document") {
    return "from-yellow-600 to-yellow-600"
  }
  
  return "from-indigo-600 to-indigo-800"
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