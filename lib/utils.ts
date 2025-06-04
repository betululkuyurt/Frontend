// Returns a color string for a service based on input/output type
export function getColorForService(inputType: string, outputType: string): string {
  if (inputType === "text" && outputType === "text") {
    return "from-purple-600 to-purple-800";
  } else if (inputType === "text" && outputType === "image") {
    return "from-pink-600 to-pink-800";
  } else if (inputType === "text" && outputType === "sound") {
    return "from-orange-600 to-orange-800";
  } else if (inputType === "sound" || outputType === "sound") {
    return "from-blue-600 to-blue-800";
  } else if (inputType === "image" || outputType === "image") {
    return "from-green-600 to-green-800";
  }
  return "from-indigo-600 to-indigo-800";
}
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

