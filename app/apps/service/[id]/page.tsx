"use client"

import React from "react"
import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import Cookies from "js-cookie"
import { NavBar } from "@/components/nav-bar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  Loader2,
  ArrowLeft,
  Wand2,
  ImageIcon,
  Headphones,
  FileText,
  Video,
  ArrowRightIcon,
  LucideBrush,
  LucideBot,
  LucideVolume2,
  LucideMic,
  LucideImage,
  LucideSearch,
  LucidePlug,
  LucideMusic,
  LucideClapperboard,
  LucideSparkles,
  ChevronRight,
  BarChart3,
  Copy,
  Check,
  MessageSquare,
  X,
  Menu,
  Info,
  Code,
  Download,
  Trash2,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { deleteMiniService } from "@/lib/services"
import { getServiceTypeConfig, getServiceColor } from "@/lib/service-utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { decodeJWT, getAccessToken } from "@/lib/auth"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import { TypingCodePanel } from "@/components/typing-code-panel"

// Typing Text Component for assistant messages
interface TypingTextProps {
  text: string
  onComplete?: () => void
  speed?: number
}

const TypingText: React.FC<TypingTextProps> = ({ text, onComplete, speed = 8 }) => {
  const [displayedText, setDisplayedText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (text) {
      setDisplayedText("")
      setIsTyping(true)

      let currentIndex = 0

      intervalRef.current = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayedText(text.substring(0, currentIndex + 1))
          currentIndex++
        } else {
          setIsTyping(false)
          onComplete?.()
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
          }
        }
      }, speed)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [text, speed, onComplete])

  // Enhanced rendering with code block support
  const renderEnhancedContent = () => {
    // Split text into segments based on code blocks
    const segments = []
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g
    let lastIndex = 0
    let match

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before this code block
      if (match.index > lastIndex) {
        segments.push({
          type: 'text',
          content: text.slice(lastIndex, match.index),
          start: lastIndex,
          end: match.index
        })
      }

      // Add the code block
      segments.push({
        type: 'code',
        content: match[2] || '',
        language: match[1] || 'text',
        start: match.index,
        end: match.index + match[0].length,
        fullMatch: match[0]
      })

      lastIndex = match.index + match[0].length
    }

    // Add remaining text after last code block
    if (lastIndex < text.length) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex),
        start: lastIndex,
        end: text.length
      })
    }

    // If no segments (no code blocks), return simple text
    if (segments.length === 0) {
      return <span className="whitespace-pre-wrap">{displayedText}</span>
    }

    // Render segments based on how much text has been typed
    const renderedSegments = []
    
    for (const segment of segments) {
      if (displayedText.length <= segment.start) {
        // Haven't reached this segment yet
        break
      }

      if (segment.type === 'text') {
        // Regular text segment
        const visibleLength = Math.min(displayedText.length - segment.start, segment.content.length)
        const visibleText = segment.content.slice(0, visibleLength)
        
        if (visibleText) {
          renderedSegments.push(
            <span key={segment.start} className="whitespace-pre-wrap">
              {visibleText}
            </span>
          )
        }
      } else if (segment.type === 'code') {
        // Code block segment
        const fenceLength = `\`\`\`${segment.language}\n`.length
        const closingFenceLength = 3 // ```
        
        if (displayedText.length >= segment.start + fenceLength) {
          // We've typed past the opening fence, show as code block
          const typedInCode = displayedText.length - (segment.start + fenceLength)
          const visibleCode = segment.content.slice(0, Math.max(0, typedInCode - closingFenceLength))
          
          renderedSegments.push(
            <div key={segment.start} className="my-4">
              <SyntaxHighlighter
                language={segment.language}
                style={vscDarkPlus}
                className="rounded-md text-sm"
                customStyle={{
                  margin: 0,
                  padding: '12px',
                  backgroundColor: '#1e1e1e'
                }}
              >
                {visibleCode}
              </SyntaxHighlighter>
            </div>
          )
        } else {
          // Still typing the opening fence, show as regular text
          const visibleFence = displayedText.slice(segment.start)
          renderedSegments.push(
            <span key={segment.start} className="whitespace-pre-wrap">
              {visibleFence}
            </span>
          )
        }
      }
    }

    return renderedSegments.length > 0 ? renderedSegments : (
      <span className="whitespace-pre-wrap">{displayedText}</span>
    )
  }

  return (
    <div className="relative">
      {renderEnhancedContent()}
      {isTyping && (
        <span className="inline-block w-0.5 h-4 bg-purple-400 ml-0.5 animate-blink"></span>
      )}
    </div>
  )
}

interface MiniService {
  id: number
  name: string
  description: string
  workflow: {
    nodes: {
      [key: string]: {
        agent_id: number
        agent_name?: string
        agent_description?: string
        agent_type?: string
        next: string | null
      }
    }
  }
  input_type: string
  output_type: string
  api_key?: string
  api_key_id?: string
  average_token_usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
    avg_pricing?: {
      estimated_cost_usd: number
    }
  }
  run_time?: number
}

interface AgentDetails {
  id: number
  name: string
  system_instruction?: string
  agent_type: string
  config?: any
  input_type: string
  output_type: string
  owner_id: number
  created_at: string
  is_enhanced: boolean
}

interface AgentTypeInfo {
  type: string
  input_type: string
  output_type: string
  api_key_required: string
  endpoint: string | ((agentId: number) => string)
  fileFieldName: string
  additionalFields?: { [key: string]: any }
  supportedFileTypes: string[]
  maxFileSize: number
  hasSpecialUI?: boolean
  requiresUpload?: boolean
  processingMessage?: string
}

const getAgentTypeConfig = (agentType: string, agentTypesInfo: AgentTypeInfo[]): AgentTypeInfo | null => {
  const normalizedType = agentType.toLowerCase()
  return agentTypesInfo.find((info) => info.type.toLowerCase() === normalizedType) || null
}

// Code detection and parsing utilities
const detectCodeBlocks = (text: string) => {
  // Pattern for fenced code blocks (```language\ncode\n```)
  const fencedCodeBlockPattern = /```(\w+)?\n?([\s\S]*?)```/g
  // Pattern for inline code (`code`)
  const inlineCodePattern = /`([^`\n]+)`/g
  // Pattern for code without fences (common programming constructs)
  const bareCodePattern =
    /^(def |class |function |const |let |var |import |from |#include |<\?php|<!DOCTYPE|<html|<script)/gm

  const codeBlocks: Array<{
    type: "fenced" | "inline" | "bare"
    language?: string
    code: string
    startIndex: number
    endIndex: number
  }> = []

  // Find fenced code blocks
  let match
  while ((match = fencedCodeBlockPattern.exec(text)) !== null) {
    codeBlocks.push({
      type: "fenced",
      language: match[1] || "text",
      code: match[2].trim(),
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    })
  }

  // Find inline code (only if no fenced blocks found)
  if (codeBlocks.length === 0) {
    fencedCodeBlockPattern.lastIndex = 0
    while ((match = inlineCodePattern.exec(text)) !== null) {
      codeBlocks.push({
        type: "inline",
        code: match[1],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      })
    }
  }

  // Detect bare code patterns (for responses that contain code without markdown formatting)
  if (codeBlocks.length === 0 && bareCodePattern.test(text)) {
    codeBlocks.push({
      type: "bare",
      language: detectLanguage(text),
      code: text,
      startIndex: 0,
      endIndex: text.length,
    })
  }

  return codeBlocks
}

const detectLanguage = (code: string): string => {
  const trimmedCode = code.trim().toLowerCase()

  // JavaScript/TypeScript
  if (
    trimmedCode.includes("function ") ||
    trimmedCode.includes("const ") ||
    trimmedCode.includes("let ") ||
    trimmedCode.includes("var ") ||
    trimmedCode.includes("import ") ||
    trimmedCode.includes("export ") ||
    trimmedCode.includes("=>") ||
    trimmedCode.includes("console.log")
  ) {
    return trimmedCode.includes("interface ") || trimmedCode.includes("type ") ? "typescript" : "javascript"
  }

  // Python
  if (
    trimmedCode.includes("def ") ||
    trimmedCode.includes("import ") ||
    trimmedCode.includes("class ") ||
    trimmedCode.includes("print(") ||
    trimmedCode.includes("if __name__")
  ) {
    return "python"
  }

  // Java
  if (
    trimmedCode.includes("public class ") ||
    trimmedCode.includes("public static void main") ||
    trimmedCode.includes("System.out.println")
  ) {
    return "java"
  }

  // C/C++
  if (
    trimmedCode.includes("#include") ||
    trimmedCode.includes("int main(") ||
    trimmedCode.includes("printf(") ||
    trimmedCode.includes("cout <<")
  ) {
    return trimmedCode.includes("cout") ? "cpp" : "c"
  }

  // HTML
  if (
    trimmedCode.includes("<!doctype") ||
    trimmedCode.includes("<html") ||
    trimmedCode.includes("<div") ||
    trimmedCode.includes("<script")
  ) {
    return "html"
  }

  // CSS
  if (
    trimmedCode.includes("{") &&
    trimmedCode.includes("}") &&
    (trimmedCode.includes("color:") ||
      trimmedCode.includes("background:") ||
      trimmedCode.includes("margin:") ||
      trimmedCode.includes("padding:"))
  ) {
    return "css"
  }

  // SQL
  if (
    trimmedCode.includes("select ") ||
    trimmedCode.includes("insert ") ||
    trimmedCode.includes("update ") ||
    trimmedCode.includes("delete ") ||
    trimmedCode.includes("create table")
  ) {
    return "sql"
  }

  // JSON
  if (
    (trimmedCode.startsWith("{") && trimmedCode.endsWith("}")) ||
    (trimmedCode.startsWith("[") && trimmedCode.endsWith("]"))
  ) {
    try {
      JSON.parse(code)
      return "json"
    } catch (e) {
      // Not valid JSON
    }
  }

  // PHP
  if (trimmedCode.includes("<?php") || (trimmedCode.includes("$") && trimmedCode.includes("->"))) {
    return "php"
  }

  // Bash/Shell
  if (
    trimmedCode.includes("#!/bin/bash") ||
    trimmedCode.includes("#!/bin/sh") ||
    trimmedCode.includes("echo ") ||
    trimmedCode.includes("cd ") ||
    (trimmedCode.includes("$") && trimmedCode.includes("|"))
  ) {
    return "bash"
  }

  return "text"
}

// CodeBlock component for rendering code with syntax highlighting
interface CodeBlockProps {
  code: string
  language?: string
  isInline?: boolean
  messageId: string
  blockIndex?: number
  onCodeGenerated?: (code: string, language: string) => void
}

const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = "text",
  isInline = false,
  messageId,
  blockIndex = 0,
  onCodeGenerated,
}) => {
  const [copied, setCopied] = useState(false)
  const copyKey = `code-${messageId}-${blockIndex}`

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

  const handleOpenInPanel = () => {
    if (onCodeGenerated) {
      onCodeGenerated(code, language)
    }
  }

  if (isInline) {
    return (
      <code className="bg-purple-900/30 text-purple-200 px-2 py-1 rounded text-sm font-mono border border-purple-800/30">
        {code}
      </code>
    )
  }

  return (
    <div className="relative group bg-zinc-900/50 rounded-lg border border-purple-900/30 overflow-hidden my-4">
      {/* Header with language and action buttons */}
      <div className="flex items-center justify-between bg-zinc-800/80 px-4 py-2 border-b border-purple-900/20">
        <div className="flex items-center space-x-2">
          <Code className="h-4 w-4 text-purple-400" />
          <span className="text-sm font-medium text-purple-300 capitalize">
            {language === "text" ? "Code" : language}
          </span>
        </div>
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenInPanel}
            className="p-1 h-6 w-6 text-gray-400 hover:text-purple-400 hover:bg-purple-600/20 transition-colors"
            title="Open in side panel"
          >
            <Code className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="p-1 h-6 w-6 text-gray-400 hover:text-purple-400 hover:bg-purple-600/20 transition-colors"
            title="Copy code"
          >
            {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      {/* Code content */}
      <div className="relative">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: "16px",
            background: "transparent",
            fontSize: "14px",
            lineHeight: "1.5",
          }}
          showLineNumbers={code.split("\n").length > 3}
          wrapLines={true}
          wrapLongLines={true}
        >
          {code}
        </SyntaxHighlighter>

        {/* Gradient overlay for better visual separation */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-transparent to-purple-900/5"></div>
      </div>
    </div>
  )
}

// Enhanced text renderer that detects and renders code blocks
const EnhancedTextRenderer: React.FC<{
  text: string
  messageId: string
  className?: string
  onCodeGenerated?: (code: string, language: string) => void
}> = ({ text, messageId, className = "", onCodeGenerated }) => {
  const codeBlocks = detectCodeBlocks(text)

  if (codeBlocks.length === 0) {
    return <div className={`whitespace-pre-wrap ${className}`}>{text}</div>
  }

  // If the entire text is a single code block, render it as such
  if (
    codeBlocks.length === 1 &&
    codeBlocks[0].type === "bare" &&
    codeBlocks[0].startIndex === 0 &&
    codeBlocks[0].endIndex === text.length
  ) {
    return (
      <CodeBlock
        code={codeBlocks[0].code}
        language={codeBlocks[0].language}
        messageId={messageId}
        blockIndex={0}
        onCodeGenerated={onCodeGenerated}
      />
    )
  }

  // Render mixed content with code blocks
  let lastIndex = 0
  const elements: React.ReactNode[] = []

  codeBlocks.forEach((block, index) => {
    // Add text before this code block
    if (block.startIndex > lastIndex) {
      const textBefore = text.substring(lastIndex, block.startIndex)
      if (textBefore.trim()) {
        elements.push(
          <div key={`text-${index}`} className={`whitespace-pre-wrap ${className}`}>
            {textBefore}
          </div>,
        )
      }
    }

    // Add the code block
    elements.push(
      <CodeBlock
        key={`code-${index}`}
        code={block.code}
        language={block.language}
        isInline={block.type === "inline"}
        messageId={messageId}
        blockIndex={index}
        onCodeGenerated={onCodeGenerated}
      />,
    )

    lastIndex = block.endIndex
  })

  // Add remaining text after the last code block
  if (lastIndex < text.length) {
    const textAfter = text.substring(lastIndex)
    if (textAfter.trim()) {
      elements.push(
        <div key="text-final" className={`whitespace-pre-wrap ${className}`}>
          {textAfter}
        </div>,
      )
    }
  }

  return <div className="space-y-2">{elements}</div>
}

export default function ServicePage() {
  const router = useRouter()
  const params = useParams()
  const serviceId = params?.id ? Number.parseInt(params.id as string) : null

  const [service, setService] = useState<MiniService | null>(null)
  const [userInput, setUserInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isServiceLoading, setIsServiceLoading] = useState(true)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [agentDetails, setAgentDetails] = useState<{ [id: number]: AgentDetails }>({})
  const [expandedDescriptions, setExpandedDescriptions] = useState<{ [nodeId: string]: boolean }>({})
  const [documentProcessingState, setDocumentProcessingState] = useState<{
    isProcessing: boolean
    stage: "uploading" | "embedding" | "indexing" | "processing" | "complete"
    message: string
  }>({
    isProcessing: false,
    stage: "uploading",
    message: "",
  })

  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({})
  const [chatHistory, setChatHistory] = useState<
    Array<{
      id: string
      type: "user" | "assistant"
      content: string
      file?: File
      result?: any
      timestamp: Date
      isTyping?: boolean
    }>
  >([])

  const [typingMessageId, setTypingMessageId] = useState<string | null>(null)

  const chatMessagesRef = useRef<HTMLDivElement>(null)

  const [agentTypesInfo, setAgentTypesInfo] = useState<AgentTypeInfo[]>([])
  const [agentTypesLoading, setAgentTypesLoading] = useState(true)

  // Code panel state
  const [codePanelOpen, setCodePanelOpen] = useState(false)
  const [currentCode, setCurrentCode] = useState("")
  const [currentLanguage, setCurrentLanguage] = useState("text")

  // Mode selection and chat history state
  const [showModeSelection, setShowModeSelection] = useState(false)
  const [selectedMode, setSelectedMode] = useState<'chat' | 'normal' | null>(null)
  const [chatHistorySidebar, setChatHistorySidebar] = useState(false)
  const [savedConversations, setSavedConversations] = useState<Array<{
    id: string
    title: string
    lastMessage: string
    timestamp: Date
    messageCount: number
  }>>([])
  const [loadingConversations, setLoadingConversations] = useState(false)
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null)

  const handleCodeGenerated = (code: string, language: string) => {
    setCurrentCode(code)
    setCurrentLanguage(language)
    setCodePanelOpen(true)
  }

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight
    }
  }, [chatHistory])

  const [documentCollection, setDocumentCollection] = useState<{
    documents: Array<{
      filename: string
      source: string
      chunks: number
    }>
    isLoading: boolean
  }>({
    documents: [],
    isLoading: false,
  })

  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Handle clicking outside sidebar to close it
  const handleMainContentClick = useCallback(() => {
    if (sidebarOpen) {
      setSidebarOpen(false)
    }
  }, [sidebarOpen])

  // Prevent sidebar from closing when clicking inside it
  const handleSidebarClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])

  useEffect(() => {
    const fetchAgentTypes = async () => {
      try {
        setAgentTypesLoading(true)
        const response = await fetch("http://127.0.0.1:8000/api/v1/agents/types")

        if (!response.ok) {
          console.error("Failed to fetch agent types:", response.statusText)
          return
        }

        const agentTypes: AgentTypeInfo[] = await response.json()
        setAgentTypesInfo(agentTypes)

        console.log("📝 Loaded agent types from backend:", {
          total: agentTypes.length,
          withApiKeys: agentTypes.filter((t) => t.api_key_required === "True").length,
          types: agentTypes.map((t) => t.type),
        })
      } catch (error) {
        console.error("Error fetching agent types:", error)
      } finally {
        setAgentTypesLoading(false)
      }
    }

    fetchAgentTypes()
  }, [])

  const getAgentTypesRequiringApiKey = useCallback((): string[] => {
    return agentTypesInfo
      .filter((agentType) => agentType.api_key_required === "True")
      .map((agentType) => agentType.type.toLowerCase())
  }, [agentTypesInfo])

  const doesAgentTypeRequireApiKey = useCallback(
    (agentType: string): boolean => {
      const normalizedType = agentType.toLowerCase()
      const agentTypeInfo = agentTypesInfo.find((info) => info.type.toLowerCase() === normalizedType)
      return agentTypeInfo?.api_key_required === "True"
    },
    [agentTypesInfo],
  )

  useEffect(() => {
    const checkAuth = () => {
      const { token } = getAuthHeaders()

      if (token) {
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
        router.push("/auth/login")
      }
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    if (!serviceId || !isAuthenticated) return

    const fetchService = async () => {
      try {
        setIsServiceLoading(true)
        const { currentUserId } = getAuthHeaders()

        const response = await fetch(
          `http://127.0.0.1:8000/api/v1/mini-services/${serviceId}?current_user_id=${currentUserId}`,
        )

        if (!response.ok) {
          if (response.status === 404) {
            window.location.href = "/apps"
            return
          }
          throw new Error("Service not found")
        }

        const data = await response.json()
        setService(data)

        if (data.workflow?.nodes) {
          await fetchAgentDetails(data.workflow.nodes)
        }
      } catch (error) {
        console.error("Error fetching service:", error)
        setError("Failed to load service details")
      } finally {
        setIsServiceLoading(false)
      }
    }

    fetchService()
  }, [serviceId, isAuthenticated])

  // Effect to show mode selection popup for text-output services
  useEffect(() => {
    if (service && checkIfChatModeEligible() && chatHistory.length === 0 && selectedMode === null) {
      setShowModeSelection(true)
    }
  }, [service])

  const fetchAgentDetails = async (nodes: any) => {
    try {
      const agentIds = Object.values(nodes).map((node: any) => node.agent_id)
      const uniqueAgentIds = [...new Set(agentIds)]
      const { token, currentUserId } = getAuthHeaders()

      const agentDetailsMap: { [id: number]: AgentDetails } = {}

      await Promise.all(
        uniqueAgentIds.map(async (agentId: number) => {
          try {
            const response = await fetch(
              `http://127.0.0.1:8000/api/v1/agents/${agentId}?current_user_id=${currentUserId}`,
              {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              },
            )

            if (!response.ok) {
              console.warn(`Could not fetch details for agent ${agentId}: ${response.statusText}`)
              return
            }

            const agentData = await response.json()
            agentDetailsMap[agentId] = agentData
          } catch (error) {
            console.error(`Error fetching agent ${agentId} details:`, error)
          }
        }),
      )

      setAgentDetails(agentDetailsMap)
      updateRequiredApiKeys(agentDetailsMap)
    } catch (error) {
      console.error("Error fetching agent details:", error)
    }
  }

  const updateRequiredApiKeys = (agents: { [id: number]: AgentDetails }) => {
    const initialApiKeyState: { [agentId: number]: string } = {}

    Object.entries(agents).forEach(([agentId, details]) => {
      if (doesAgentTypeRequireApiKey(details.agent_type)) {
        initialApiKeyState[Number(agentId)] = ""
      }
    })

    if (Object.keys(initialApiKeyState).length > 0) {
      setApiKeys((prev) => ({ ...prev, ...initialApiKeyState }))
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
    }
  }

  const [apiKeys, setApiKeys] = useState<{ [agentId: number]: string }>({})
  const [availableApiKeys, setAvailableApiKeys] = useState<{
    [provider: string]: { id: string; name: string; api_key: string }[]
  }>({})

  const [transcriptionOptions, setTranscriptionOptions] = useState({
    include_timestamps: false,
  })

  useEffect(() => {
    const fetchApiKeys = async () => {
      if (!isAuthenticated) return

      try {
        const { token, currentUserId } = getAuthHeaders()

        const response = await fetch(`http://127.0.0.1:8000/api/v1/api-keys?current_user_id=${currentUserId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) throw new Error("Failed to fetch API keys")

        const data = await response.json()
        const groupedKeys: { [provider: string]: { id: string; name: string; api_key: string }[] } = {}

        data.forEach((key: any) => {
          if (!groupedKeys[key.provider]) {
            groupedKeys[key.provider] = []
          }
          groupedKeys[key.provider].push({
            id: key.id,
            name: key.name || `${key.provider.charAt(0).toUpperCase() + key.provider.slice(1)} Key ${key.id}`,
            api_key: key.api_key,
          })
        })

        setAvailableApiKeys(groupedKeys)
      } catch (error) {
        console.error("Error fetching API keys:", error)
      }
    }

    fetchApiKeys()
  }, [isAuthenticated])

  const getAgentsRequiringApiKey = useCallback(() => {
    if (!service?.workflow?.nodes || agentTypesLoading) return []

    const agents: { id: number; name: string; type: string; nodeId: string }[] = []

    Object.entries(service.workflow.nodes).forEach(([nodeId, node]) => {
      const agentId = node.agent_id
      const agentDetail = agentDetails[agentId]

      const agentType = agentDetail?.agent_type?.toLowerCase() || node.agent_type?.toLowerCase() || ""

      if (agentDetail && doesAgentTypeRequireApiKey(agentType)) {
        let providerType = agentType
        if (agentType.includes("rag") || agentType === "file_output") {
          providerType = "gemini"
        } else if (agentType.includes("dalle") || agentType === "dalle") {
          providerType = "openai"
        }

        agents.push({
          id: agentId,
          name: agentDetail.name || `Agent ${agentId}`,
          type: providerType,
          nodeId,
        })
      } else if (node.agent_type && doesAgentTypeRequireApiKey(node.agent_type.toLowerCase())) {
        let providerType = node.agent_type.toLowerCase()
        if (providerType.includes("rag")) {
          providerType = "gemini"
        } else if (providerType.includes("dalle") || providerType === "dalle") {
          providerType = "openai"
        }

        agents.push({
          id: agentId,
          name: node.agent_name || `Agent ${agentId}`,
          type: providerType,
          nodeId,
        })
      }
    })

    return agents
  }, [service?.workflow, agentDetails, doesAgentTypeRequireApiKey, agentTypesLoading])

  // Auto-select first available API key for each agent when keys are loaded
  useEffect(() => {
    if (Object.keys(availableApiKeys).length > 0 && service?.workflow?.nodes) {
      const requiredAgents = getAgentsRequiringApiKey()
      const autoSelectedKeys: { [agentId: number]: string } = {}

      requiredAgents.forEach((agent) => {
        // Only auto-select if no key is currently selected for this agent
        if (!apiKeys[agent.id] && availableApiKeys[agent.type]?.length > 0) {
          autoSelectedKeys[agent.id] = availableApiKeys[agent.type][0].id
        }
      })

      // Update state only if there are keys to auto-select
      if (Object.keys(autoSelectedKeys).length > 0) {
        setApiKeys((prev) => ({
          ...prev,
          ...autoSelectedKeys,
        }))
      }
    }
  }, [availableApiKeys, service?.workflow?.nodes, getAgentsRequiringApiKey, apiKeys])

  const areAllRequiredApiKeysSelected = useMemo(() => {
    const requiredAgents = getAgentsRequiringApiKey()
    if (requiredAgents.length === 0) return true

    const allSelected = requiredAgents.every((agent) => {
      const selectedKeyId = apiKeys[agent.id]
      if (!selectedKeyId) return false
      return availableApiKeys[agent.type]?.some((key) => key.id === selectedKeyId)
    })

    return allSelected
  }, [apiKeys, getAgentsRequiringApiKey, availableApiKeys])

  const handleApiKeyChange = (agentId: number, keyId: string) => {
    setApiKeys((prev) => ({
      ...prev,
      [agentId]: keyId,
    }))
  }

  const getApiKeysForBackend = useCallback(() => {
    const result: { [agentId: number]: string } = {}
    const requiredAgents = getAgentsRequiringApiKey()
    requiredAgents.forEach((agent) => {
      const keyId = apiKeys[agent.id]
      if (keyId) {
        const keyObj = availableApiKeys[agent.type]?.find((k) => k.id === keyId)
        if (keyObj) {
          result[agent.id] = keyObj.api_key
        }
      }
    })

    return result
  }, [getAgentsRequiringApiKey, apiKeys, availableApiKeys])

  const getFileUploadAgents = useCallback(() => {
    if (!service?.workflow?.nodes) return []

    const fileUploadAgents: Array<{
      id: number
      name: string
      type: string
      nodeId: string
      config: AgentTypeInfo
    }> = []

    Object.entries(service.workflow.nodes).forEach(([nodeId, node]) => {
      const agentId = node.agent_id
      const agentDetail = agentDetails[agentId]
      const agentType = agentDetail?.agent_type?.toLowerCase() || node.agent_type?.toLowerCase() || ""

      const config = getAgentTypeConfig(agentType, agentTypesInfo)
      if (config) {
        const supportsFileUploads =
          config.requiresUpload === true ||
          (config.supportedFileTypes && config.supportedFileTypes.length > 0) ||
          ["document", "image", "sound", "video", "file"].includes(config.input_type)

        if (supportsFileUploads) {
          fileUploadAgents.push({
            id: agentId,
            name: agentDetail?.name || node.agent_name || `Agent ${agentId}`,
            type: agentType,
            nodeId,
            config,
          })
        }
      }
    })

    return fileUploadAgents
  }, [service?.workflow, agentDetails, agentTypesInfo])
  // Current conversation ID for chat mode
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)

  // Chat history management functions
  const loadChatHistory = async () => {
    if (!service?.id) return
    
    setLoadingConversations(true)
    try {
      const { token, currentUserId } = getAuthHeaders()
      const response = await fetch(
        `http://127.0.0.1:8000/api/v1/mini-services/conv-list?skip=0&limit=50&current_user_id=${currentUserId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.ok) {
        const conversations = await response.json()
        // Filter conversations for this service and format them
        const serviceConversations = conversations
          .filter((conv: any) => conv.mini_service_id === service.id)
          .map((conv: any) => ({
            id: conv.id.toString(),
            title: getConversationTitle(conv.conversation),
            lastMessage: getLastMessage(conv.conversation),
            timestamp: new Date(conv.updated_at),
            messageCount: conv.conversation.length,
          }))
        setSavedConversations(serviceConversations)
      } else {
        console.error('Failed to load chat history:', response.statusText)
      }
    } catch (error) {
      console.error('Error loading chat history:', error)
    } finally {
      setLoadingConversations(false)
    }
  }

  const loadConversation = async (conversationId: string) => {
    try {
      const { token, currentUserId } = getAuthHeaders()
      const response = await fetch(
        `http://127.0.0.1:8000/api/v1/mini-services/conv-get/${conversationId}?current_user_id=${currentUserId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },        }
      )

      if (response.ok) {
        const conversation = await response.json()
        // Convert backend format to frontend format
        const messages = conversation.conversation.map((msg: any, index: number) => ({
          id: `${conversationId}-${index}`,
          type: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
          timestamp: new Date(),
          // For assistant messages, create a result object that matches expected structure
          result: msg.role === 'assistant' ? { final_output: msg.content } : undefined,
        }))
        setChatHistory(messages)
        setCurrentConversationId(conversationId)
        setChatHistorySidebar(false)

        toast({
          title: "Conversation loaded",
          description: `Loaded ${messages.length} messages from previous conversation`,
        })
      } else {
        console.error('Failed to load conversation:', response.statusText)
        toast({
          title: "Error",
          description: "Failed to load conversation",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error loading conversation:', error)
      toast({
        title: "Error", 
        description: "Failed to load conversation",
        variant: "destructive",
      })
    }
  }

  // Delete conversation function
  const deleteConversation = async (conversationId: string) => {
    try {
      setDeletingConversationId(conversationId)
      const { token, currentUserId } = getAuthHeaders()
      const response = await fetch(
        `http://127.0.0.1:8000/api/v1/mini-services/conversations/${conversationId}?current_user_id=${currentUserId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.ok) {
        // Remove from local state
        setSavedConversations(prev => prev.filter(conv => conv.id !== conversationId))
        
        // If the deleted conversation was currently loaded, clear the chat
        if (currentConversationId === conversationId) {
          setChatHistory([])
          setCurrentConversationId(null)
        }

        toast({
          title: "Conversation deleted",
          description: "The conversation has been successfully deleted",
        })
      } else {
        console.error('Failed to delete conversation:', response.statusText)
        toast({
          title: "Error",
          description: "Failed to delete conversation",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive",
      })
    } finally {
      setDeletingConversationId(null)
      setShowDeleteDialog(false)
      setConversationToDelete(null)
    }
  }

  // Handle delete button click
  const handleDeleteClick = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent loading the conversation
    setConversationToDelete(conversationId)
    setShowDeleteDialog(true)
  }

  // Handle confirm delete
  const handleConfirmDelete = () => {
    if (conversationToDelete) {
      deleteConversation(conversationToDelete)
    }
  }

  // Helper functions for conversation formatting
  const getConversationTitle = (conversation: any[]) => {
    const firstUserMessage = conversation.find(msg => msg.role === 'user')
    if (firstUserMessage) {
      return firstUserMessage.content.substring(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '')
    }
    return 'Untitled Conversation'
  }

  const getLastMessage = (conversation: any[]) => {
    if (conversation.length > 0) {
      const lastMsg = conversation[conversation.length - 1]
      return lastMsg.content.substring(0, 100) + (lastMsg.content.length > 100 ? '...' : '')
    }
    return ''
  }  // Convert chat history to API format
  const formatConversationForAPI = (messages: any[]) => {
    // Take last 50 messages to avoid token limits
    const recentMessages = messages.slice(-50)
    return recentMessages.map(msg => {
      let content = msg.content
      
      // For assistant messages, extract content from result if content is empty
      if (msg.type === 'assistant' && (!content || content === '') && msg.result) {
        if (typeof msg.result === 'string') {
          content = msg.result
        } else if (msg.result.final_output) {
          // Extract final_output for chat endpoint
          content = msg.result.final_output
        } else if (msg.result.result) {
          content = msg.result.result
        } else if (msg.result.text) {
          content = msg.result.text
        } else if (msg.result.content) {
          content = msg.result.content
        } else {
          // Fallback: stringify the result
          content = JSON.stringify(msg.result)
        }
      }
      
      return {
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: content || ''
      }
    })
  }

  // Create or update conversation
  const saveConversation = async (conversation: any[]) => {
    if (!service?.id || selectedMode !== 'chat') return

    try {
      const { token, currentUserId } = getAuthHeaders()
      
      if (currentConversationId) {        // Update existing conversation
        const response = await fetch(
          `http://127.0.0.1:8000/api/v1/mini-services/conversations/${currentConversationId}?current_user_id=${currentUserId}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              conversation: conversation,
              mini_service_id: service.id
            })
          }
        )

        if (!response.ok) {
          console.error('Failed to update conversation:', response.statusText)
        }
      } else {        // Create new conversation
        const response = await fetch(
          `http://127.0.0.1:8000/api/v1/mini-services/${service.id}/conversations?current_user_id=${currentUserId}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              conversation: conversation,
              mini_service_id: service.id
            })
          }
        )

        if (response.ok) {
          const newConversation = await response.json()
          setCurrentConversationId(newConversation.id.toString())
        } else {
          console.error('Failed to create conversation:', response.statusText)
        }
      }
    } catch (error) {
      console.error('Error saving conversation:', error)
    }
  }
  const handleSubmit = async () => {
    if (!service) return

    // For RAG services, only check for text input and API keys
    if (checkIfRAGDocumentService()) {
      if (!userInput?.trim()) {
        setError("Please provide a question for the RAG service.")
        return
      }

      if (!areAllRequiredApiKeysSelected) {
        setError("Please select all required API keys before proceeding.")
        return
      }

      const userMessage = {
        id: `user-${Date.now()}`,
        type: "user" as const,
        content: userInput?.trim() || "",
        timestamp: new Date(),
      }

      // Add user message to chat history
      const updatedHistory = [...chatHistory, userMessage]
      setChatHistory(updatedHistory)

      const currentInput = userInput
      setUserInput("")
      setError(null)
      
      setIsLoading(true)
      setResult(null)

      try {
        let response: any        // If in chat mode, use chat API with conversation history
        if (selectedMode === 'chat') {
          // Format conversation for API (include user message we just added)
          const conversationForAPI = formatConversationForAPI(updatedHistory)
          
          // Use regular service submit but include conversation context
          response = await performRegularServiceSubmit(currentInput, null, conversationForAPI)
        } else {
          // Normal mode - single request without history
          response = await performRegularServiceSubmit(currentInput, null)
        }

        // Extract content from response for assistant message
        let assistantContent = ""
        if (typeof response === 'string') {
          assistantContent = response
        } else if (response?.final_output) {
          assistantContent = response.final_output
        } else if (response?.result) {
          assistantContent = response.result
        } else if (response?.text) {
          assistantContent = response.text
        } else if (response?.content) {
          assistantContent = response.content
        }

        const assistantMessage = {
          id: `assistant-${Date.now()}`,
          type: "assistant" as const,
          content: assistantContent,
          result: response,
          timestamp: new Date(),
          isTyping: true,
        }
        const finalHistory = [...updatedHistory, assistantMessage]
        setChatHistory(finalHistory)
        setTypingMessageId(assistantMessage.id)

        // Save updated conversation in chat mode
        if (selectedMode === 'chat') {
          const finalConversationForAPI = formatConversationForAPI(finalHistory)
          await saveConversation(finalConversationForAPI)
        }
      } catch (err: any) {
        console.error("Error running RAG service:", err)

        const errorMessage = {
          id: `assistant-${Date.now()}`,
          type: "assistant" as const,
          content: err.message || "An unexpected error occurred while processing your request",
          timestamp: new Date(),
        }
        const finalHistory = [...updatedHistory, errorMessage]
        setChatHistory(finalHistory)

        // Save conversation with error in chat mode
        if (selectedMode === 'chat') {
          const finalConversationForAPI = formatConversationForAPI(finalHistory)
          await saveConversation(finalConversationForAPI)
        }

        setError(err.message || "An unexpected error occurred while processing your request")
      } finally {
        setIsLoading(false)
      }
      return
    }

    const fileUploadAgents = getFileUploadAgents()
    const hasFileUploadAgents = fileUploadAgents.length > 0

    const fileUploadRequirements = getFileUploadRequirements()
    const requiresFileUpload =
      hasFileUploadAgents || (fileUploadRequirements && fileUploadRequirements.type === "document")

    const nonRagFileAgents = fileUploadAgents.filter((agent) => agent.type !== "rag")

    if ((nonRagFileAgents.length > 0 || fileUploadRequirements?.type === "document") && !uploadedFile) {
      setError("Please upload a file for this service.")
      return
    }

    if (!requiresFileUpload && !userInput?.trim()) {
      setError("Please provide text input for this service.")
      return
    }

    if (!areAllRequiredApiKeysSelected) {
      setError("Please select all required API keys before proceeding.")
      return
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      type: "user" as const,
      content: userInput?.trim() || "",
      file: uploadedFile || undefined,
      timestamp: new Date(),
    }

    // Add user message to chat history
    const updatedHistory = [...chatHistory, userMessage]
    setChatHistory(updatedHistory)

    const currentInput = userInput
    const currentFile = uploadedFile
    setUserInput("")
    setUploadedFile(null)
    setError(null)

    setIsLoading(true)
    setResult(null)

    try {
      let response: any

      // Determine conversation context for chat mode
      const conversationForAPI = selectedMode === 'chat' ? formatConversationForAPI(updatedHistory) : undefined

      if (hasFileUploadAgents) {
        response = await performUnifiedFileUpload(currentInput, currentFile, conversationForAPI)
      } else if (fileUploadRequirements?.type === "document") {
        response = await performDocumentUpload(currentInput, currentFile, conversationForAPI)      } else {
        response = await performRegularServiceSubmit(currentInput, currentFile, conversationForAPI)
      }

      // Extract content from response for assistant message
      let assistantContent = ""
      if (typeof response === 'string') {
        assistantContent = response
      } else if (response?.final_output) {
        assistantContent = response.final_output
      } else if (response?.result) {
        assistantContent = response.result
      } else if (response?.text) {
        assistantContent = response.text
      } else if (response?.content) {
        assistantContent = response.content
      }

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        type: "assistant" as const,
        content: assistantContent,
        result: response,
        timestamp: new Date(),
        isTyping: true,
      }
      const finalHistory = [...updatedHistory, assistantMessage]
      setChatHistory(finalHistory)
      setTypingMessageId(assistantMessage.id)

      // Save updated conversation with assistant response in chat mode
      if (selectedMode === 'chat') {
        const finalConversationForAPI = formatConversationForAPI(finalHistory)
        await saveConversation(finalConversationForAPI)
      }
    } catch (err: any) {
      console.error("Error running service:", err)

      const errorMessage = {
        id: `assistant-${Date.now()}`,
        type: "assistant" as const,
        content: err.message || "An unexpected error occurred while processing your request",
        timestamp: new Date(),
      }
      const finalHistory = [...updatedHistory, errorMessage]
      setChatHistory(finalHistory)

      // Save conversation with error in chat mode
      if (selectedMode === 'chat') {
        const finalConversationForAPI = formatConversationForAPI(finalHistory)
        await saveConversation(finalConversationForAPI)
      }

      setError(err.message || "An unexpected error occurred while processing your request")
    } finally {
      setIsLoading(false)
      
      // Reset document processing state in case it's still active
      setDocumentProcessingState({
        isProcessing: false,
        stage: "complete", 
        message: "",
      })
    }
  }

  const performUnifiedFileUpload = async (inputText: string, file: File | null, conversation?: any[]) => {
    const fileUploadAgents = getFileUploadAgents()
    const primaryAgent = fileUploadAgents[0]
    const config = primaryAgent.config

    setDocumentProcessingState({
      isProcessing: true,
      stage: "uploading",
      message: config.processingMessage || "Processing file...",
    })

    const { token, currentUserId } = getAuthHeaders()

    if (primaryAgent.type === "rag") {
      if (!inputText || !inputText.trim()) {
        throw new Error("Please provide a query for the RAG agent")
      }

      const apiKeysForBackend = getApiKeysForBackend()
      if (Object.keys(apiKeysForBackend).length === 0) {
        throw new Error("API key is required for RAG document queries")
      }      // Prepare input with conversation history if provided (for chat mode)
      let finalInput = inputText
      if (conversation && conversation.length > 0) {
        const historyText = conversation.map(msg => 
          `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
        ).join('\n')
        finalInput = `This is the current conversation history: ${historyText} and this is the latest message of the user: ${inputText}`
      }
      
      const processBody: any = {
        input: finalInput,
        api_keys: apiKeysForBackend,
        collection_id: `rag_collection_${primaryAgent.id}`,
      }

      const abortController = createAbortController()
      const response = await fetch(
        `http://127.0.0.1:8000/api/v1/mini-services/${serviceId}/run?current_user_id=${currentUserId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(processBody),
          signal: abortController.signal,
        },
      )

      if (!response.ok) {
        let errorData = null
        try {
          errorData = await response.json()
        } catch (parseError) {
          errorData = { detail: response.statusText }
        }
        
        // For RAG services, the context is document analysis
        const userFriendlyError = parseApiError(errorData, "document analysis")
        throw new Error(userFriendlyError)
      }

      const data = await response.json()
      
      // Reset processing state when RAG operation completes
      setDocumentProcessingState({
        isProcessing: false,
        stage: "complete",
        message: "",
      })
      
      return data
    }

    if (config.requiresUpload && file) {
      setDocumentProcessingState({
        isProcessing: true,
        stage: "uploading",
        message: "Uploading file to server...",
      })

      const uploadFormData = new FormData()
      uploadFormData.append("file", file, file.name)

      const uploadAbortController = createAbortController()
      const uploadResponse = await fetch(
        `http://127.0.0.1:8000/api/v1/mini-services/upload?current_user_id=${currentUserId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: uploadFormData,
          signal: uploadAbortController.signal,
        },
      )

      if (!uploadResponse.ok) {
        let errorData = null
        try {
          errorData = await uploadResponse.json()
        } catch (parseError) {
          errorData = { detail: uploadResponse.statusText }
        }
        
        const userFriendlyError = parseApiError(errorData, "file upload")
        throw new Error(userFriendlyError)
      }

      const uploadData = await uploadResponse.json()

      setDocumentProcessingState({
        isProcessing: true,
        stage: "processing",
        message: "Processing uploaded file...",
      })      // Prepare input with conversation history if provided (for chat mode)
      let finalInput = uploadData.saved_as
      if (conversation && conversation.length > 0) {
        const historyText = conversation.map(msg => 
          `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
        ).join('\n')
        finalInput = `This is the current conversation history: ${historyText} and this is the latest message of the user: ${uploadData.saved_as}`
      }
      
      const processBody: any = {
        input: finalInput,
        api_keys: getApiKeysForBackend(),
      }

      const processAbortController = createAbortController()
      const processResponse = await fetch(
        `http://127.0.0.1:8000/api/v1/mini-services/${serviceId}/run?current_user_id=${currentUserId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(processBody),
          signal: processAbortController.signal,
        },
      )

      if (!processResponse.ok) {
        let errorData = null
        try {
          errorData = await processResponse.json()
        } catch (parseError) {
          errorData = { detail: processResponse.statusText }
        }
        
        // Determine context based on agent type
        let context = "file processing"
        if (primaryAgent.type.includes("image") || primaryAgent.type.includes("dalle")) {
          context = "image generation"
        } else if (primaryAgent.type.includes("audio") || primaryAgent.type.includes("tts")) {
          context = "audio generation"
        } else if (primaryAgent.type.includes("text")) {
          context = "text generation"
        }
        
        const userFriendlyError = parseApiError(errorData, context)
        throw new Error(userFriendlyError)
      }

      const processData = await processResponse.json()
      
      // Reset processing state when file processing completes
      setDocumentProcessingState({
        isProcessing: false,
        stage: "complete",
        message: "",
      })
      
      return processData
    }

    const formData = new FormData()

    if (file) {
      formData.append(config.fileFieldName, file, file.name)
    }    // Handle input and conversation history for mini service communication
    if (conversation && conversation.length > 0) {
      // For chat mode with history, combine history and current message in input field
      const historyText = conversation.map(msg => 
        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n')
      const combinedInput = `This is the current conversation history: ${historyText} and this is the latest message of the user: ${inputText || ''}`
      formData.append("input", combinedInput)
    } else {
      // For non-chat mode or first message, use standard input handling
      if (inputText && !config.hasSpecialUI) {
        formData.append("input", inputText)
      }
    }

    Object.entries(config.additionalFields || {}).forEach(([fieldName, fieldValue]) => {
      if (typeof fieldValue === "function") {
        if (fieldName === "filename" && file) {
          formData.append(fieldName, fieldValue(file))
        } else if (fieldName === "api_keys" && config.api_key_required) {
          const apiKeysForBackend = getApiKeysForBackend()
          formData.append(fieldName, fieldValue(apiKeysForBackend))
        } else if (fieldName === "include_timestamps") {
          formData.append(fieldName, fieldValue(transcriptionOptions))
        }      } else {
        formData.append(fieldName, fieldValue)
      }
    })

    if (config.hasSpecialUI && inputText && inputText.trim()) {
      formData.append("query", inputText)
    }

    const endpoint = typeof config.endpoint === "function" ? config.endpoint(primaryAgent.id) : config.endpoint

    const legacyAbortController = createAbortController()
    const response = await fetch(`${endpoint}?current_user_id=${currentUserId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
      signal: legacyAbortController.signal,
    })

    if (!response.ok) {
      let errorData = null
      try {
        errorData = await response.json()
      } catch (parseError) {
        errorData = { detail: response.statusText }
      }
      
      // Determine context based on agent type
      let context = "service execution"
      if (primaryAgent.type.includes("image") || primaryAgent.type.includes("dalle")) {
        context = "image generation"
      } else if (primaryAgent.type.includes("audio") || primaryAgent.type.includes("tts")) {
        context = "audio generation"
      } else if (primaryAgent.type.includes("text")) {
        context = "text generation"
      } else if (primaryAgent.type.includes("transcrib")) {
        context = "audio transcription"
      }
      
      const userFriendlyError = parseApiError(errorData, context)
      throw new Error(userFriendlyError)
    }

    const data = await response.json()
    
    // Check for errors in the response body even if HTTP status is 200
    if (data && data.error) {
      // Determine context based on agent type
      let context = "file processing"
      if (primaryAgent.type.includes("image") || primaryAgent.type.includes("dalle")) {
        context = "image generation"
      } else if (primaryAgent.type.includes("audio") || primaryAgent.type.includes("tts")) {
        context = "audio generation"
      } else if (primaryAgent.type.includes("text")) {
        context = "text generation"
      }
      
      const userFriendlyError = parseApiError(data.error, context)
      throw new Error(userFriendlyError)
    }
    
    return data
  }
  const performRegularServiceSubmit = async (inputText: string, file: File | null, conversation?: any[]) => {
    const { token, currentUserId } = getAuthHeaders()

    let body: FormData | string
    const headers: Record<string, string> = {      Authorization: `Bearer ${token}`,
    }

    if (service!.input_type === "text") {
      const bodyData: any = {
        api_keys: getApiKeysForBackend(),
      }
      
      // Add conversation history if provided (for chat mode)
      if (conversation && conversation.length > 0) {
        // For chat mode with history, combine history and current message in input field
        const historyText = conversation.map(msg => 
          `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
        ).join('\n')
        bodyData.input = `This is the current conversation history: ${historyText} and this is the latest message of the user: ${inputText}`
      } else {
        bodyData.input = inputText
      }
      
      body = JSON.stringify(bodyData)
      headers["Content-Type"] = "application/json"    } else if (file) {
      body = new FormData()
      body.append("file", file)
      
      // Handle input and conversation history for file uploads
      if (conversation && conversation.length > 0) {
        // For chat mode with history, combine history and current message in input field
        const historyText = conversation.map(msg => 
          `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
        ).join('\n')
        const combinedInput = `This is the current conversation history: ${historyText} and this is the latest message of the user: ${inputText || ''}`
        body.append("input", combinedInput)
      } else if (inputText) {
        body.append("input", inputText)
      }
      
      const backendKeys = getApiKeysForBackend()
      if (Object.keys(backendKeys).length > 0) {
        body.append("api_keys", JSON.stringify(backendKeys))
      }
    } else {
      throw new Error("No input provided")
    }

    const response = await fetch(
      `http://127.0.0.1:8000/api/v1/mini-services/${serviceId}/run?current_user_id=${currentUserId}`,
      {
        method: "POST",
        headers,
        body,
      },
    )

    if (!response.ok) {
      let errorData = null
      try {
        errorData = await response.json()
      } catch (parseError) {
        errorData = { detail: response.statusText }
      }
      
      // Determine context based on service type for better error messages
      let context = "service execution"
      if (service?.output_type === "image") {
        context = "image generation"
      } else if (service?.output_type === "sound") {
        context = "audio generation"
      } else if (service?.output_type === "text") {
        context = "text generation"
      }
      
      const userFriendlyError = parseApiError(errorData, context)
      throw new Error(userFriendlyError)
    }

    const data = await response.json()
    
    // Check for errors in the response body even if HTTP status is 200
    if (data && data.error) {
      // Determine context based on service type for better error messages
      let context = "service execution"
      if (service?.output_type === "image") {
        context = "image generation"
      } else if (service?.output_type === "sound") {
        context = "audio generation"
      } else if (service?.output_type === "text") {
        context = "text generation"
      }
      
      const userFriendlyError = parseApiError(data.error, context)
      throw new Error(userFriendlyError)
    }
    
    return data
  }

  const performDocumentUpload = async (inputText: string, file: File | null, conversation?: any[]) => {
    if (!file) {
      throw new Error("Document file is required")
    }

    const { token, currentUserId } = getAuthHeaders()

    setDocumentProcessingState({
      isProcessing: true,
      stage: "uploading",
      message: "Uploading document to server...",
    })

    const uploadFormData = new FormData()
    uploadFormData.append("file", file, file.name)

    const uploadAbortController = createAbortController()
    const uploadResponse = await fetch(
      `http://127.0.0.1:8000/api/v1/mini-services/upload?current_user_id=${currentUserId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadFormData,
        signal: uploadAbortController.signal,
      },
    )

    if (!uploadResponse.ok) {
      let errorData = null
      try {
        errorData = await uploadResponse.json()
      } catch (parseError) {
        errorData = { detail: uploadResponse.statusText }
      }
      
      const userFriendlyError = parseApiError(errorData, "document upload")
      throw new Error(userFriendlyError)
    }

    const uploadData = await uploadResponse.json()

    setDocumentProcessingState({
      isProcessing: true,
      stage: "processing",
      message: "Processing uploaded document...",
    })

    const processBody: any = {
      file: uploadData.saved_as,
      api_keys: getApiKeysForBackend(),
    }

    // Handle input and conversation history for document processing
    if (conversation && conversation.length > 0) {
      // For chat mode with history, combine history and current message in input field
      const historyText = conversation.map(msg => 
        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n')
      processBody.input = `This is the current conversation history: ${historyText} and this is the latest message of the user: ${inputText || uploadData.saved_as}`
    } else {
      processBody.input = inputText || uploadData.saved_as
    }

    const processAbortController = createAbortController()
    const processResponse = await fetch(
      `http://127.0.0.1:8000/api/v1/mini-services/${serviceId}/run?current_user_id=${currentUserId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(processBody),
        signal: processAbortController.signal,
      },
    )

    if (!processResponse.ok) {
      let errorData = null
      try {
        errorData = await processResponse.json()
      } catch (parseError) {
        errorData = { detail: processResponse.statusText }
      }
      
      const userFriendlyError = parseApiError(errorData, "document processing")
      throw new Error(userFriendlyError)
    }

    const processData = await processResponse.json()
    
    // Check for errors in the response body even if HTTP status is 200
    if (processData && processData.error) {
      const userFriendlyError = parseApiError(processData.error, "document processing")
      throw new Error(userFriendlyError)
    }
    
    // Reset processing state when document processing completes
    setDocumentProcessingState({
      isProcessing: false,
      stage: "complete",
      message: "",
    })
    
    return processData
  }

  const handleDelete = async () => {
    if (!service?.id) return

    await deleteMiniService(service.id, {
      showToast: true,
      onSuccess: () => {
        router.refresh()
        router.push("/apps")
      },
    })
  }



  const getServiceIcon = (className: string = "h-6 w-6 text-white") => {
    if (!service) return <Wand2 className={className} />
    return getServiceTypeConfig(service.input_type, service.output_type, className).iconComponent as React.ReactElement
  }

  const extractAudioUrl = (result: any): string | null => {
    if (!result || !result.process_id) return null

    const { currentUserId } = getAuthHeaders()
    if (!currentUserId) return null

    return `http://127.0.0.1:8000/api/v1/mini-services/audio/${result.process_id}?current_user_id=${currentUserId}`
  }

  const playAudio = (audioUrl: string) => {
    if (audioPlayer) {
      audioPlayer.pause()
    }

    const audio = new Audio(audioUrl)
    setAudioPlayer(audio)

    audio.onplay = () => setIsPlaying(true)
    audio.onpause = () => setIsPlaying(false)
    audio.onended = () => setIsPlaying(false)

    audio.play().catch((err) => {
      console.error("Error playing audio:", err)
      setError("Failed to play audio. Please try again.")
    })
  }

  const pauseAudio = () => {
    if (audioPlayer) {
      audioPlayer.pause()
    }
  }

  const renderChatInput = () => {
    if (!service) return null

    // Check if this is a RAG service - if so, always use text input
    if (checkIfRAGDocumentService()) {
      return (
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <Textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask a question about the documents in your knowledge base..."
              className="bg-zinc-800/50 border-zinc-700/50 text-white rounded-2xl px-4 py-3 resize-none min-h-[44px] max-h-32 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
            />
          </div>
        </div>
      )
    }

    const fileUploadRequirements = getFileUploadRequirements()

    if (fileUploadRequirements) {
      const { acceptedTypes, maxSize, hasSpecialUI, type, agentName } = fileUploadRequirements

      if (hasSpecialUI && type === "transcribe") {
        return (
          <div className="space-y-3">
            {!uploadedFile ? (
              <div className="border-2 border-dashed border-zinc-700/50 rounded-2xl p-4 text-center hover:border-purple-500/50 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept={acceptedTypes}
                  className="hidden"
                  id="chat-file-upload"
                  onChange={handleFileUpload}
                />
                <button
                  onClick={() => document.getElementById("chat-file-upload")?.click()}
                  className="flex flex-col items-center space-y-2 w-full"
                >
                  <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center">
                    {acceptedTypes.includes(".mp3") ? (
                      <Headphones className="h-6 w-6 text-purple-400" />
                    ) : (
                      <Video className="h-6 w-6 text-purple-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-gray-300 text-sm">Upload audio or video file</p>
                    <p className="text-gray-500 text-xs">
                      Max {maxSize}MB • {acceptedTypes}
                    </p>
                  </div>
                </button>
              </div>
            ) : (
              <div className="bg-zinc-800/50 rounded-2xl p-3 flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center">
                  {acceptedTypes.includes(".mp3") ? (
                    <Headphones className="h-4 w-4 text-purple-400" />
                  ) : (
                    <Video className="h-4 w-4 text-purple-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{uploadedFile.name}</p>
                  <p className="text-gray-400 text-xs">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUploadedFile(null)}
                  className="text-gray-400 hover:text-red-400 p-1 h-6 w-6"
                >
                  ×
                </Button>
              </div>
            )}

            {uploadedFile && (
              <div className="bg-zinc-800/30 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Include timestamps</span>
                  <Switch
                    checked={transcriptionOptions.include_timestamps}
                    onCheckedChange={(checked) =>
                      setTranscriptionOptions((prev) => ({ ...prev, include_timestamps: checked }))
                    }
                    className="data-[state=checked]:bg-purple-600"
                  />
                </div>
              </div>
            )}
          </div>
        )
      }

      const getFileIcon = () => {
        if (acceptedTypes.includes(".jpg") || acceptedTypes.includes(".png")) return ImageIcon
        if (acceptedTypes.includes(".mp3") || acceptedTypes.includes(".wav")) return Headphones
        if (acceptedTypes.includes(".mp4") || acceptedTypes.includes(".mov")) return Video
        return FileText
      }

      const FileIcon = getFileIcon()
      const fileTypeName = acceptedTypes.includes(".jpg")
        ? "image"
        : acceptedTypes.includes(".mp3")
          ? "audio"
          : acceptedTypes.includes(".mp4")
            ? "video"
            : "document"

      return (
        <div className="space-y-3">
          {!uploadedFile ? (
            <div className="border-2 border-dashed border-zinc-700/50 rounded-2xl p-4 text-center hover:border-purple-500/50 transition-colors cursor-pointer">
              <input
                type="file"
                accept={acceptedTypes}
                className="hidden"
                id="chat-file-upload"
                onChange={handleFileUpload}
              />
              <button
                onClick={() => document.getElementById("chat-file-upload")?.click()}
                className="flex flex-col items-center space-y-2 w-full"
              >
                <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center">
                  <FileIcon className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-gray-300 text-sm">Upload {fileTypeName}</p>
                  <p className="text-gray-500 text-xs">
                    Max {maxSize}MB • {acceptedTypes}
                  </p>
                </div>
              </button>
            </div>
          ) : (
            <div className="bg-zinc-800/50 rounded-2xl p-3 flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center">
                <FileIcon className="h-4 w-4 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm truncate">{uploadedFile.name}</p>
                <p className="text-gray-400 text-xs">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUploadedFile(null)}
                className="text-gray-400 hover:text-red-400 p-1 h-6 w-6"
              >
                ×
              </Button>
            </div>
          )}
        </div>
      )
    }

    return (
      <div className="flex items-end space-x-2">
        <div className="flex-1 w-full">
          <Textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type your message here..."
            className="bg-zinc-800/50 border-zinc-700/50 text-white rounded-2xl px-4 py-3 resize-none min-h-[44px] max-h-32 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
          />
        </div>
      </div>
    )
  }

  const renderWorkflow = () => {
    if (!service?.workflow?.nodes) return null

    const getOrderedNodes = () => {
      const nodes = service.workflow.nodes
      const orderedNodes: any[] = []
      let currentNodeId = Object.keys(nodes).find((id) => !Object.values(nodes).some((node) => node.next === id))
      if (!currentNodeId && Object.keys(nodes).length > 0) currentNodeId = Object.keys(nodes)[0]
      while (currentNodeId) {
        const node = nodes[currentNodeId]
        if (!node) break
        const agentDetail = node.agent_id ? agentDetails[node.agent_id] : null
        orderedNodes.push({
          id: currentNodeId,
          ...node,
          agent_name: agentDetail?.name || node.agent_name || `Agent ${node.agent_id}`,
          agent_description: agentDetail?.system_instruction || node.agent_description || "No description available",
          agent_type: agentDetail?.agent_type || node.agent_type || "Unknown",
          agent_config: agentDetail?.config,
          agent_input_type: agentDetail?.input_type,
          agent_output_type: agentDetail?.output_type,
        })
        currentNodeId = node.next as string | undefined
      }
      return orderedNodes
    }
    const orderedNodes = getOrderedNodes()
    
    // Calculate dynamic width based on number of agents
    const getContainerClasses = () => {
      const nodeCount = orderedNodes.length
      if (nodeCount === 0) return "w-full"
      
      // Return responsive width classes based on agent count - optimized for shorter arrows
      if (nodeCount === 1) return "w-fit min-w-[180px] sm:min-w-[220px] lg:min-w-[280px] mx-auto"
      if (nodeCount === 2) return "w-fit min-w-[380px] sm:min-w-[460px] lg:min-w-[580px] mx-auto"
      if (nodeCount === 3) return "w-fit min-w-[580px] sm:min-w-[700px] lg:min-w-[880px] mx-auto"
      if (nodeCount === 4) return "w-fit min-w-[780px] sm:min-w-[940px] lg:min-w-[1180px] mx-auto"
      
      // For 5 or more agents, allow full width with scroll
      return "w-full min-w-fit"
    }

    const getAgentColor = (type: string) => {
      type = type.toLowerCase()
      if (type.includes("gemini")) return "from-blue-600/20 to-blue-900/30"
      if (type.includes("openai")) return "from-green-600/20 to-green-900/30"
      if (type.includes("image")) return "from-purple-600/20 to-purple-900/30"
      if (type.includes("text")) return "from-pink-600/20 to-pink-900/30"
      if (type.includes("audio")) return "from-orange-600/20 to-orange-900/30"
      if (type.includes("video")) return "from-red-600/20 to-red-900/30"
      return "from-indigo-600/20 to-indigo-900/30"
    }

    return (
      <div className={`relative bg-black/20 border border-purple-900/20 backdrop-blur-sm rounded-xl p-2 sm:p-4 lg:p-6 ${getContainerClasses()}`}>
        <div className="w-full overflow-visible">
          <div className="flex items-stretch gap-2 sm:gap-3 lg:gap-4 py-4 justify-center">
            {orderedNodes.map((node, idx) => {
              const description = node.agent_description || ""
              const isLongDescription = description.length > 100
              const isExpanded = expandedDescriptions[node.id]
              const agentColor = getAgentColor(node.agent_type)
              const showArrow = idx < orderedNodes.length - 1

              return (
                <div key={node.id} className="relative flex flex-col items-center group min-w-0 flex-shrink-0">
                  <div
                    className={`
                      transition-all duration-300 bg-gradient-to-br from-zinc-900 to-zinc-950 
                      border-2 border-purple-900/30 rounded-xl shadow-[0_4px_20px_rgba(107,70,193,0.2)]
                      px-2 sm:px-3 lg:px-4 py-2 sm:py-3 lg:py-4 w-40 sm:w-48 lg:w-56 z-10 hover:scale-105 hover:border-purple-500/60 
                      focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-black
                      cursor-pointer group/card origin-center flex-shrink-0
                      ${agentColor}
                    `}
                    tabIndex={0}
                    role="button"
                    aria-expanded={isExpanded}
                    onClick={() => setExpandedDescriptions((prev) => ({ ...prev, [node.id]: !prev[node.id] }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        setExpandedDescriptions((prev) => ({ ...prev, [node.id]: !prev[node.id] }))
                      }
                    }}
                  >
                    <div className="absolute -top-1 sm:-top-2 lg:-top-3 bg-gradient-to-br from-purple-600 to-indigo-700 h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 rounded-full flex items-center justify-center shadow-lg shadow-purple-900/20 z-100">
                      <span className="text-[10px] sm:text-xs font-bold text-white">{idx + 1}</span>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2 lg:mb-3">
                      <div
                        className={`h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 
                        flex items-center justify-center shadow-inner text-xs text-white font-bold
                        transition-all group-hover/card:scale-110 group-hover/card:shadow-purple-500/30`}
                      >
                        {(() => {
                          const type = node.agent_type.toLowerCase()
                          if (type.includes("gemini") && type.includes("text2image")) {
                            return <LucideBrush className="w-3 h-3 sm:w-4 sm:h-4" />
                          } else if (type.includes("gemini")) {
                            return <LucideBot className="w-3 h-3 sm:w-4 sm:h-4" />
                          } else if (type.includes("openai")) {
                            return <LucideBot className="w-3 h-3 sm:w-4 sm:h-4" />
                          } else if (type.includes("edge_tts") || type.includes("bark_tts")) {
                            return <LucideVolume2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          } else if (type.includes("transcribe")) {
                            return <LucideMic className="w-3 h-3 sm:w-4 sm:h-4" />
                          } else if (type.includes("text2image") || type.includes("dalle")) {
                            return <LucideImage className="w-3 h-3 sm:w-4 sm:h-4" />
                          } else if (type.includes("internet_research")) {
                            return <LucideSearch className="w-3 h-3 sm:w-4 sm:h-4" />
                          } else if (type.includes("document_parser")) {
                            return <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                          } else if (type.includes("custom_endpoint")) {
                            return <LucidePlug className="w-3 h-3 sm:w-4 sm:h-4" />
                          } else if (type.includes("audio") || type.includes("text2speech")) {
                            return <LucideMusic className="w-3 h-3 sm:w-4 sm:h-4" />
                          } else if (type.includes("video")) {
                            return <LucideClapperboard className="w-3 h-3 sm:w-4 sm:h-4" />
                          } else {
                            return <LucideSparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                          }
                        })()}
                      </div>
                      <h3
                        className="font-semibold text-white text-xs sm:text-sm lg:text-base truncate flex-1"
                        title={node.agent_name}
                      >
                        {node.agent_name}
                      </h3>
                    </div>

                    <div className="text-gray-300 text-[10px] sm:text-xs mt-1">
                      {isLongDescription ? (
                        <>
                          <div
                            className={`overflow-hidden transition-all duration-300 ease-in-out
                            ${isExpanded ? "max-h-24 sm:max-h-32 lg:max-h-48" : "max-h-8 sm:max-h-10 lg:max-h-12"}`}
                          >
                            <p className={`leading-relaxed text-[10px] sm:text-xs ${isExpanded ? "" : "line-clamp-2"}`}>
                              {description}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setExpandedDescriptions((prev) => ({ ...prev, [node.id]: !prev[node.id] }))
                            }}
                            className="text-purple-400 text-[10px] sm:text-xs mt-1 hover:text-purple-300 focus:outline-none focus:text-purple-200 transition-colors"
                            aria-label={isExpanded ? "Show less" : "Show more"}
                          >
                            {isExpanded ? "Show less ↑" : "Show more ↓"}
                          </button>
                        </>
                      ) : (
                        <p className="leading-relaxed text-[10px] sm:text-xs">{description}</p>
                      )}
                    </div>

                    <div className="mt-2 sm:mt-3 lg:mt-4 flex flex-wrap gap-1 lg:gap-2">
                      <span className="text-[10px] sm:text-xs bg-purple-900/40 text-purple-300 px-1 sm:px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-full font-medium border border-purple-800/30">
                        {node.agent_type}
                      </span>
                      {node.agent_config?.model && (
                        <span className="text-[10px] sm:text-xs bg-indigo-900/40 text-indigo-300 px-1 sm:px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-full font-medium border border-indigo-800/30">
                          {node.agent_config.model}
                        </span>
                      )}
                      {doesAgentTypeRequireApiKey(node.agent_type?.toLowerCase() || "") && (
                        <span className="text-[10px] sm:text-xs bg-amber-900/40 text-amber-300 px-1 sm:px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-full font-medium flex items-center gap-1 border border-amber-800/30">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-2 w-2 sm:h-2.5 sm:w-2.5 lg:h-3 lg:w-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z"
                            />
                          </svg>
                          <span className="hidden sm:inline lg:inline">API Key</span>
                          <span className="sm:hidden lg:hidden">Key</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {showArrow && (
                    <div className="absolute -right-1 sm:-right-2 lg:-right-3 top-1/2 transform -translate-y-1/2 translate-x-1 z-20">
                      <div className="flex items-center justify-center">
                        <div className="relative">
                          <div className="h-[2px] lg:h-[3px] w-3 sm:w-4 lg:w-6 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"></div>

                          <div
                            className="absolute -right-0.5 top-1/2 transform -translate-y-1/2 w-0 h-0 
                                        border-t-[2px] sm:border-t-[3px] lg:border-t-[4px] border-t-transparent 
                                        border-l-[3px] sm:border-l-[4px] lg:border-l-[6px] border-l-indigo-500
                                        border-b-[2px] sm:border-b-[3px] lg:border-b-[4px] border-b-transparent"
                          ></div>

                          <div
                            className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2
                                        h-1 w-1 sm:h-1.5 sm:w-1.5 lg:h-2 lg:w-2 rounded-full bg-purple-300/80 animate-pulse"
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const getFileUploadRequirements = useCallback(() => {
    const agents = getFileUploadAgents()
    if (agents.length > 0) {
      const primaryAgent = agents[0]
      return {
        acceptedTypes: primaryAgent.config.supportedFileTypes.join(","),
        maxSize: primaryAgent.config.maxFileSize,
        hasSpecialUI: primaryAgent.config.hasSpecialUI,
        type: primaryAgent.type,
        agentName: primaryAgent.name,
      }
    }

    if (!service?.workflow?.nodes) return null

    const documentAgents = Object.entries(service.workflow.nodes).filter(([nodeId, node]) => {
      const agentDetail = agentDetails[node.agent_id]
      return agentDetail?.input_type === "document" || service.input_type === "document"
    })

    if (documentAgents.length > 0) {
      const [nodeId, node] = documentAgents[0]
      const agentDetail = agentDetails[node.agent_id]

      return {
        acceptedTypes: ".pdf,.docx,.txt,.doc,.rtf",
        maxSize: 10,
        hasSpecialUI: false,
        type: "document",
        agentName: agentDetail?.name || node.agent_name || `Agent ${ node.agent_id}`,
      }
    }

    return null
  }, [getFileUploadAgents, service?.workflow, service?.input_type, agentDetails])

  useEffect(() => {
    const isRAGService = checkIfRAGDocumentService()
    const hasServiceId = !!service?.id
    const isAuth = !!isAuthenticated

    if (!isRAGService || !hasServiceId || !isAuth) return

    const fetchDocumentCollection = async () => {
      try {
        setDocumentCollection((prev) => ({ ...prev, isLoading: true }))
        const { token, currentUserId } = getAuthHeaders()

        const agentId = getRAGAgentId()

        if (!agentId) {
          console.error("RAG agent ID not found")
          setDocumentCollection((prev) => ({ ...prev, isLoading: false }))
          return
        }

        const url = `http://127.0.0.1:8000/api/v1/agents/${agentId}/documents?current_user_id=${currentUserId}`

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error("Failed to fetch document collection:", {
            status: response.status,
            statusText: response.statusText,
            errorText,
          })
          setDocumentCollection((prev) => ({ ...prev, isLoading: false }))
          return
        }

        const data = await response.json()

        setDocumentCollection({
          documents: data.documents || [],
          isLoading: false,
        })
      } catch (error) {
        console.error("Error fetching document collection:", error)
        setDocumentCollection((prev) => ({ ...prev, isLoading: false }))
      }
    }

    fetchDocumentCollection()
  }, [service?.id, isAuthenticated, agentDetails])

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return "00:00.0"

    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    const milliseconds = Math.floor((seconds % 1) * 10)

    const formattedMinutes = minutes.toString().padStart(2, "0")
    const formattedSeconds = remainingSeconds.toString().padStart(2, "0")

    return `${formattedMinutes}:${formattedSeconds}.${milliseconds}`
  }

  const checkIfRAGDocumentService = (): boolean => {
    const fileUploadAgents = getFileUploadAgents()
    const isRAG = fileUploadAgents.some((agent) => agent.type === "rag")
    return isRAG
  }

  const checkIfTranscriptionService = (): boolean => {
    const fileUploadAgents = getFileUploadAgents()
    return fileUploadAgents.some((agent) => agent.type === "transcribe")
  }
  // Function to get the RAG agent ID from the service workflow
  const getRAGAgentId = useCallback((): number | null => {
    const fileUploadAgents = getFileUploadAgents()
    const ragAgent = fileUploadAgents.find((agent) => agent.type === "rag")
    return ragAgent ? ragAgent.id : null
  }, [getFileUploadAgents])

  // New function to check if service is eligible for chat mode
  const checkIfChatModeEligible = (): boolean => {
    // RAG services always support chat mode
    if (checkIfRAGDocumentService()) {
      return true
    }

    // Services with text output type support chat mode
    if (service?.output_type === "text") {
      return true
    }

    return false
  }

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedStates((prev) => ({ ...prev, [key]: true }))
      toast({
        title: "Copied!",
        description: "Content copied to clipboard",
      })
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [key]: false }))
      }, 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
      toast({
        title: "Copy failed",
        description: "Failed to copy content to clipboard",
        variant: "destructive",
      })
    }
  }

  // Function to extract token usage data from message result
  const extractTokenUsage = (result: any) => {
    if (!result) return null

    // Check for various possible locations of token usage data
    const tokenUsage = result.token_usage || result.usage || result.metadata?.token_usage || result.metadata?.usage

    if (!tokenUsage) return null

    const promptTokens = tokenUsage.prompt_tokens || 0
    const completionTokens = tokenUsage.completion_tokens || 0
    const totalTokens = tokenUsage.total_tokens || promptTokens + completionTokens

    // Try to get cost from multiple locations
    let estimatedCostUsd =
      tokenUsage.estimated_cost_usd ||
      result.estimated_cost_usd ||
      result.pricing?.estimated_cost_usd ||
      result.metadata?.estimated_cost_usd ||
      result.cost_usd ||
      tokenUsage.cost_usd

    // If no cost provided, estimate based on common pricing (rough estimate for GPT-4-turbo)
    if (!estimatedCostUsd && totalTokens > 0) {
      // Very rough estimate: $0.01 per 1K prompt tokens, $0.03 per 1K completion tokens
      estimatedCostUsd = (promptTokens * 0.01) / 1000 + (completionTokens * 0.03) / 1000
    }

    return {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
      estimated_cost_usd: estimatedCostUsd,
    }
  }

  // Component for the token usage info button
  const TokenUsageInfoButton = ({ result, messageId }: { result: any; messageId: string }) => {
    const tokenUsage = extractTokenUsage(result)

    if (!tokenUsage || tokenUsage.total_tokens === 0) return null

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-6 w-6 text-gray-400 hover:text-purple-400 hover:bg-purple-600/20 transition-colors"
              aria-label="Token usage information"
            >
              <Info className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="bg-black/90 border border-purple-900/50 text-white p-3 max-w-xs">
            <div className="space-y-2">
              <div className="font-medium text-purple-300 text-sm mb-2">Token Usage</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-300">Prompt Tokens:</span>
                  <span className="text-white font-mono">{tokenUsage.prompt_tokens.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Completion Tokens:</span>
                  <span className="text-white font-mono">{tokenUsage.completion_tokens.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-gray-600 pt-1">
                  <span className="text-gray-300 font-medium">Total Tokens:</span>
                  <span className="text-purple-300 font-mono font-medium">
                    {tokenUsage.total_tokens.toLocaleString()}
                  </span>
                </div>
                {tokenUsage.estimated_cost_usd && tokenUsage.estimated_cost_usd > 0 && (
                  <div className="flex justify-between border-t border-gray-600 pt-1">
                    <span className="text-gray-300 font-medium">Estimated Cost:</span>
                    <span className="text-green-400 font-mono font-medium">
                      $
                      {tokenUsage.estimated_cost_usd < 0.000001
                        ? "<$0.000001"
                        : tokenUsage.estimated_cost_usd.toFixed(6)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>    )
  }

  // Component to render messages with typing animation
  const TypingMessageRenderer: React.FC<{
    result: any
    messageId: string
    onComplete: () => void
  }> = ({ result, messageId, onComplete }) => {
    const getTextContent = (result: any): string => {
      if (result.source_documents || result.sources || result.answer || result.rag_prompt) {
        return result.answer || result.response || result.output || "No response available"
      }
      
      // Handle different service output types
      if (service?.output_type === "text") {
        return result.final_output || result.output || result.results?.[0]?.output || "No output available"
      }
      
      // For other types, extract any text content
      return result.output || result.response || result.final_output || "Response received"
    }

    const textContent = getTextContent(result)
    
    // Check for errors BEFORE starting typing animation
    const errorCheck = detectOutputError(textContent)
    if (errorCheck.isError) {
      // Skip typing animation and show error immediately
      onComplete() // Call onComplete immediately to prevent typing state
      
      let context = "operation"
      if (result.source_documents || result.sources || result.answer || result.rag_prompt) {
        context = "document analysis"
      } else if (service?.output_type === "image") {
        context = "image generation"
      } else if (service?.output_type === "sound") {
        context = "audio generation"
      } else if (service?.output_type === "text") {
        context = "text generation"
      }
      
      const friendlyErrorMessage = parseApiError({ type: errorCheck.errorType, message: errorCheck.originalError }, context)
      
      return (
        <div className="w-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">
              {context.charAt(0).toUpperCase() + context.slice(1)} Error
            </h3>
            <TokenUsageInfoButton result={result} messageId={messageId} />
          </div>
          <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-6">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-red-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-red-200 font-medium text-sm mb-2">
                  {context.charAt(0).toUpperCase() + context.slice(1)} Failed
                </h4>
                <p className="text-red-300/90 text-sm leading-relaxed mb-4">
                  {friendlyErrorMessage}
                </p>
                
                <div className="mt-4 flex items-center space-x-2 text-xs text-red-300/70">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Please check your API key configuration in the settings panel</span>
                </div>
              </div>
            </div> 
          </div>
        </div>
      )
    }

    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-white">
            {(result.source_documents || result.sources || result.answer || result.rag_prompt) ? "Document Analysis" : "Result"}
          </h3>
          <TokenUsageInfoButton result={result} messageId={messageId} />
        </div>        <div className="p-4 bg-black/30 rounded-lg border border-purple-900/20 relative group">
          <TypingText 
            text={textContent}
            onComplete={onComplete}
            speed={3}
          />
          <button
            onClick={() => copyToClipboard(textContent, `text-${messageId}`)}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6 rounded bg-purple-600/20 hover:bg-purple-600/40 flex items-center justify-center"
            title="Copy text"
          >
            {copiedStates[`text-${messageId}`] ? (
              <Check className="h-3 w-3 text-green-400" />
            ) : (
              <Copy className="h-3 w-3 text-gray-300" />
            )}
          </button>
        </div>
      </div>
    )
  }

  const renderOutputForMessage = (result: any, messageId: string) => {
    if (!result) return null

    if (result.source_documents || result.sources || result.answer || result.rag_prompt) {
      // Check for errors in RAG document analysis
      const ragOutput = result.answer || result.response || result.output || ""
      const ragErrorCheck = detectOutputError(ragOutput)
      
      if (ragErrorCheck.isError) {
        const friendlyErrorMessage = parseApiError({ type: ragErrorCheck.errorType, message: ragErrorCheck.originalError }, "document analysis")
        
        return (
          <div className="w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Document Analysis Error</h3>
              <TokenUsageInfoButton result={result} messageId={messageId} />
            </div>
            <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-red-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-red-200 font-medium text-sm mb-2">Document Analysis Failed</h4>
                                      <p className="text-red-300/90 text-sm leading-relaxed mb-4">
                      {friendlyErrorMessage}
                    </p>
                </div>
              </div>
            </div>
          </div>
        )
      }
      
      return (
        <div className="w-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">Document Analysis</h3>
            <TokenUsageInfoButton result={result} messageId={messageId} />
          </div>
          <div className="p-4 bg-black/30 rounded-lg border border-purple-900/20 relative group">
            <EnhancedTextRenderer
              text={result.answer || result.response || result.output || "No response available"}
              messageId={messageId}
              className="text-gray-300"
              onCodeGenerated={handleCodeGenerated}
            />
            <button
              onClick={() =>
                copyToClipboard(result.answer || result.response || result.output || "", `text-${messageId}`)
              }
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded bg-purple-600/20 hover:bg-purple-600/40"
              title="Copy text"
            >
              {copiedStates[`text-${messageId}`] ? (
                <Check className="h-3 w-3 text-green-400" />
              ) : (
                <Copy className="h-3 w-3 text-gray-300" />
              )}
            </button>
          </div>
        </div>
      )
    }

    switch (service?.output_type) {
      case "text":
        const textOutput = result.final_output || result.output || result.results?.[0]?.output
        
        // Check for errors in text generation output
        const textErrorCheck = detectOutputError(textOutput)
        if (textErrorCheck.isError) {
          const friendlyErrorMessage = parseApiError({ type: textErrorCheck.errorType, message: textErrorCheck.originalError }, "text generation")
          
          return (
            <div className="w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Text Generation Error</h3>
                <TokenUsageInfoButton result={result} messageId={messageId} />
              </div>
              <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-red-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-red-200 font-medium text-sm mb-2">Text Generation Failed</h4>
                    <p className="text-red-300/90 text-sm leading-relaxed mb-4">
                      {friendlyErrorMessage}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )
        }
        
        return (
          <div className="w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Result</h3>
              <TokenUsageInfoButton result={result} messageId={messageId} />
            </div>
            <div className="p-4 bg-black/30 rounded-lg border border-purple-900/20 relative group">
              <EnhancedTextRenderer
                text={textOutput || "No output available"}
                messageId={messageId}
                className="text-gray-300"
                onCodeGenerated={handleCodeGenerated}
              />
              <button
                onClick={() => copyToClipboard(textOutput || "", `text-${messageId}`)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6 rounded bg-purple-600/20 hover:bg-purple-600/40 flex items-center justify-center"
                title="Copy text"
              >
                {copiedStates[`text-${messageId}`] ? (
                  <Check className="h-3 w-3 text-green-400" />
                ) : (
                  <Copy className="h-3 w-3 text-gray-300" />
                )}
              </button>
            </div>
          </div>
        )

      case "sound":
        const audioUrl = extractAudioUrl(result)
        
        // Check for errors in audio generation output
        let audioOutputToCheck = result.final_output || result.output
        if (result.results && result.results[0] && result.results[0].output) {
          audioOutputToCheck = result.results[0].output
        }
        
        const audioErrorCheck = detectOutputError(audioOutputToCheck)
        if (audioErrorCheck.isError) {
          const friendlyErrorMessage = parseApiError({ type: audioErrorCheck.errorType, message: audioErrorCheck.originalError }, "audio generation")
          
          return (
            <div className="w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Audio Generation Error</h3>
                <TokenUsageInfoButton result={result} messageId={messageId} />
              </div>
              <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-red-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Headphones className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-red-200 font-medium text-sm mb-2">Audio Generation Failed</h4>
                    <p className="text-red-300/90 text-sm leading-relaxed mb-4">
                      {friendlyErrorMessage}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )
        }
        
        return (
          <div className="w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white flex items-center">
                <Headphones className="h-5 w-5 mr-2 text-purple-400" />
                Audio Result
              </h3>
              <TokenUsageInfoButton result={result} messageId={messageId} />
            </div>
            {audioUrl ? (
              <div className="space-y-4">
                <div className="bg-black/30 rounded-lg p-4 border border-purple-900/20">
                  <audio
                    controls
                    className="w-full h-12"
                    key={audioUrl}
                    style={{ width: "100%" }}
                    onError={(e) => {
                      console.error("Audio playback error:", e)
                      toast({
                        title: "Error",
                        description: "Failed to play audio. Please try downloading the file.",
                        variant: "destructive",
                      })
                    }}
                  >
                    <source src={audioUrl} type="audio/mp3" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>Audio ready to play</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs hover:bg-purple-600/20 border-purple-600/30"
                    onClick={() => window.open(audioUrl, "_blank")}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Download Audio
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4">
                <p className="text-red-300 flex items-center">
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  No audio output available
                </p>
              </div>
            )}
          </div>
        )

      case "image":
        const imageUrl = result.image_url || result.final_output
        
        // Check if the result contains error in output (for cases where API returns error as string)
        let outputToCheck = imageUrl
        if (result.results && result.results[0] && result.results[0].output) {
          outputToCheck = result.results[0].output
        } else if (result.output) {
          outputToCheck = result.output
        }
        
        const errorCheck = detectOutputError(outputToCheck)
        if (errorCheck.isError) {
          // Convert the detected error to user-friendly message
          const friendlyErrorMessage = parseApiError({ type: errorCheck.errorType, message: errorCheck.originalError }, "image generation")
          
          return (
            <div className="w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Image Generation Error</h3>
                <TokenUsageInfoButton result={result} messageId={messageId} />
              </div>
              <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-red-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-red-200 font-medium text-sm mb-2">Image Generation Failed</h4>
                                         <p className="text-red-300/90 text-sm leading-relaxed mb-4">
                       {friendlyErrorMessage}
                     </p>
                    <div className="mt-4 flex items-center space-x-2 text-xs text-red-300/70">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Please check your API key configuration in the settings panel</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        }
        
        return (
          <div className="w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Generated Image</h3>
              <TokenUsageInfoButton result={result} messageId={messageId} />
            </div>
            {imageUrl && (
              <div className="flex justify-center">
                <div className="relative group">
                  <img
                    src={
                      imageUrl.startsWith("http") || imageUrl.startsWith("data:")
                        ? imageUrl
                        : `http://127.0.0.1:8000${imageUrl}`
                    }
                    alt="Generated image"
                    className="max-w-full rounded-lg shadow-lg max-h-[500px]"
                  />
                  <button
                    onClick={() => copyToClipboard(imageUrl, `image-${messageId}`)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6 rounded bg-black/60 hover:bg-black/80 flex items-center justify-center"
                    title="Copy image URL"
                  >
                    {copiedStates[`image-${messageId}`] ? (
                      <Check className="h-3 w-3 text-green-400" />
                    ) : (
                      <Copy className="h-3 w-3 text-white" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )

      case "video":
        const videoUrl = result.video_url || result.final_output
        return (
          <div className="w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Processed Video</h3>
              <TokenUsageInfoButton result={result} messageId={messageId} />
            </div>
            {videoUrl && (
              <div>
                <video controls className="w-full rounded-lg">
                  <source
                    src={videoUrl.startsWith("http") ? videoUrl : `http://127.0.0.1:8000${videoUrl}`}
                    type="video/mp4"
                  />
                  Your browser does not support the video element.
                </video>
              </div>
            )}
          </div>
        )

      case "document":
  
        const fullFileName = result.final_output || result.file_name || result.fileName || "output_document.txt"
        const fileName = fullFileName.includes('.') ? fullFileName.substring(0, fullFileName.lastIndexOf('.')) : fullFileName
        const fileFormat = fullFileName.includes('.') ? fullFileName.substring(fullFileName.lastIndexOf('.') + 1) : 'txt'
        return (
          <div className="w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white flex items-center">
                <FileText className="h-5 w-5 mr-2 text-purple-400" />
                Document Result
              </h3>
              <TokenUsageInfoButton result={result} messageId={messageId} />
            </div>
            <div className="bg-black/30 rounded-lg border border-purple-900/20 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
                      <FileText className="h-6 w-6 text-purple-400" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{fullFileName}</h4>
                    <p className="text-gray-400 text-sm">Document ready for download</p>
                  </div>
                </div>                <Button
                  onClick={() => {
                    const { currentUserId } = getAuthHeaders()
                    const downloadUrl = `http://127.0.0.1:8000/api/v1/mini-services/file-output/${service?.id}?file_name=${encodeURIComponent(fullFileName)}&current_user_id=${currentUserId}`
                    window.open(downloadUrl, "_blank")
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </Button>
              </div>
              <div className="mt-4 pt-4 border-t border-purple-900/20">
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>File generated successfully</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>Format: {fileFormat.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className="w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Result</h3>
              <TokenUsageInfoButton result={result} messageId={messageId} />
            </div>
            <div className="relative group">
              <pre className="text-xs text-gray-400 overflow-auto max-h-[400px] p-4 bg-black/30 rounded-lg border border-purple-900/20">
                {JSON.stringify(result, null, 2)}
              </pre>
              <button
                onClick={() => copyToClipboard(JSON.stringify(result, null, 2), `json-${messageId}`)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6 rounded bg-purple-600/20 hover:bg-purple-600/40 flex items-center justify-center"
                title="Copy JSON"
              >
                {copiedStates[`json-${messageId}`] ? (
                  <Check className="h-3 w-3 text-green-400" />
                ) : (
                  <Copy className="h-3 w-3 text-gray-300" />
                )}
              </button>
            </div>
          </div>
        )
    }
  }

  const [userData, setUserData] = useState({
    name: "",
    email: "",
    initials: "",
  })

  useEffect(() => {
    const fetchUserData = () => {
      const userEmail = Cookies.get("user_email")

      const token = getAccessToken()
      const decodedToken = token ? decodeJWT(token) : null

      let name = "User"
      let email = userEmail || ""

      if (decodedToken) {
        name = decodedToken.username || name
        email = decodedToken.email || userEmail || email
      }

      const initials = name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)

      setUserData({ name, email, initials })
    }

    if (isAuthenticated) {
      fetchUserData()
    }
  }, [isAuthenticated])

  // Helper function to detect errors in output strings
  const detectOutputError = (output: string): { isError: boolean; errorType?: string; originalError?: string } => {
    if (!output || typeof output !== 'string') {
      return { isError: false }
    }

    const outputLower = output.toLowerCase()
    
    // Detect various error patterns in output strings
    const errorPatterns = [
      'error with openai',
      'error with gemini', 
      'error with anthropic',
      'error code:',
      'api error',
      'authentication failed',
      'invalid api key',
      'quota exceeded',
      'rate limit',
      'image_generation_user_error',
      'image_generation_error',
      'generation_error',
      'api_key_error',
      'unauthorized',
      'forbidden',
      'bad request',
      'payment required'
    ]

    const hasError = errorPatterns.some(pattern => outputLower.includes(pattern))
    
    if (hasError) {
      // Try to extract error type from the output
      let errorType = "api_error"
      
      if (outputLower.includes('image_generation_user_error') || outputLower.includes('image_generation_error')) {
        errorType = "image_generation_error"
      } else if (outputLower.includes('quota exceeded')) {
        errorType = "quota_exceeded"
      } else if (outputLower.includes('rate limit')) {
        errorType = "rate_limit"
      } else if (outputLower.includes('invalid api key') || outputLower.includes('authentication failed')) {
        errorType = "invalid_api_key"
      } else if (outputLower.includes('unauthorized') || outputLower.includes('forbidden')) {
        errorType = "unauthorized"
      }
      
      return { 
        isError: true, 
        errorType, 
        originalError: output 
      }
    }

    return { isError: false }
  }

  // Enhanced error parsing to provide user-friendly API key error messages
  const parseApiError = (error: any, context: string = "operation"): string => {
    let errorMessage = ""
    
         // Try to extract error details from various response formats
     if (typeof error === 'string') {
       errorMessage = error
     } else if (error?.detail) {
       errorMessage = typeof error.detail === 'string' ? error.detail : JSON.stringify(error.detail)
     } else if (error?.message) {
       errorMessage = error.message
     } else if (error?.error) {
       errorMessage = typeof error.error === 'string' ? error.error : JSON.stringify(error.error)
     } else if (error?.type) {
       // Handle error type field (e.g., 'image_generation_user_error')
       errorMessage = error.type
       if (error.message && error.message !== null) {
         errorMessage += `: ${error.message}`
       }
     } else {
       errorMessage = JSON.stringify(error)
     }

    // Normalize error message to lowercase for pattern matching
    const normalizedError = errorMessage.toLowerCase()

         // Detect various API key related errors
     const apiKeyErrorPatterns = [
       'api key',
       'invalid key',
       'authentication failed',
       'unauthorized',
       'access denied',
       'invalid token',
       'invalid credentials',
       'quota exceeded',
       'billing',
       'payment required',
       'subscription',
       'credit',
       'openai',
       'gemini',
       'anthropic',
       'forbidden',
       'key not found',
       'invalid api',
       'api_key',
       'auth',
       'permission denied',
       'rate limit',
       'usage limit',
       'insufficient',
       'expired',
       'revoked',
       'disabled',
       'suspended',
       'dall-e',
       'dalle',
       'gpt-',
       'model access',
       'not authorized',
       'image_generation_user_error',
       'image_generation_error',
       'generation_error',
       'user_error',
       'api_error',
       'service_error'
     ]

    const isApiKeyError = apiKeyErrorPatterns.some(pattern => 
      normalizedError.includes(pattern)
    )

    if (isApiKeyError) {
             // Determine the specific type of API key issue
       if (normalizedError.includes('quota exceeded') || normalizedError.includes('usage limit') || normalizedError.includes('billing')) {
         return "⚠️ API Key Quota Exceeded: Your API key has reached its usage limit. Please check your billing and upgrade your plan if necessary."
       } 
       else if (normalizedError.includes('rate limit')) {
         return "🚦 Rate Limit Exceeded: You're making requests too quickly. Please wait a moment and try again, or upgrade your API plan for higher limits."
       }
       else if (normalizedError.includes('payment required') || normalizedError.includes('subscription') || normalizedError.includes('insufficient')) {
         return "💳 Payment Required: Your API subscription needs to be renewed or you have insufficient credits. Please update your billing information."
       }
       else if (normalizedError.includes('expired') || normalizedError.includes('revoked') || normalizedError.includes('disabled') || normalizedError.includes('suspended')) {
         return "🔑 API Key Expired: Your API key has expired or been revoked. Please generate a new API key and update your configuration."
       }
       else if (normalizedError.includes('image_generation_user_error') || normalizedError.includes('image_generation_error')) {
         return "🖼️ Image Generation Error: There was an issue with your image generation request. This is typically caused by an invalid or expired API key. Please check your OpenAI API key configuration in the settings panel."
       }
       else if (normalizedError.includes('generation_error') || normalizedError.includes('user_error')) {
         if (context.includes('image')) {
           return "🖼️ Image Generation Error: There was an issue generating your image. Please check your API key and try again."
         } else if (context.includes('audio')) {
           return "🎵 Audio Generation Error: There was an issue generating your audio. Please check your API key and try again."
         } else {
           return "⚡ Generation Error: There was an issue with content generation. Please check your API key and try again."
         }
       }
       else if (normalizedError.includes('model access') || normalizedError.includes('permission denied') || normalizedError.includes('not authorized')) {
         if (context.includes('image')) {
           return "🖼️ Image Generation Access Denied: Your API key doesn't have access to image generation models like DALL-E. Please upgrade your OpenAI plan or check your model permissions."
         } else {
           return "🔑 Model Access Denied: Your API key doesn't have access to the requested model. Please check your subscription plan and model permissions."
         }
       }
       else if (normalizedError.includes('invalid') || normalizedError.includes('unauthorized') || normalizedError.includes('access denied') || normalizedError.includes('forbidden')) {
         if (normalizedError.includes('openai') || normalizedError.includes('dall-e') || normalizedError.includes('dalle') || normalizedError.includes('gpt-')) {
           return "🔑 Invalid OpenAI API Key: The OpenAI API key you provided is invalid or has expired. Please check your API key in the settings panel."
         } else if (normalizedError.includes('gemini') || normalizedError.includes('google')) {
           return "🔑 Invalid Gemini API Key: The Google Gemini API key you provided is invalid or has expired. Please check your API key in the settings panel."
         } else {
           return "🔑 Invalid API Key: The API key you provided is invalid or has expired. Please verify your API key configuration in the settings panel."
         }
       }
       else if (normalizedError.includes('authentication failed') || normalizedError.includes('auth')) {
         return "🔑 API Authentication Failed: Unable to authenticate with the AI service. Please verify your API key is correct and has the necessary permissions."
       }
       else {
         return "🔑 API Key Issue: There's a problem with your API key configuration. Please check your API keys in the settings panel and ensure they are valid and properly configured."
       }
    }

    // For image generation specific errors
    if (context.includes('image') || context.includes('generation')) {
      if (normalizedError.includes('failed to load') || normalizedError.includes('image') || normalizedError.includes('generation')) {
        return `🖼️ Image Generation Failed: ${errorMessage}. This might be due to an API key issue or service limitation.`
      }
    }

    // Return original error message with context if no specific pattern matches
    return `${context.charAt(0).toUpperCase() + context.slice(1)} failed: ${errorMessage}`
  }

  const createAbortController = (timeoutMs = 300000) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    const originalSignal = controller.signal
    Object.defineProperty(controller, "signal", {
      get() {
        const signal = originalSignal
        signal.addEventListener("abort", () => clearTimeout(timeoutId), { once: true })
        return signal
      },
    })

    return controller
  }

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token") || localStorage.getItem("accessToken") || Cookies.get("accessToken")
    const currentUserId = Cookies.get("user_id")
    return { token, currentUserId }
  }

  if (isServiceLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(120,119,198,0.02)_50%,transparent_75%)]" />

        <main className="pt-8 h-[calc(100vh-32px)] flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
        </main>
      </div>
    )
  }

  if (error && !service) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(120,119,198,0.02)_50%,transparent_75%)]" />

        <main className="pt-8 h-[calc(100vh-32px)] flex items-center justify-center">
          <div className="max-w-md mx-auto p-6">
            <Card className="bg-black/40 backdrop-blur-sm border border-purple-900/30 p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Service Not Found</h2>
              <p className="text-gray-400 mb-6">The requested service could not be found.</p>
              <Button
                onClick={() => router.push("/apps")}
                className="bg-purple-600 hover:bg-purple-700 text-white w-full"
              >
                Return to Dashboard
              </Button>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 relative overflow-x-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(120,119,198,0.02)_50%,transparent_75%)]" />

      {/* Typing Code Panel */}
      <TypingCodePanel
        isOpen={codePanelOpen}
        onClose={() => setCodePanelOpen(false)}
        code={currentCode}
        language={currentLanguage}
        title="Generated Code"
      />

      {/* Fixed header with service info and controls - Now at top since no navbar */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-black/20 backdrop-blur-md border-b border-purple-900/20">
        <div className="px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white hover:bg-purple-600/20 flex-shrink-0 p-1 sm:p-2"
                onClick={() => router.push("/apps")}
              >
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>

              {/* Show service card when chat is active or service is chat-eligible */}
              {(chatHistory.length > 0 || checkIfChatModeEligible()) && (
                <div className="flex items-center space-x-2 sm:space-x-3 animate-in slide-in-from-left duration-500 min-w-0">
                  <div
                    className={`w-6 h-6 sm:w-8 sm:h-8 ${service ? getServiceColor(service.input_type, service.output_type) : 'bg-purple-600'} rounded-lg flex items-center justify-center shadow-lg flex-shrink-0`}
                  >
                    {getServiceIcon("h-3 w-3 sm:h-4 sm:w-4 text-white")}
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-sm sm:text-lg font-bold text-white truncate">{service?.name || "Service"}</h1>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="text-[10px] sm:text-xs bg-purple-800/40 text-purple-200 px-1 sm:px-2 py-0.5 sm:py-1 rounded-full">
                        {service?.input_type}
                      </span>
                      <ArrowRightIcon className="h-2 w-2 sm:h-4 sm:w-4 text-purple-400 animate-pulse" />
                      <span className="text-[10px] sm:text-xs bg-indigo-800/40 text-indigo-200 px-1 sm:px-2 py-0.5 sm:py-1 rounded-full">
                        {service?.output_type}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Chat History Toggle Button */}
              {selectedMode === 'chat' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-purple-600/20 flex-shrink-0 p-1 sm:p-2"
                  onClick={() => setChatHistorySidebar(true)}
                >
                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">History</span>
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              {/* API Key Indicator */}
              {getAgentsRequiringApiKey().length > 0 && (
                <div className="flex items-center space-x-1 text-amber-400">
                  <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z"
                    />
                  </svg>
                  <span className="text-xs hidden sm:inline">Keys</span>
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-purple-400 hover:text-white hover:bg-purple-600/20 p-1 sm:p-2"
              >
                <div className="flex items-center space-x-1">
                  {sidebarOpen ? <X className="h-3 w-3 sm:h-4 sm:w-4" /> : <Menu className="h-3 w-3 sm:h-4 sm:w-4" />}
                  <span className="text-xs hidden sm:inline">{sidebarOpen ? "Close" : "Settings"}</span>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main
        className={`pt-16 min-h-screen flex transition-all duration-500 overflow-x-hidden ${codePanelOpen ? "mr-96 lg:mr-[500px]" : ""}`}
        onClick={handleMainContentClick}
      >
        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col transition-all duration-300 max-w-full ${sidebarOpen ? "sm:mr-80 xl:mr-96" : ""}`}>
          {/* Conditional Layout: Centered Input or Chat Interface */}
          {chatHistory.length === 0 && !checkIfChatModeEligible() ? (
            /* Initial State - Centered Input */
            <div className="flex-1 flex items-center justify-center p-4 lg:p-6 min-h-[calc(100vh-100px)]">
              <div className="w-full max-w-2xl">
                {/* Centered Service Header - Only show when no chat history */}
                {chatHistory.length === 0 && (
                  <div className="text-center mb-8 animate-fade-in-up">
                    <div className="flex items-center justify-center space-x-4 mb-6">
                      <div
                        className={`w-16 h-16 ${service ? getServiceColor(service.input_type, service.output_type) : 'bg-purple-600'} rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/20 hover:scale-105 transition-transform duration-300`}
                      >
                        {getServiceIcon("h-8 w-8 text-white")}
                      </div>
                      <div className="text-left">
                        <h1 className="text-3xl font-bold text-white mb-2">{service?.name || "Service"}</h1>
                        <div className="flex items-center gap-3">
                          <span className="text-sm bg-purple-800/40 text-purple-200 px-3 py-1.5 rounded-full border border-purple-700/30 hover:bg-purple-700/40 transition-colors">
                            {service?.input_type}
                          </span>
                          <ArrowRightIcon className="h-4 w-4 text-purple-400 animate-pulse" />
                          <span className="text-sm bg-indigo-800/40 text-indigo-200 px-3 py-1.5 rounded-full border border-indigo-700/30 hover:bg-indigo-700/40 transition-colors">
                            {service?.output_type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Service Description */}
                {service?.description && (
                  <div className="text-center mb-8">
                    <p className="text-gray-300 text-lg leading-relaxed">{service.description}</p>
                  </div>
                )}

                <div className="bg-black/40 backdrop-blur-sm rounded-2xl border border-purple-900/30 p-6">
                  {/* API Key Warning */}
                  {getAgentsRequiringApiKey().length > 0 && !areAllRequiredApiKeysSelected && (
                    <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-4 mb-6">
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-amber-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                          />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-amber-200 font-medium text-sm mb-1">API Keys Required</h4>
                          <p className="text-amber-300/80 text-xs mb-3">
                            This service requires API keys to function. Please configure them in the settings panel.
                          </p>
                          <div className="space-y-1">
                            {getAgentsRequiringApiKey().map((agent) => (
                              <div key={agent.id} className="flex items-center space-x-2 text-xs text-amber-200/70">
                                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
                                <span>
                                  {agent.name} requires {agent.type} API key
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={() => setSidebarOpen(true)}
                          className="text-amber-400 hover:text-amber-300 transition-colors"
                          title="Open settings to configure API keys"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Processing status */}
                  {documentProcessingState.isProcessing && (
                    <div className="text-amber-300 text-sm flex items-center bg-amber-900/20 rounded-lg p-3 mb-4">
                      <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse mr-2 flex-shrink-0"></div>
                      <span className="break-words">{documentProcessingState.message}</span>
                    </div>
                  )}

                  {/* Input Area */}
                  <div className="space-y-4">
                    {renderChatInput()}

                    {/* Send Button */}
                    <Button
                      onClick={handleSubmit}
                      disabled={
                        isLoading ||
                        (checkIfRAGDocumentService()
                          ? !userInput?.trim() || !areAllRequiredApiKeysSelected
                          : getFileUploadAgents().length > 0
                            ? !uploadedFile
                            : !areAllRequiredApiKeysSelected || !userInput?.trim())
                      }
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center"
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Processing...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span>Send Message</span>
                          <ArrowRightIcon className="h-5 w-5" />
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Chat Mode */
            <div className="flex-1 p-3 sm:p-4 lg:p-6 pt-2 lg:pt-4">
              <div className="bg-black/40 backdrop-blur-sm rounded-2xl border border-purple-900/30 flex flex-col h-[calc(100vh-80px)]">
                {/* Chat Messages Area */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-6 scroll-smooth prevent-horizontal-scroll" ref={chatMessagesRef}>
                  <div className="max-w-4xl mx-auto">
                    {/* Chat Messages */}
                    <div className="space-y-3 sm:space-y-4">
                      {/* Bot welcome message */}
                      <div className="flex items-start space-x-2 sm:space-x-3">
                        <div
                          className={`w-6 h-6 sm:w-8 sm:h-8 ${service ? getServiceColor(service.input_type, service.output_type) : 'bg-purple-600'} rounded-full flex items-center justify-center flex-shrink-0 mt-1`}
                        >
                          {getServiceIcon("h-3 w-3 sm:h-4 sm:w-4 text-white")}
                        </div>
                        <div className="bg-zinc-800/80 backdrop-blur-sm rounded-2xl rounded-tl-sm p-3 sm:p-4 max-w-xs sm:max-w-md">
                          <p className="text-gray-200 text-xs sm:text-sm">
                            Hello! I'm ready to help you with {service?.input_type} processing.
                            {service?.output_type && ` I'll provide ${service.output_type} output.`}
                          </p>
                        </div>
                      </div>

                      {/* Chat History Messages */}
                      {chatHistory.map((message) => (
                        <div key={message.id}>
                          {message.type === "user" ? (
                            /* User message */
                            <div className="flex items-start space-x-2 sm:space-x-3 justify-end">
                              <div
                                className={`${service ? getServiceColor(service.input_type, service.output_type) : 'bg-purple-600'} rounded-2xl rounded-tr-sm p-3 sm:p-4 max-w-xs sm:max-w-md`}
                              >
                                <p className="text-white text-xs sm:text-sm break-words">
                                  {message.file ? `📎 ${message.file.name}` : message.content}
                                </p>
                                {message.content && message.file && (
                                  <p className="text-purple-100 text-xs mt-2">{message.content}</p>
                                )}
                              </div>
                              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center flex-shrink-0 mt-1 border border-purple-500/30 shadow-lg">
                                <span className="text-[10px] sm:text-xs font-bold text-white">{userData.initials || "U"}</span>
                              </div>
                            </div>
                          ) : (
                            /* Assistant message */
                            <div className="flex items-start space-x-2 sm:space-x-3">
                              <div
                                className={`w-8 h-8 ${service ? getServiceColor(service.input_type, service.output_type) : 'bg-purple-600'} rounded-full flex items-center justify-center flex-shrink-0 mt-1`}
                              >
                                {getServiceIcon("h-4 w-4 text-white")}
                              </div>                              <div className="bg-zinc-800/80 backdrop-blur-sm rounded-2xl rounded-tl-sm p-4 max-w-3xl relative group flex-1">
                                {message.result ? (
                                  <div className="w-full">
                                    {message.isTyping && typingMessageId === message.id ? (
                                      <TypingMessageRenderer 
                                        result={message.result} 
                                        messageId={message.id}
                                        onComplete={() => {
                                          setChatHistory(prev => 
                                            prev.map(msg => 
                                              msg.id === message.id 
                                                ? { ...msg, isTyping: false }
                                                : msg
                                            )
                                          )
                                          setTypingMessageId("")
                                        }}
                                      />
                                    ) : (
                                      renderOutputForMessage(message.result, message.id)
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-red-300 text-sm">
                                    {message.content || "An error occurred while processing your request"}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Loading indicator */}
                      {isLoading && (
                        <div className="flex items-start space-x-3">
                          <div
                            className={`w-8 h-8 ${service ? getServiceColor(service.input_type, service.output_type) : 'bg-purple-600'} rounded-full flex items-center justify-center flex-shrink-0 mt-1`}
                          >
                            {getServiceIcon("h-4 w-4 text-white")}
                          </div>
                          <div className="bg-zinc-800/80 backdrop-blur-sm rounded-2xl rounded-tl-sm p-4 max-w-md">
                            <div className="flex items-center space-x-2">
                              <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                              <span className="text-gray-300 text-sm">Processing your request...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Chat Input Area - Fixed at bottom */}
                <div className="border-t border-purple-900/30 bg-black/20 backdrop-blur-sm rounded-b-2xl">
                  <div className="p-4 lg:p-6">
                    <div className="max-w-4xl mx-auto">
                      {/* API Key Warning */}
                      {getAgentsRequiringApiKey().length > 0 && !areAllRequiredApiKeysSelected && (
                        <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-4 mb-4">
                          <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-amber-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                              <svg
                                className="w-4 h-4 text-amber-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                          />
                          </svg>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-amber-200 font-medium text-sm mb-1">API Keys Required</h4>
                              <p className="text-amber-300/80 text-xs mb-3">
                                This service requires API keys to function. Please configure them in the settings panel.
                              </p>
                              <div className="space-y-1">
                                {getAgentsRequiringApiKey().map((agent) => (
                                  <div key={agent.id} className="flex items-center space-x-2 text-xs text-amber-200/70">
                                    <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
                                    <span>
                                      {agent.name} requires {agent.type} API key
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <button
                              onClick={() => setSidebarOpen(true)}
                              className="text-amber-400 hover:text-amber-300 transition-colors"
                              title="Open settings to configure API keys"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Processing status */}
                      {documentProcessingState.isProcessing && (
                        <div className="text-amber-300 text-sm flex items-center bg-amber-900/20 rounded-lg p-3 mb-4">
                          <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse mr-2 flex-shrink-0"></div>
                          <span className="break-words">{documentProcessingState.message}</span>
                        </div>
                      )}

                      

                      {/* Chat Input Row */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-end space-y-2 sm:space-y-0 sm:space-x-3">
                        <div className="flex-1 min-w-0">{renderChatInput()}</div>

                        {/* Send Button */}
                        <Button
                          onClick={handleSubmit}
                          disabled={
                            isLoading ||
                            (checkIfRAGDocumentService()
                              ? !userInput?.trim() || !areAllRequiredApiKeysSelected
                              : getFileUploadAgents().length > 0
                                ? !uploadedFile
                                : !areAllRequiredApiKeysSelected || !userInput?.trim())
                          }
                          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold p-3 rounded-2xl shadow-lg transition-all flex items-center justify-center w-full sm:w-auto sm:min-w-[48px] h-[48px]"
                        >
                          {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <ArrowRightIcon className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Workflow Visualization - Always visible at bottom */}
          <div className={`p-3 sm:p-4 lg:p-6 pt-0 transition-all duration-300 w-full ${sidebarOpen ? "hidden sm:block" : ""}`}>
            <div className="bg-black/30 backdrop-blur-sm rounded-xl border border-purple-900/20 p-2 sm:p-3 lg:p-4 w-full">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3 text-center">Workflow</h3>
              <div className="overflow-x-auto overflow-y-hidden w-full scrollbar-thin scrollbar-thumb-purple-600/40 scrollbar-track-transparent">
                <div className="flex justify-center w-fit mx-auto px-1 sm:px-2">
                  {renderWorkflow()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Settings Panel */}
        <div
          className={`fixed top-16 right-0 h-[calc(100vh-64px)] ${
            sidebarOpen ? "w-full sm:w-80 xl:w-96" : "w-0"
          } border-l border-purple-900/30 transition-all duration-300 ease-in-out overflow-hidden bg-black/40 backdrop-blur-md z-50 sm:z-30 prevent-horizontal-scroll`}
          onClick={handleSidebarClick}
        >
          {sidebarOpen && (
            <div className="h-full overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-8">
              {/* RAG Documents Section - Only for RAG services */}
              {checkIfRAGDocumentService() && (
                <div className="bg-gradient-to-b from-purple-950/20 to-transparent rounded-xl p-3 sm:p-6 border border-purple-900/30">
                  <div className="flex items-center mb-4 sm:mb-6">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center mr-2 sm:mr-3 shadow-lg">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-white">Knowledge Base</h2>
                  </div>

                  <div className="text-gray-400 text-xs sm:text-sm mb-4 sm:mb-6">Documents available for queries</div>

                  {/* Document Collection */}
                  {documentCollection.isLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-black/30 rounded-lg p-3 border border-purple-900/20 animate-pulse">
                          <div className="h-4 bg-purple-900/30 rounded mb-2"></div>
                          <div className="h-3 bg-purple-900/20 rounded w-2/3"></div>
                        </div>
                      ))}
                    </div>
                  ) : documentCollection.documents.length > 0 ? (
                    <div className="space-y-3">
                      {documentCollection.documents.map((doc, index) => (
                        <div
                          key={index}
                          className="bg-black/30 rounded-lg p-4 border border-purple-900/20 hover:border-purple-700/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white text-sm font-medium truncate mb-1">{doc.filename}</h4>
                              <p className="text-gray-400 text-xs">
                                {doc.chunks} chunks • {(doc.filename.length * 50).toLocaleString()} characters
                              </p>
                            </div>
                            <div className="ml-3 flex-shrink-0">
                              <div className="w-2 h-2 rounded-full bg-green-400"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 rounded-full bg-purple-900/20 flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-purple-400" />
                      </div>
                      <p className="text-gray-400 text-sm">No documents uploaded yet</p>
                      <p className="text-gray-500 text-xs mt-1">Upload a PDF to create your knowledge base</p>
                    </div>
                  )}
                </div>
              )}

              {/* API Keys Section */}
              {getAgentsRequiringApiKey().length > 0 ? (
                <div className="bg-gradient-to-b from-amber-950/20 to-transparent rounded-xl p-6 border border-amber-900/30">
                  <h3 className="text-lg font-bold text-amber-200 mb-6 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z"
                      />
                    </svg>
                    API Keys Required
                  </h3>
                  <div className="space-y-4">
                    {getAgentsRequiringApiKey().map((agent, index) => {
                      const selectedKeyId = apiKeys[agent.id] || ""
                      return (
                        <div key={agent.id} className="space-y-3">
                          <label className="text-sm text-amber-200 flex items-center font-medium">
                            <span className="inline-block w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 mr-3"></span>
                            {agent.name}
                            <span className="ml-2 text-xs bg-amber-800/40 text-amber-300 px-2 py-1 rounded-full">
                              {agent.type}
                            </span>
                          </label>
                          <Select value={selectedKeyId} onValueChange={(value) => handleApiKeyChange(agent.id, value)}>
                            <SelectTrigger className="bg-black/40 border-amber-900/30 text-white text-sm hover:border-amber-500/50 transition-colors">
                              <SelectValue placeholder={`Select ${agent.type} key`} />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-950 border-amber-900/30 text-white">
                              {availableApiKeys[agent.type]?.length > 0 ? (
                                availableApiKeys[agent.type].map((key) => (
                                  <SelectItem key={key.id} value={key.id} className="text-sm hover:bg-amber-900/20">
                                    {key.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="none" disabled className="text-sm">
                                  No {agent.type} keys available
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      )
                    })}
                  </div>

                  {!areAllRequiredApiKeysSelected && (
                    <div className="mt-6 bg-amber-900/20 border border-amber-700/30 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <svg
                          className="w-4 h-4 text-amber-400 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                          />
                        </svg>
                        <p className="text-amber-300 text-xs">Please select API keys for all agents to proceed</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 pt-4 border-t border-amber-900/30">
                    <button
                      onClick={() => router.push("/apps/api-keys")}
                      className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-sm font-medium py-3 px-4 rounded-lg transition-all shadow-lg"
                    >
                      Manage API Keys
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-b from-green-950/20 to-transparent rounded-xl p-6 border border-green-900/30">
                  <h3 className="text-lg font-bold text-green-200 mb-6 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    API Keys
                  </h3>
                  <div className="flex items-center space-x-3 text-green-300">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">No API keys required for this service</span>
                  </div>
                  <p className="text-xs text-green-400/80 mt-2">
                    This service runs entirely on internal models and doesn't require external API credentials.
                  </p>
                </div>
              )}

              {/* Analytics Section */}
              <div className="bg-gradient-to-b from-purple-950/20 to-transparent rounded-xl p-6 border border-purple-900/30">
                <div className="flex items-center mb-6">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center mr-3 shadow-lg">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Analytics</h2>
                </div>

                <div className="space-y-4">
                  <div className="bg-black/30 rounded-xl p-4 border border-purple-900/20 backdrop-blur-sm">
                    <div className="text-purple-300 text-sm mb-2 font-medium">Total Runs</div>
                    <div className="text-white text-3xl font-bold mb-1">
                      {service?.run_time !== undefined && !isNaN(service.run_time) && service.run_time > 0
                        ? Math.round(service.run_time).toLocaleString()
                        : "—"}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {service?.run_time !== undefined && !isNaN(service.run_time) && service.run_time > 0
                        ? "Service executions"
                        : "No runs yet"}
                    </div>
                  </div>

                  {service?.average_token_usage?.avg_pricing?.estimated_cost_usd &&
                    service.average_token_usage.avg_pricing.estimated_cost_usd > 0 && (
                      <div className="bg-black/30 rounded-xl p-4 border border-purple-900/20 backdrop-blur-sm">
                        <div className="text-purple-300 text-sm mb-2 font-medium">Average API Cost</div>
                        <div className="text-white text-3xl font-bold mb-1">
                          ${service.average_token_usage.avg_pricing.estimated_cost_usd.toFixed(6)}
                        </div>
                        <div className="text-gray-400 text-xs">Per execution</div>
                      </div>
                    )}

                  {service?.average_token_usage && (
                    <div className="space-y-3">
                      <div className="bg-black/30 rounded-xl p-4 border border-purple-900/20 backdrop-blur-sm">
                        <div className="text-purple-300 text-sm mb-2 font-medium">Prompt Tokens</div>
                        <div className="text-white text-2xl font-bold">
                          {service.average_token_usage.prompt_tokens !== undefined &&
                          !isNaN(service.average_token_usage.prompt_tokens) &&
                          service.average_token_usage.prompt_tokens > 0
                            ? Math.round(service.average_token_usage.prompt_tokens).toLocaleString()
                            : "—"}
                        </div>
                      </div>

                      <div className="bg-black/30 rounded-xl p-4 border border-purple-900/20 backdrop-blur-sm">
                        <div className="text-purple-300 text-sm mb-2 font-medium">Completion Tokens</div>
                        <div className="text-white text-2xl font-bold">
                          {service.average_token_usage.completion_tokens !== undefined &&
                          !isNaN(service.average_token_usage.completion_tokens) &&
                          service.average_token_usage.completion_tokens > 0
                            ? Math.round(service.average_token_usage.completion_tokens).toLocaleString()
                            : "—"}
                        </div>
                      </div>

                      <div className="bg-black/30 rounded-xl p-4 border border-purple-900/20 backdrop-blur-sm">
                        <div className="text-purple-300 text-sm mb-2 font-medium">Total Tokens</div>
                        <div className="text-white text-2xl font-bold">
                          {service.average_token_usage.total_tokens !== undefined &&
                          !isNaN(service.average_token_usage.total_tokens) &&
                          service.average_token_usage.total_tokens > 0
                            ? Math.round(service.average_token_usage.total_tokens).toLocaleString()
                            : "—"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Analytics Disclaimer */}
                <div className="mt-6 p-4 bg-gray-900/20 border border-gray-700/30 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <svg
                      className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <p className="text-gray-300 text-xs leading-relaxed">
                        <span className="font-medium">Disclaimer:</span> These statistics represent average usage from
                        all users of this service. Actual token consumption and associated costs may vary significantly
                        based on your specific input complexity and length.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}        </div>
      </main>

      {/* Mode Selection Dialog */}
      <Dialog open={showModeSelection} onOpenChange={setShowModeSelection}>
        <DialogContent className="sm:max-w-lg bg-black/95 backdrop-blur-xl border border-purple-900/30 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-950/20 via-transparent to-indigo-950/20 rounded-lg" />
          <div className="relative">
            <DialogHeader className="space-y-4 pb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg">
                  <LucideSparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-white">Choose Your Mode</DialogTitle>
                  <DialogDescription className="text-gray-400 text-sm mt-1">
                    Select how you'd like to interact with this service
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <div className="space-y-3 py-4">
              <div 
                className={`group relative p-5 rounded-xl cursor-pointer transition-all duration-300 border backdrop-blur-sm ${
                  selectedMode === 'chat' 
                    ? 'border-purple-500/60 bg-gradient-to-br from-purple-950/40 to-indigo-950/40 shadow-lg shadow-purple-900/20 scale-[1.02]' 
                    : 'border-purple-900/30 bg-black/20 hover:border-purple-700/50 hover:bg-purple-950/20 hover:scale-[1.01]'
                }`}
                onClick={() => setSelectedMode('chat')}
              >
                <div className="flex items-start space-x-4">
                  <div className={`relative flex-shrink-0 mt-1 transition-all duration-300 ${
                    selectedMode === 'chat' ? 'scale-110' : 'group-hover:scale-105'
                  }`}>
                    {selectedMode === 'chat' ? (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-gray-600 group-hover:border-purple-400 transition-colors" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <MessageSquare className={`w-5 h-5 transition-colors ${
                        selectedMode === 'chat' ? 'text-purple-400' : 'text-gray-500 group-hover:text-purple-400'
                      }`} />
                      <h3 className={`font-semibold transition-colors ${
                        selectedMode === 'chat' ? 'text-white' : 'text-gray-300 group-hover:text-white'
                      }`}>
                        Chat Mode
                      </h3>
                    </div>
                    <p className={`text-sm leading-relaxed transition-colors ${
                      selectedMode === 'chat' ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-300'
                    }`}>
                      Context-aware conversations with chat history. Perfect for complex discussions and follow-up questions.
                    </p>
                    <div className={`mt-3 flex items-center space-x-2 text-xs transition-colors ${
                      selectedMode === 'chat' ? 'text-amber-400' : 'text-gray-500 group-hover:text-amber-400'
                    }`}>
                      <Info className="w-3 h-3" />
                      <span>Higher cost due to conversation context</span>
                    </div>
                  </div>
                </div>
              </div>

              <div 
                className={`group relative p-5 rounded-xl cursor-pointer transition-all duration-300 border backdrop-blur-sm ${
                  selectedMode === 'normal' 
                    ? 'border-purple-500/60 bg-gradient-to-br from-purple-950/40 to-indigo-950/40 shadow-lg shadow-purple-900/20 scale-[1.02]' 
                    : 'border-purple-900/30 bg-black/20 hover:border-purple-700/50 hover:bg-purple-950/20 hover:scale-[1.01]'
                }`}
                onClick={() => setSelectedMode('normal')}
              >
                <div className="flex items-start space-x-4">
                  <div className={`relative flex-shrink-0 mt-1 transition-all duration-300 ${
                    selectedMode === 'normal' ? 'scale-110' : 'group-hover:scale-105'
                  }`}>
                    {selectedMode === 'normal' ? (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-gray-600 group-hover:border-purple-400 transition-colors" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Wand2 className={`w-5 h-5 transition-colors ${
                        selectedMode === 'normal' ? 'text-purple-400' : 'text-gray-500 group-hover:text-purple-400'
                      }`} />
                      <h3 className={`font-semibold transition-colors ${
                        selectedMode === 'normal' ? 'text-white' : 'text-gray-300 group-hover:text-white'
                      }`}>
                        Normal Generation Mode
                      </h3>
                    </div>
                    <p className={`text-sm leading-relaxed transition-colors ${
                      selectedMode === 'normal' ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-300'
                    }`}>
                      Individual requests without conversation context. Ideal for single tasks and cost-effective usage.
                    </p>
                    <div className={`mt-3 flex items-center space-x-2 text-xs transition-colors ${
                      selectedMode === 'normal' ? 'text-green-400' : 'text-gray-500 group-hover:text-green-400'
                    }`}>
                      <Check className="w-3 h-3" />
                      <span>More cost-effective option</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-6">
              <Button
                onClick={() => {
                  if (selectedMode) {
                    setShowModeSelection(false)
                    if (selectedMode === 'chat') {
                      setChatHistorySidebar(true)
                      // Load chat history from backend
                      loadChatHistory()
                    }
                  }
                }}
                disabled={!selectedMode}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl shadow-lg transition-all duration-300 hover:shadow-purple-900/30"
              >
                <LucideSparkles className="w-4 h-4 mr-2" />
                Continue with {selectedMode === 'chat' ? 'Chat Mode' : 'Normal Mode'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat History Sidebar */}
      {chatHistorySidebar && selectedMode === 'chat' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex">
          <div className="w-80 bg-black/95 backdrop-blur-xl border-r border-purple-900/30 h-full shadow-2xl flex flex-col">
            {/* Background gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-950/20 via-transparent to-indigo-950/20" />
            
            {/* Sidebar Header */}
            <div className="relative p-6 border-b border-purple-900/30 bg-black/20 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg">
                    <MessageSquare className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Chat History</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setChatHistorySidebar(false)}
                  className="text-gray-400 hover:text-white hover:bg-purple-600/20 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-gray-400 text-sm mt-2">Your conversation history</p>
            </div>

            {/* Chat History List */}
            <div className="relative flex-1 overflow-y-auto p-4">
              {loadingConversations ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center mb-4 shadow-lg">
                      <Loader2 className="w-6 h-6 animate-spin text-white" />
                    </div>
                  </div>
                  <span className="text-sm text-gray-300 font-medium">Loading conversations...</span>
                  <span className="text-xs text-gray-500 mt-1">Please wait</span>
                </div>
              ) : savedConversations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-purple-900/20 flex items-center justify-center mx-auto mb-4 border border-purple-900/30">
                    <MessageSquare className="w-8 h-8 text-purple-400" />
                  </div>
                  <h3 className="text-white font-medium mb-2">No conversations yet</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Start your first conversation to see your chat history here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedConversations.map((conversation, index) => (
                    <div
                      key={conversation.id}
                      className="group relative p-4 bg-black/30 backdrop-blur-sm border border-purple-900/20 rounded-xl cursor-pointer hover:border-purple-700/50 hover:bg-purple-950/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-900/10"
                      onClick={() => loadConversation(conversation.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 shadow-sm"></div>
                            <h3 className="text-sm font-semibold text-white truncate group-hover:text-purple-200 transition-colors">
                              {conversation.title || `Conversation ${index + 1}`}
                            </h3>
                          </div>
                          <div className="flex items-center space-x-3 text-xs text-gray-400 mb-2">
                            <div className="flex items-center space-x-1">
                              <div className="w-3 h-3 rounded-full bg-purple-600/20 flex items-center justify-center">
                                <div className="w-1 h-1 rounded-full bg-purple-400"></div>
                              </div>
                              <span>{conversation.messageCount || 0} messages</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-gray-600"></div>
                            <span>{new Date(conversation.timestamp).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-gray-500 truncate group-hover:text-gray-400 transition-colors">
                            {conversation.lastMessage || "No preview available"}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDeleteClick(conversation.id, e)}
                            disabled={deletingConversationId === conversation.id}
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 h-6 w-6 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md"
                          >
                            {deletingConversationId === conversation.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                          </Button>
                          <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0 group-hover:text-purple-400 transition-colors" />
                        </div>
                      </div>
                      
                      {/* Subtle hover glow effect */}
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600/0 via-purple-600/5 to-indigo-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* New Chat Button */}
            <div className="relative p-4 border-t border-purple-900/30 bg-black/20 backdrop-blur-sm">
              <Button
                onClick={() => {
                  // Start a new chat
                  setChatHistory([])
                  setCurrentConversationId(null)
                  setChatHistorySidebar(false)
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg transition-all duration-300 hover:shadow-purple-900/30 hover:scale-[1.02]"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Start New Chat
              </Button>
              
              {/* Additional action button */}
              <Button
                variant="ghost"
                onClick={() => setChatHistorySidebar(false)}
                className="w-full mt-2 text-gray-400 hover:text-white hover:bg-purple-600/20 py-2 rounded-lg transition-all duration-300"
              >
                <X className="w-4 h-4 mr-2" />
                Close History
              </Button>
            </div>
          </div>

          {/* Click outside to close - Enhanced overlay */}
          <div 
            className="flex-1 bg-gradient-to-r from-transparent via-black/20 to-black/40" 
            onClick={() => setChatHistorySidebar(false)}
          />
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-black/95 backdrop-blur-xl border border-purple-900/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete this conversation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setShowDeleteDialog(false)
                setConversationToDelete(null)
              }}
              className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deletingConversationId !== null}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deletingConversationId ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
