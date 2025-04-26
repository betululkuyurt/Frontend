"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Key, X } from "lucide-react"

export function ApiKeyBanner() {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className="relative bg-gradient-to-r from-purple-900/30 to-purple-800/30 rounded-xl border border-purple-500/30 p-4 md:p-6">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 text-gray-400 hover:text-white"
        onClick={() => setIsVisible(false)}
      >
        <X className="h-4 w-4" />
      </Button>
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center flex-shrink-0">
          <Key className="h-6 w-6 text-purple-400" />
        </div>
        <div className="flex-grow">
          <h3 className="text-lg font-semibold text-white">Set up your API keys</h3>
          <p className="text-gray-300 mt-1">
            Connect your OpenAI, Gemini, or other AI service API keys to unlock the full potential of our mini apps.
          </p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700 whitespace-nowrap">Configure API Keys</Button>
      </div>
    </div>
  )
}

