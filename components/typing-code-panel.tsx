"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Check, X, Code, Maximize2, Minimize2 } from "lucide-react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import { toast } from "@/components/ui/use-toast"

interface TypingCodePanelProps {
  isOpen: boolean
  onClose: () => void
  code: string
  language: string
  title?: string
}

export const TypingCodePanel: React.FC<TypingCodePanelProps> = ({
  isOpen,
  onClose,
  code,
  language,
  title = "Generated Code",
}) => {
  const [displayedCode, setDisplayedCode] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => {
    if (isOpen && code) {
      // Display code immediately without typing animation
      setDisplayedCode(code)
      setIsTyping(false)
    }

    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current)
      }
    }
  }, [isOpen, code])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast({
        title: "Copied!",
        description: "Code copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy code: ", err)
      toast({
        title: "Copy failed",
        description: "Failed to copy code to clipboard",
        variant: "destructive",
      })
    }
  }

  if (!isOpen) return null

  return (
    <div
      className={`fixed top-32 right-0 h-[calc(100vh-128px)] ${
        isExpanded ? "w-full" : "w-full sm:w-96 lg:w-[500px]"
      } bg-black/95 backdrop-blur-md border-l border-purple-900/30 z-50 transition-all duration-300 ease-in-out`}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-purple-900/30 bg-gradient-to-r from-purple-900/20 to-indigo-900/20">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Code className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">{title}</h3>
              <p className="text-purple-300 text-xs capitalize">{language}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-white hover:bg-purple-600/20 p-2 h-8 w-8"
              title={isExpanded ? "Minimize" : "Maximize"}
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              disabled={isTyping}
              className="text-gray-400 hover:text-white hover:bg-purple-600/20 p-2 h-8 w-8"
              title="Copy code"
            >
              {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-red-600/20 p-2 h-8 w-8"
              title="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Typing Status */}
        {isTyping && (
          <div className="px-4 py-2 bg-purple-900/10 border-b border-purple-900/20">
            <div className="flex items-center space-x-2 text-purple-300 text-xs">
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce"></div>
                <div
                  className="w-1 h-1 bg-purple-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-1 h-1 bg-purple-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
              <span>Generating code...</span>
            </div>
          </div>
        )}        {/* Code Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            {displayedCode ? (
              <SyntaxHighlighter
                language={language}
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  padding: "16px",
                  background: "transparent",
                  fontSize: "13px",
                  lineHeight: "1.4",
                  height: "100%",
                }}
                showLineNumbers={displayedCode.split("\n").length > 3}
                wrapLines={true}
                wrapLongLines={true}
              >
                {displayedCode}
              </SyntaxHighlighter>
            ) : (
              <div className="p-4 text-gray-400 text-sm">Waiting for code generation...</div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-purple-900/30 bg-black/50">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{displayedCode.split("\n").length} lines</span>
            <span>{displayedCode.length} characters</span>
          </div>
        </div>
      </div>
    </div>
  )
}
