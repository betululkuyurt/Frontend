/**
 * Service Detail Page Component
 * ============================
 * 
 * This page handles the display and interaction with individual services in the application.
 * It supports multiple types of services including text, image, audio, and video processing.
 * 
 * Key Features:
 * -------------
 * 1. Authentication & Authorization
 *    - Checks user authentication status
 *    - Handles API keys for external services (e.g., Gemini)
 * 
 * 2. Service Types Support:
 *    - Text to Text
 *    - Text to Image
 *    - Text to Speech (TTS)
 *    - Image Processing
 *    - Audio Processing
 *    - Video Processing
 * 
 * 3. File Handling:
 *    - Supports file uploads for images, audio, video
 *    - Handles different input types dynamically
 * 
 * 4. API Integration:
 *    - Communicates with backend API
 *    - Handles different response types
 *    - Manages API keys and authentication tokens

 *  * API Endpoints Used:
 * ------------------
 * - GET    /api/v1/mini-services/{id} - Fetch service details
 * - POST   /api/v1/mini-services/{id}/run - Run service
 * - POST   /api/v1/mini-services/upload - Upload files (NEW unified upload endpoint)
 * - DELETE /api/v1/mini-services/{id} - Delete service
 * - GET    /api/v1/mini-services/audio/{processId} - Get audio output
 * 
 * Upload Workflow:
 * ---------------
 * For services requiring file upload (e.g., transcribe agents):
 * 1. Upload file via POST /api/v1/mini-services/upload
 * 2. Get saved_as filename from upload response
 * 3. Run service with saved filename as input via POST /api/v1/mini-services/{id}/run
 * 

 */

"use client"

import React from "react"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import Cookies from "js-cookie"
import { NavBar } from "@/components/nav-bar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { deleteMiniService } from "@/lib/services"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { decodeJWT, getAccessToken } from "@/lib/auth"

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

// **[IMPROVEMENT]** - Create unified agent type configuration system
interface AgentTypeConfig {
  endpoint: string | ((agentId: number) => string)
  fileFieldName: string
  additionalFields?: { [key: string]: any }
  requiresApiKey: boolean
  supportedFileTypes: string[]
  maxFileSize: number // in MB
  hasSpecialUI?: boolean
  processingMessage?: string
  requiresUpload?: boolean // Flag for agents that need file upload first
  useMiniServiceEndpoint?: boolean // Flag to use mini service endpoint instead of direct agent endpoint
}

// **[UNIFIED APPROACH]** - Central configuration for all file upload agent types
const AGENT_TYPE_CONFIGS: { [agentType: string]: AgentTypeConfig } = {
  rag: {
    endpoint: "mini-service", // Use the regular mini service endpoint
    fileFieldName: "file", // Not used for RAG query endpoint
    additionalFields: {},
    requiresApiKey: true,
    supportedFileTypes: [".pdf", ".docx", ".txt"],
    maxFileSize: 10,
    hasSpecialUI: true,
    processingMessage: "Processing document query...",
    useMiniServiceEndpoint: true, // Flag to use mini service endpoint instead of direct agent endpoint
  },
  transcribe: {
    endpoint: "upload", // Use the new unified upload endpoint
    fileFieldName: "file",
    additionalFields: {
      language: "en",
      include_timestamps: (options: any) => options.include_timestamps?.toString(),
    },
    requiresApiKey: false,
    supportedFileTypes: [".mp3", ".wav", ".m4a", ".mp4", ".mov"],
    maxFileSize: 200, // Updated to match backend limit
    hasSpecialUI: true,
    processingMessage: "Uploading and transcribing audio/video content...",
    requiresUpload: true, // Flag to indicate this requires file upload first
  },
  image_analyzer: {
    endpoint: (agentId: number) => `http://127.0.0.1:8000/api/v1/agents/${agentId}/run/image`,
    fileFieldName: "file",
    additionalFields: {},
    requiresApiKey: true,
    supportedFileTypes: [".jpg", ".jpeg", ".png", ".webp"],
    maxFileSize: 5,
    processingMessage: "Analyzing image content...",
  },
}

// **[UTILITY FUNCTIONS]** - Reduce code duplication
const getAuthHeaders = () => {
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken") || Cookies.get("accessToken")
  const currentUserId = Cookies.get("user_id")
  return { token, currentUserId }
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
  // Add state for expanded descriptions
  const [expandedDescriptions, setExpandedDescriptions] = useState<{ [nodeId: string]: boolean }>({})
  // Add state for document processing feedback
  const [documentProcessingState, setDocumentProcessingState] = useState<{
    isProcessing: boolean
    stage: "uploading" | "embedding" | "indexing" | "processing" | "complete"
    message: string
  }>({
    isProcessing: false,
    stage: "uploading",
    message: "",
  })

  // Add state for copy functionality
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({})

  // Add chat history state
  const [chatHistory, setChatHistory] = useState<Array<{
    id: string
    type: 'user' | 'assistant'
    content: string
    file?: File
    result?: any
    timestamp: Date
  }>>([])

  // Add ref for chat container auto-scroll
  const chatMessagesRef = useRef<HTMLDivElement>(null)

  // Auto-scroll chat container to bottom when new messages are added
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight
    }
  }, [chatHistory])

  // **[RESTORED]** - Document collection state (endpoint now available in backend)
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

  // Add ref and slider state for workflow visualization
  const workflowScrollRef = useRef<HTMLDivElement>(null)
  const [workflowScroll, setWorkflowScroll] = useState(0)
  const [workflowMaxScroll, setWorkflowMaxScroll] = useState(0)

  // Add state for stats sidebar toggle
  const [statsOpen, setStatsOpen] = useState(false)

  // Authentication check
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken") || Cookies.get("accessToken")

      const userId = Cookies.get("user_id")

      if (token) {
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
        router.push("/auth/login")
      }
    }

    checkAuth()
  }, [router])

  // Fetch service details
  useEffect(() => {
    if (!serviceId || !isAuthenticated) return

    const fetchService = async () => {
      try {
        setIsServiceLoading(true)
        const currentUserId = Cookies.get("user_id") || "0"

        const response = await fetch(
          `http://127.0.0.1:8000/api/v1/mini-services/${serviceId}?current_user_id=${currentUserId}`,
        )

        if (!response.ok) {
          if (response.status === 404) {
            // Service not found, redirect to apps page
            window.location.href = "/apps"
            return
          }
          throw new Error("Service not found")
        }

        const data = await response.json()
        // if (process.env.NODE_ENV === 'development') {
        //   console.log("Service loaded:", data.name, "- Agents:", Object.keys(data.workflow?.nodes || {}).length);
        // }

        setService(data)

        // After setting the service, fetch detailed agent information
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

  // New function to fetch detailed agent information
  const fetchAgentDetails = async (nodes: any) => {
    try {
      const agentIds = Object.values(nodes).map((node: any) => node.agent_id)
      const uniqueAgentIds = [...new Set(agentIds)]
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken") || Cookies.get("accessToken")
      const currentUserId = Cookies.get("user_id") || "0"

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

      // Update API key requirements based on agent types
      updateRequiredApiKeys(agentDetailsMap)
    } catch (error) {
      console.error("Error fetching agent details:", error)
    }
  }

  // Function to update required API keys based on agent details
  const updateRequiredApiKeys = (agents: { [id: number]: AgentDetails }) => {
    // We'll enhance our API key management based on detailed agent information
    const initialApiKeyState: { [agentId: number]: string } = {}

    Object.entries(agents).forEach(([agentId, details]) => {
      if (AGENT_TYPES_REQUIRING_API_KEY.includes(details.agent_type.toLowerCase())) {
        initialApiKeyState[Number(agentId)] = ""
      }
    })

    // Only update if we have new API key requirements
    if (Object.keys(initialApiKeyState).length > 0) {
      setApiKeys((prev) => ({ ...prev, ...initialApiKeyState }))
    }
  }

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
    }
  }

  // Add state for API keys (store key id, not api_key value)
  const [apiKeys, setApiKeys] = useState<{ [agentId: number]: string }>({})
  const [availableApiKeys, setAvailableApiKeys] = useState<{
    [provider: string]: { id: string; name: string; api_key: string }[]
  }>({})
  // Add state for transcription options with just include_timestamps
  const [transcriptionOptions, setTranscriptionOptions] = useState({
    include_timestamps: false,
  })

  // Fetch available API keys
  useEffect(() => {
    const fetchApiKeys = async () => {
      if (!isAuthenticated) return

      try {
        const token = localStorage.getItem("token") || localStorage.getItem("accessToken") || Cookies.get("accessToken")
        const currentUserId = Cookies.get("user_id")

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
            api_key: key.api_key, // Store the actual API key value
          })
        })

        setAvailableApiKeys(groupedKeys)
      } catch (error) {
        console.error("Error fetching API keys:", error)
      }
    }

    fetchApiKeys()
  }, [isAuthenticated])

  // Add a list of agent types that require API keys based on backend data
  const AGENT_TYPES_REQUIRING_API_KEY = [
    "gemini",
    "openai",
    "gemini_text2image",
    "custom_endpoint_llm",
    "rag", // Add RAG agent type to the list
  ]

  // **[OPTIMIZED]** Function to extract agents that require API keys - memoized to prevent excessive calls
  const getAgentsRequiringApiKey = useCallback(() => {
    if (!service?.workflow?.nodes) return []

    const agents: { id: number; name: string; type: string; nodeId: string }[] = []

    Object.entries(service.workflow.nodes).forEach(([nodeId, node]) => {
      const agentId = node.agent_id
      const agentDetail = agentDetails[agentId]

      // If we have detailed agent info, use it to determine if API key is required
      const agentType = agentDetail?.agent_type?.toLowerCase() || node.agent_type?.toLowerCase() || ""
      if (agentDetail && (AGENT_TYPES_REQUIRING_API_KEY.includes(agentType) || agentType.includes("rag"))) {
        // Handle special provider type mapping (for RAG agents using Gemini, etc)
        let providerType = agentType
        if (agentType.includes("rag")) {
          providerType = "gemini" // RAG agents need Gemini API keys
        } else if (agentType.includes("gemini_text2image") || agentType === "gemini_text2image") {
          providerType = "gemini" // Gemini image generation agents need Gemini API keys
        }

        agents.push({
          id: agentId,
          name: agentDetail.name || `Agent ${agentId}`,
          type: providerType,
          nodeId,
        })
      }
      // Fallback to the basic node info if detailed info not available
      else if (
        node.agent_type &&
        (AGENT_TYPES_REQUIRING_API_KEY.includes(node.agent_type.toLowerCase()) ||
          node.agent_type.toLowerCase().includes("rag"))
      ) {
        let providerType = node.agent_type.toLowerCase()
        if (providerType.includes("rag")) {
          providerType = "gemini" // RAG agents need Gemini API keys
        } else if (providerType.includes("gemini_text2image") || providerType === "gemini_text2image") {
          providerType = "gemini" // Gemini image generation agents need Gemini API keys
        }

        agents.push({
          id: agentId,
          name: node.agent_name || `Agent ${agentId}`,
          type: providerType,
          nodeId,
        })
      }
    })

    // Only log in development mode and when agents change
    // if (process.env.NODE_ENV === 'development' && agents.length > 0) {
    //   console.log("API key required for:", agents.map(a => `${a.name} (${a.type})`).join(', '));
    // }
    return agents
  }, [service?.workflow, agentDetails])

  // **[OPTIMIZED]** Check if all required API keys are selected - optimized with useMemo
  const areAllRequiredApiKeysSelected = useMemo(() => {
    const requiredAgents = getAgentsRequiringApiKey()
    if (requiredAgents.length === 0) return true

    // Check for each required agent if a valid key is selected
    const allSelected = requiredAgents.every((agent) => {
      const selectedKeyId = apiKeys[agent.id]
      if (!selectedKeyId) return false
      // Must match an available key for this agent type
      return availableApiKeys[agent.type]?.some((key) => key.id === selectedKeyId)
    })

    return allSelected
  }, [apiKeys, getAgentsRequiringApiKey, availableApiKeys])

  // Handle API key selection (store key id)
  const handleApiKeyChange = (agentId: number, keyId: string) => {
    setApiKeys((prev) => ({
      ...prev,
      [agentId]: keyId,
    }))
  }

  // **[OPTIMIZED]** Move getApiKeysForBackend inside ServicePage and optimize
  const getApiKeysForBackend = useCallback(() => {
    const result: { [agentId: number]: string } = {}
    const requiredAgents = getAgentsRequiringApiKey()
    requiredAgents.forEach((agent) => {
      const keyId = apiKeys[agent.id]
      if (keyId) {
        // For RAG agents, map their provider type to 'gemini' for API key lookup
        let providerType = agent.type
        if (agent.type === "rag" || agent.type === "rag_agent") {
          providerType = "gemini" // RAG agents use Gemini API keys
        } else if (agent.type === "gemini_text2image" || agent.type.includes("gemini_text2image")) {
          providerType = "gemini" // Gemini image generation agents use Gemini API keys
        }

        const keyObj = (availableApiKeys[providerType] || []).find((k) => k.id === keyId)
        if (keyObj) {
          result[agent.id] = keyObj.api_key
        }
      }
    })
    // Only log in development mode
    // if (process.env.NODE_ENV === 'development' && Object.keys(result).length > 0) {
    //   console.log("API keys prepared for backend:", Object.keys(result).length, "keys");
    // }
    return result
  }, [getAgentsRequiringApiKey, apiKeys, availableApiKeys])

  // **[UNIFIED FUNCTION]** - Generic function to detect file upload agent types
  const getFileUploadAgents = useCallback(() => {
    if (!service?.workflow?.nodes) return []

    const fileUploadAgents: Array<{
      id: number
      name: string
      type: string
      nodeId: string
      config: AgentTypeConfig
    }> = []

    Object.entries(service.workflow.nodes).forEach(([nodeId, node]) => {
      const agentId = node.agent_id
      const agentDetail = agentDetails[agentId]
      const agentType = agentDetail?.agent_type?.toLowerCase() || node.agent_type?.toLowerCase() || ""

      // Check if this agent type supports file uploads
      const config = AGENT_TYPE_CONFIGS[agentType]
      if (config) {
        fileUploadAgents.push({
          id: agentId,
          name: agentDetail?.name || node.agent_name || `Agent ${agentId}`,
          type: agentType,
          nodeId,
          config,
        })
      }
    })

    return fileUploadAgents
  }, [service?.workflow, agentDetails])
  // **[UNIFIED FUNCTION]** - Generic file upload handler
  const handleUnifiedFileUpload = async () => {
    const fileUploadAgents = getFileUploadAgents()

    if (fileUploadAgents.length === 0) {
      // Fall back to regular service endpoint
      return handleRegularServiceSubmit()
    }

    // For now, handle the first file upload agent (can be extended for multiple)
    const primaryAgent = fileUploadAgents[0]
    const config = primaryAgent.config

    try {
      setDocumentProcessingState({
        isProcessing: true,
        stage: "uploading",
        message: config.processingMessage || "Processing file...",
      })

      const token = localStorage.getItem("token") || localStorage.getItem("accessToken") || Cookies.get("accessToken")
      const currentUserId = Cookies.get("user_id") // **[SPECIAL HANDLING]** - RAG agents work differently (use mini service endpoint)
      if (primaryAgent.type === "rag" || primaryAgent.type === "rag_agent") {
        // RAG agents only need query and API key, use mini service endpoint
        if (!userInput || !userInput.trim()) {
          throw new Error("Please provide a query for the RAG agent")
        }

        // Get the API keys for backend
        const apiKeysForBackend = getApiKeysForBackend()

        if (Object.keys(apiKeysForBackend).length === 0) {
          throw new Error("API key is required for RAG document queries")
        }

        // Use the mini service endpoint with JSON body
        const processBody = {
          input: userInput,
          api_keys: apiKeysForBackend,
        }

        console.log("🔍 RAG query request:", {
          input: userInput,
          api_keys: Object.keys(apiKeysForBackend),
          serviceId,
        })

        const response = await fetch(
          `http://127.0.0.1:8000/api/v1/mini-services/${serviceId}/run?current_user_id=${currentUserId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(processBody),
            signal: AbortSignal.timeout(300000), // 5 minute timeout
          },
        )

        if (!response.ok) {
          let errorDetail = "Unknown error"
          try {
            const errorData = await response.json()
            errorDetail = errorData?.detail || JSON.stringify(errorData)
          } catch (parseError) {
            errorDetail = response.statusText
          }
          throw new Error(`Server error: ${response.status} ${errorDetail}`)
        }

        const data = await response.json()
        setResult(data)
        return
      }

      // **[NEW UPLOAD WORKFLOW]** - For agents that require file upload (like transcribe)
      if (config.requiresUpload && uploadedFile) {
        // Step 1: Upload the file first using the new /upload endpoint
        setDocumentProcessingState({
          isProcessing: true,
          stage: "uploading",
          message: "Uploading file to server...",
        })

        const uploadFormData = new FormData()
        uploadFormData.append("file", uploadedFile, uploadedFile.name)

        const uploadResponse = await fetch(
          `http://127.0.0.1:8000/api/v1/mini-services/upload?current_user_id=${currentUserId}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: uploadFormData,
            signal: AbortSignal.timeout(300000), // 5 minute timeout
          },
        )

        if (!uploadResponse.ok) {
          let errorDetail = "Unknown error"
          try {
            const errorData = await uploadResponse.json()
            errorDetail = errorData?.detail || JSON.stringify(errorData)
          } catch (parseError) {
            errorDetail = uploadResponse.statusText
          }
          throw new Error(`Upload failed: ${uploadResponse.status} ${errorDetail}`)
        }

        const uploadData = await uploadResponse.json()
        console.log("📁 File uploaded successfully:", uploadData)

        // Step 2: Use the uploaded filename to run the mini service
        setDocumentProcessingState({
          isProcessing: true,
          stage: "processing",
          message: "Processing uploaded file...",
        })

        const processBody = {
          input: uploadData.saved_as, // Use the generated filename from upload
          api_keys: getApiKeysForBackend(), // Include API keys if needed
        }

        const processResponse = await fetch(
          `http://127.0.0.1:8000/api/v1/mini-services/${serviceId}/run?current_user_id=${currentUserId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(processBody),
            signal: AbortSignal.timeout(300000), // 5 minute timeout
          },
        )

        if (!processResponse.ok) {
          let errorDetail = "Unknown error"
          try {
            const errorData = await processResponse.json()
            errorDetail = errorData?.detail || JSON.stringify(errorData)
          } catch (parseError) {
            errorDetail = processResponse.statusText
          }
          throw new Error(`Processing failed: ${processResponse.status} ${errorDetail}`)
        }

        const processData = await processResponse.json()
        setResult(processData)
        return
      }

      // **[LEGACY DIRECT UPLOAD]** - For agents that still use direct file upload endpoints
      const formData = new FormData()

      if (uploadedFile) {
        formData.append(config.fileFieldName, uploadedFile, uploadedFile.name)
      }

      // Add text input if provided and not a pure file processing agent
      if (userInput && !config.hasSpecialUI) {
        formData.append("input", userInput)
      }

      // Add additional fields based on agent type
      Object.entries(config.additionalFields || {}).forEach(([fieldName, fieldValue]) => {
        if (typeof fieldValue === "function") {
          // Dynamic field value based on context
          if (fieldName === "filename" && uploadedFile) {
            formData.append(fieldName, fieldValue(uploadedFile))
          } else if (fieldName === "api_keys" && config.requiresApiKey) {
            const apiKeysForBackend = getApiKeysForBackend()
            formData.append(fieldName, fieldValue(apiKeysForBackend))
          } else if (fieldName === "include_timestamps") {
            formData.append(fieldName, fieldValue(transcriptionOptions))
          }
        } else {
          // Static field value
          formData.append(fieldName, fieldValue)
        }
      })

      // Handle special query field for non-RAG agents
      if (config.hasSpecialUI && userInput && userInput.trim()) {
        formData.append("query", userInput)
      }

      // Make the API call to legacy endpoint
      const endpoint = typeof config.endpoint === "function" ? config.endpoint(primaryAgent.id) : config.endpoint

      const response = await fetch(`${endpoint}?current_user_id=${currentUserId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
        signal: AbortSignal.timeout(300000), // 5 minute timeout
      })

      if (!response.ok) {
        let errorDetail = "Unknown error"
        try {
          const errorData = await response.json()
          errorDetail = errorData?.detail || JSON.stringify(errorData)
        } catch (parseError) {
          errorDetail = response.statusText
        }
        throw new Error(`Server error: ${response.status} ${errorDetail}`)
      }

      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      console.error(`Error in ${primaryAgent.type} processing:`, error)

      // **[IMPROVED ERROR HANDLING]** - Better error messages for different agent types
      if (primaryAgent.type === "rag" || primaryAgent.type === "rag_agent") {
        if (error.message.includes("api_key") || error.message.includes("API key")) {
          setError("API key error: Please check that you've selected a valid Gemini API key for document processing.")
        } else if (error.message.includes("collection") || error.message.includes("ChromaDB")) {
          setError(
            "Document collection not found. Please make sure documents have been uploaded to this RAG agent first.",
          )
        } else {
          setError(error.message || "An error occurred while processing your query")
        }
      } else if (primaryAgent.type === "transcribe") {
        if (error.message.includes("Upload failed")) {
          setError("Failed to upload file. Please check the file size (max 200MB) and format, then try again.")
        } else if (error.message.includes("Processing failed")) {
          setError("Failed to process the uploaded file. Please try again or contact support.")
        } else {
          setError(error.message || "An error occurred while transcribing your file")
        }
      } else {
        setError(error.message || "An error occurred while processing your file")
      }
    } finally {
      setDocumentProcessingState({
        isProcessing: false,
        stage: "complete",
        message: "",
      })
    }
  }

  // **[UNIFIED FUNCTION]** - Regular service submission (non-file upload)
  const handleRegularServiceSubmit = async () => {
    // ... existing regular service submission logic ...
    const token = localStorage.getItem("token") || localStorage.getItem("accessToken") || Cookies.get("accessToken")
    const currentUserId = Cookies.get("user_id")

    let body: FormData | string
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    }

    if (service!.input_type === "text") {
      const bodyData = {
        input: userInput,
        api_keys: getApiKeysForBackend(),
      }
      body = JSON.stringify(bodyData)
      headers["Content-Type"] = "application/json"
    } else if (uploadedFile) {
      body = new FormData()
      body.append("file", uploadedFile)
      if (userInput) {
        body.append("input", userInput)
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
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.detail || `Server error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    setResult(data)
  }

  // **[MAIN HANDLER]** - Updated main submit handler to use unified approach
  const handleSubmit = async () => {
    if (!service) return

    // console.log("🚀 handleSubmit started");

    // Check if we have file upload agents
    const fileUploadAgents = getFileUploadAgents()
    const hasFileUploadAgents = fileUploadAgents.length > 0

    // console.log("📁 File upload check:", {
    //   fileUploadAgents: fileUploadAgents.length,
    //   hasFileUploadAgents,
    //   agentTypes: fileUploadAgents.map(a => a.type),
    //   uploadedFile: !!uploadedFile,
    //   userInput: !!userInput?.trim()
    // });

    // Validation based on agent capabilities
    const ragAgents = fileUploadAgents.filter((agent) => agent.type === "rag")
    const nonRagFileAgents = fileUploadAgents.filter((agent) => agent.type !== "rag")

    // RAG agents only need text input (for queries), not file uploads
    if (ragAgents.length > 0 && !userInput?.trim()) {
      // console.log("❌ Validation failed: RAG service needs text query");
      setError("Please provide a question or query for the RAG service.")
      return
    }

    // Non-RAG file upload agents need actual files
    if (nonRagFileAgents.length > 0 && !uploadedFile) {
      // console.log("❌ Validation failed: No file uploaded for file upload service");
      setError("Please upload a file for this service.")
      return
    }

    // Regular text services need text input
    if (!hasFileUploadAgents && !userInput?.trim()) {
      // console.log("❌ Validation failed: No text input for text service");
      setError("Please provide text input for this service.")
      return
    }

    // Check API key requirements
    if (!areAllRequiredApiKeysSelected) {
      // console.log("❌ Validation failed: Missing API keys");
      setError("Please select all required API keys before proceeding.")
      return
    }

    // console.log("✅ Validation passed, proceeding to submit");

    // Add user message to chat history
    const userMessage = {
      id: `user-${Date.now()}`,
      type: 'user' as const,
      content: userInput?.trim() || '',
      file: uploadedFile || undefined,
      timestamp: new Date()
    }
    setChatHistory(prev => [...prev, userMessage])

    // Clear inputs immediately after adding to history
    const currentInput = userInput
    const currentFile = uploadedFile
    setUserInput("")
    setUploadedFile(null)
    setError(null)

    setIsLoading(true)
    setResult(null)

    try {
      let response: any
      
      if (hasFileUploadAgents) {
        // console.log("📁 Calling handleUnifiedFileUpload");
        response = await performUnifiedFileUpload(currentInput, currentFile)
      } else {
        // console.log("📝 Calling handleRegularServiceSubmit");
        response = await performRegularServiceSubmit(currentInput, currentFile)
      }

      // Add assistant response to chat history
      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        type: 'assistant' as const,
        content: '',
        result: response,
        timestamp: new Date()
      }
      setChatHistory(prev => [...prev, assistantMessage])

    } catch (err: any) {
      console.error("Error running service:", err)
      
      // Add error message to chat history
      const errorMessage = {
        id: `assistant-${Date.now()}`,
        type: 'assistant' as const,
        content: err.message || "An unexpected error occurred while processing your request",
        timestamp: new Date()
      }
      setChatHistory(prev => [...prev, errorMessage])
      
      setError(err.message || "An unexpected error occurred while processing your request")
    } finally {
      setIsLoading(false)
    }
  }

  // Split unified file upload into separate function
  const performUnifiedFileUpload = async (inputText: string, file: File | null) => {
    // ... existing handleUnifiedFileUpload logic but return the response
    const fileUploadAgents = getFileUploadAgents()
    const primaryAgent = fileUploadAgents[0]
    const config = primaryAgent.config

    setDocumentProcessingState({
      isProcessing: true,
      stage: "uploading",
      message: config.processingMessage || "Processing file...",
    })

    const token = localStorage.getItem("token") || localStorage.getItem("accessToken") || Cookies.get("accessToken")
    const currentUserId = Cookies.get("user_id")

    // **[SPECIAL HANDLING]** - RAG agents work differently (use mini service endpoint)
    if (primaryAgent.type === "rag" || primaryAgent.type === "rag_agent") {
      if (!inputText || !inputText.trim()) {
        throw new Error("Please provide a query for the RAG agent")
      }

      const apiKeysForBackend = getApiKeysForBackend()
      if (Object.keys(apiKeysForBackend).length === 0) {
        throw new Error("API key is required for RAG document queries")
      }

      const processBody = {
        input: inputText,
        api_keys: apiKeysForBackend,
      }

      const response = await fetch(
        `http://127.0.0.1:8000/api/v1/mini-services/${serviceId}/run?current_user_id=${currentUserId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(processBody),
          signal: AbortSignal.timeout(300000),
        },
      )

      if (!response.ok) {
        let errorDetail = "Unknown error"
        try {
          const errorData = await response.json()
          errorDetail = errorData?.detail || JSON.stringify(errorData)
        } catch (parseError) {
          errorDetail = response.statusText
        }
        throw new Error(`Server error: ${response.status} ${errorDetail}`)
      }

      const data = await response.json()
      return data
    }

    // **[NEW UPLOAD WORKFLOW]** - For agents that require file upload (like transcribe)
    if (config.requiresUpload && file) {
      setDocumentProcessingState({
        isProcessing: true,
        stage: "uploading",
        message: "Uploading file to server...",
      })

      const uploadFormData = new FormData()
      uploadFormData.append("file", file, file.name)

      const uploadResponse = await fetch(
        `http://127.0.0.1:8000/api/v1/mini-services/upload?current_user_id=${currentUserId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: uploadFormData,
          signal: AbortSignal.timeout(300000),
        },
      )

      if (!uploadResponse.ok) {
        let errorDetail = "Unknown error"
        try {
          const errorData = await uploadResponse.json()
          errorDetail = errorData?.detail || JSON.stringify(errorData)
        } catch (parseError) {
          errorDetail = uploadResponse.statusText
        }
        throw new Error(`Upload failed: ${uploadResponse.status} ${errorDetail}`)
      }

      const uploadData = await uploadResponse.json()

      setDocumentProcessingState({
        isProcessing: true,
        stage: "processing",
        message: "Processing uploaded file...",
      })

      const processBody = {
        input: uploadData.saved_as,
        api_keys: getApiKeysForBackend(),
      }

      const processResponse = await fetch(
        `http://127.0.0.1:8000/api/v1/mini-services/${serviceId}/run?current_user_id=${currentUserId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(processBody),
          signal: AbortSignal.timeout(300000),
        },
      )

      if (!processResponse.ok) {
        let errorDetail = "Unknown error"
        try {
          const errorData = await processResponse.json()
          errorDetail = errorData?.detail || JSON.stringify(errorData)
        } catch (parseError) {
          errorDetail = processResponse.statusText
        }
        throw new Error(`Processing failed: ${processResponse.status} ${errorDetail}`)
      }

      const processData = await processResponse.json()
      return processData
    }

    // **[LEGACY DIRECT UPLOAD]** - For agents that still use direct file upload endpoints
    const formData = new FormData()

    if (file) {
      formData.append(config.fileFieldName, file, file.name)
    }

    if (inputText && !config.hasSpecialUI) {
      formData.append("input", inputText)
    }

    Object.entries(config.additionalFields || {}).forEach(([fieldName, fieldValue]) => {
      if (typeof fieldValue === "function") {
        if (fieldName === "filename" && file) {
          formData.append(fieldName, fieldValue(file))
        } else if (fieldName === "api_keys" && config.requiresApiKey) {
          const apiKeysForBackend = getApiKeysForBackend()
          formData.append(fieldName, fieldValue(apiKeysForBackend))
        } else if (fieldName === "include_timestamps") {
          formData.append(fieldName, fieldValue(transcriptionOptions))
        }
      } else {
        formData.append(fieldName, fieldValue)
      }
    })

    if (config.hasSpecialUI && inputText && inputText.trim()) {
      formData.append("query", inputText)
    }

    const endpoint = typeof config.endpoint === "function" ? config.endpoint(primaryAgent.id) : config.endpoint

    const response = await fetch(`${endpoint}?current_user_id=${currentUserId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
      signal: AbortSignal.timeout(300000),
    })

    if (!response.ok) {
      let errorDetail = "Unknown error"
      try {
        const errorData = await response.json()
        errorDetail = errorData?.detail || JSON.stringify(errorData)
      } catch (parseError) {
        errorDetail = response.statusText
      }
      throw new Error(`Server error: ${response.status} ${errorDetail}`)
    }

    const data = await response.json()
    return data
  }

  // Split regular service submit into separate function
  const performRegularServiceSubmit = async (inputText: string, file: File | null) => {
    const token = localStorage.getItem("token") || localStorage.getItem("accessToken") || Cookies.get("accessToken")
    const currentUserId = Cookies.get("user_id")

    let body: FormData | string
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    }

    if (service!.input_type === "text") {
      const bodyData = {
        input: inputText,
        api_keys: getApiKeysForBackend(),
      }
      body = JSON.stringify(bodyData)
      headers["Content-Type"] = "application/json"
    } else if (file) {
      body = new FormData()
      body.append("file", file)
      if (inputText) {
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
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.detail || `Server error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data
  }

  // Handle service deletion
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

  // Get color based on input/output type
  const getServiceColor = () => {
    if (!service) return "from-purple-600 to-purple-800"

    if (service.input_type === "text" && service.output_type === "text") {
      return "from-purple-600 to-purple-800"
    } else if (service.input_type === "text" && service.output_type === "image") {
      return "from-pink-600 to-pink-800"
    } else if (service.input_type === "text" && service.output_type === "sound") {
      return "from-orange-600 to-orange-800"
    } else if (service.input_type === "sound" || service.output_type === "sound") {
      return "from-blue-600 to-blue-800"
    } else if (service.input_type === "image" || service.output_type === "image") {
      return "from-green-600 to-green-800"
    }

    return "from-indigo-600 to-indigo-800"
  }

  // Get service icon based on input/output type
  const getServiceIcon = () => {
    if (!service) return <Wand2 className="h-6 w-6 text-white" />

    if (service.input_type === "text" && service.output_type === "text") {
      return <MessageSquare className="h-6 w-6 text-white" />
    } else if (service.input_type === "text" && service.output_type === "image") {
      return <ImageIcon className="h-6 w-6 text-white" />
    } else if (service.input_type === "text" && service.output_type === "sound") {
      return <Headphones className="h-6 w-6 text-white" />
    } else if (service.input_type === "sound" || service.output_type === "sound") {
      return <Headphones className="h-6 w-6 text-white" />
    } else if (service.input_type === "image" || service.output_type === "image") {
      return <ImageIcon className="h-6 w-6 text-white" />
    }

    return <Wand2 className="h-6 w-6 text-white" />
  }

  // Extract audio URL from result
  const extractAudioUrl = (result: any): string | null => {
    if (!result || !result.process_id) return null

    const userId = Cookies.get("user_id")
    if (!userId) return null

    // Construct the base URL for audio endpoint
    return `http://127.0.0.1:8000/api/v1/mini-services/audio/${result.process_id}?current_user_id=${userId}`
  }

  // Custom audio player controls
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

  // **[UNIFIED UI RENDERER]** - Render input based on unified agent configuration
  const renderChatInput = () => {
    if (!service) return null

    // Get file upload requirements from agents
    const fileUploadRequirements = getFileUploadRequirements()

    // If we have file upload agents, show file upload UI
    if (fileUploadRequirements) {
      const { acceptedTypes, maxSize, hasSpecialUI, type, agentName } = fileUploadRequirements

      // Special UI for RAG document services
      if (hasSpecialUI && type === "rag") {
        return (
          <div className="flex items-end space-x-2">
            <div className="flex-1">
              <Input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Ask a question about the documents..."
                className="bg-zinc-800/50 border-zinc-700/50 text-white rounded-2xl px-4 py-3 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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

      // Special UI for transcription services
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

            {/* Transcription options */}
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

            <div className="flex items-end space-x-2">
              <div className="flex-1">
                <Input
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Add instructions (optional)..."
                  className="bg-zinc-800/50 border-zinc-700/50 text-white rounded-2xl px-4 py-3 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )
      }

      // Generic file upload UI for other agent types
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

          <div className="flex items-end space-x-2">
            <div className="flex-1">
              <Input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Add context (optional)..."
                className="bg-zinc-800/50 border-zinc-700/50 text-white rounded-2xl px-4 py-3 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )
    }

    // Fall back to text input for non-file upload services
    return (
      <div className="flex items-end space-x-2">
        <div className="flex-1">
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

  // Render output based on service type and result
  const renderOutput = () => {
    if (!result) return null

    // console.log("🖼️ renderOutput called with result:", JSON.stringify(result, null, 2));
    // console.log("🔍 RAG detection fields:", {
    //   sources: !!result.sources,
    //   rag_prompt: !!result.rag_prompt,
    //   answer: !!result.answer,
    //   source_documents: !!result.source_documents
    // });
    // console.log("🔍 Output candidates:", {
    //   answer: result.answer,
    //   response: result.response,
    //   output: result.output,
    //   final_output: result.final_output
    // });

    // Handle error display
    if (error) {
      return (
        <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4">
          <p className="text-red-300">{error}</p>
        </div>
      )
    }

    // Check if this is a RAG result (has source_documents or answer from backend)
    if (result.source_documents || result.sources || result.answer || result.rag_prompt) {
      return (
        <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-purple-900/30 p-6">
          <h3 className="text-lg font-medium text-white mb-4">Document Analysis</h3>

          {/* Main response - backend uses 'answer' field */}
          <div className="whitespace-pre-wrap text-gray-300 mb-6 p-4 bg-black/30 rounded-lg border border-purple-900/20">
            {result.answer || result.response || result.output || "No response available"}
          </div>

          {/* Debug info in development */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-6 pt-4 border-t border-purple-900/30">
              <details>
                <summary className="text-sm text-gray-400 cursor-pointer">Debug Information</summary>
                <div className="mt-2 text-xs text-gray-500">
                  <p>Token Usage: {result.token_usage ? JSON.stringify(result.token_usage) : "Not available"}</p>
                  <pre className="mt-2 overflow-auto max-h-[200px] bg-black/30 p-2 rounded">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          )}
        </div>
      )
    }

    // Check if this is a transcription result
    if (result.transcription || result.agent_type === "transcribe") {
      // ... existing transcription result rendering ...
    }

    // Determine what to display based on output type
    switch (service?.output_type) {
      case "text":
        const textOutput = result.final_output || result.output || result.results?.[0]?.output
        return (
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-purple-900/30 p-6">
            <h3 className="text-lg font-medium text-white mb-4">Result</h3>
            <div className="whitespace-pre-wrap text-gray-300">{textOutput || "No output available"}</div>
          </div>
        )

      case "sound":
        const audioUrl = extractAudioUrl(result)

        return (
          <div className="w-full">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center">
              <Headphones className="h-5 w-5 mr-2 text-purple-400" />
              Audio Result
            </h3>
            {audioUrl ? (
              <div className="space-y-4">
                <div className="bg-black/30 rounded-lg p-4 border border-purple-900/20">
                  <audio
                    controls
                    className="w-full h-12"
                    key={audioUrl}
                    style={{ width: '100%' }}
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

                {process.env.NODE_ENV === "development" && (
                  <div className="pt-4 border-t border-purple-900/30">
                    <details>
                      <summary className="text-sm text-gray-400 cursor-pointer">Debug Information</summary>
                      <div className="mt-2 text-xs text-gray-500">
                        <p>Process ID: {result.process_id}</p>
                        <pre className="mt-2 overflow-auto max-h-[200px] bg-black/30 p-2 rounded">
                          {JSON.stringify(result, null, 2)}
                        </pre>
                      </div>
                    </details>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4">
                <p className="text-red-300 flex items-center">
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  No audio output available
                </p>
              </div>
            )}
          </div>
        )

      case "image":
        const imageUrl = result.image_url || result.final_output
        return (
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-purple-900/30 p-6">
            <h3 className="text-lg font-medium text-white mb-4">Generated Image</h3>
            {imageUrl && (
              <div className="mt-4 flex justify-center">
                <img
                  src={
                    imageUrl.startsWith("http") || imageUrl.startsWith("data:")
                      ? imageUrl
                      : `http://127.0.0.1:8000${imageUrl}`
                  }
                  alt="Generated image"
                  className="max-w-full rounded-lg shadow-lg max-h-[500px]"
                />
              </div>
            )}
          </div>
        )

      case "video":
        const videoUrl = result.video_url || result.final_output
        return (
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-purple-900/30 p-6">
            <h3 className="text-lg font-medium text-white mb-4">Processed Video</h3>
            {videoUrl && (
              <div className="mt-4">
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

      default:
        return (
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-purple-900/30 p-6">
            <h3 className="text-lg font-medium text-white mb-4">Result</h3>
            <pre className="text-xs text-gray-400 overflow-auto max-h-[400px]">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )
    }
  }

  // Modern horizontal workflow visualization with enhanced styling and interactivity
  const renderWorkflow = () => {
    if (!service?.workflow?.nodes) return null

    // Get nodes in order
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

    // Get card color based on agent type
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
      <div className="relative bg-black/20 border border-purple-900/20 backdrop-blur-sm rounded-xl p-6 mb-2">
        {/* Flow line connector - continuous line through all nodes */}
        <div className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 bg-gradient-to-r from-purple-500/10 via-indigo-500/30 to-purple-500/10 z-0"></div>

        <div className="pb-4 -mx-4 px-4">
          <div className="flex items-stretch gap-8 sm:gap-12 lg:gap-16 min-w-fit py-4">
            {orderedNodes.map((node, idx) => {
              const description = node.agent_description || ""
              const isLongDescription = description.length > 100
              const isExpanded = expandedDescriptions[node.id]
              const agentColor = getAgentColor(node.agent_type)
              const showArrow = idx < orderedNodes.length - 1

              return (
                <div key={node.id} className="relative flex flex-col items-center group">
                  {/* Card */}
                  <div
                    className={`
                      transition-all duration-300 bg-gradient-to-br from-zinc-900 to-zinc-950 
                      border-2 border-purple-900/30 rounded-xl shadow-[0_4px_20px_rgba(107,70,193,0.2)]
                      px-3 sm:px-4 lg:px-5 py-3 sm:py-4 w-48 sm:w-56 lg:w-64 z-10 hover:scale-105 hover:border-purple-500/60 
                      focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-black
                      cursor-pointer group/card origin-center
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
                    <div className="absolute -top-2 sm:-top-3 bg-gradient-to-br from-purple-600 to-indigo-700 h-5 w-5 sm:h-6 sm:w-6 rounded-full flex items-center justify-center shadow-lg shadow-purple-900/20 z-100">
                      <span className="text-xs font-bold text-white">{idx + 1}</span>
                    </div>

                    {/* Rest of your node card contents - unchanged */}
                    <div className="flex items-center gap-2 mb-2 sm:mb-3">
                      <div
                        className={`h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 
                        flex items-center justify-center shadow-inner text-xs text-white font-bold
                        transition-all group-hover/card:scale-110 group-hover/card:shadow-purple-500/30`}
                      >
                        {/* Your emoji logic - unchanged */}
                        {(() => {
                          const type = node.agent_type.toLowerCase()
                          if (type.includes("gemini") && type.includes("text2image")) {
                            return <LucideBrush className="w-5 h-5" /> // 🎨
                          } else if (type.includes("gemini")) {
                            return <LucideBot className="w-5 h-5" /> // 🤖
                          } else if (type.includes("openai")) {
                            return <LucideBot className="w-5 h-5" /> // 🤖
                          } else if (type.includes("edge_tts") || type.includes("bark_tts")) {
                            return <LucideVolume2 className="w-5 h-5" /> // 🔊
                          } else if (type.includes("transcribe")) {
                            return <LucideMic className="w-5 h-5" /> // 🎤
                          } else if (type.includes("text2image") || type.includes("gemini_text2image")) {
                            return <LucideImage className="w-5 h-5" /> // 🖼️
                          } else if (type.includes("internet_research")) {
                            return <LucideSearch className="w-5 h-5" /> // 🔍
                          } else if (type.includes("document_parser")) {
                            return <FileText className="w-5 h-5" /> // 📄
                          } else if (type.includes("custom_endpoint")) {
                            return <LucidePlug className="w-5 h-5" /> // 🔌
                          } else if (type.includes("audio") || type.includes("text2speech")) {
                            return <LucideMusic className="w-5 h-5" /> // 🎵
                          } else if (type.includes("video")) {
                            return <LucideClapperboard className="w-5 h-5" /> // 🎬
                          } else {
                            return <LucideSparkles className="w-5 h-5" /> // ✨
                          }
                        })()}
                      </div>
                      <h3
                        className="font-semibold text-white text-sm sm:text-base truncate flex-1"
                        title={node.agent_name}
                      >
                        {node.agent_name}
                      </h3>
                    </div>

                    <div className="text-gray-300 text-xs mt-1">
                      {isLongDescription ? (
                        <>
                          <div
                            className={`overflow-hidden transition-all duration-300 ease-in-out
                            ${isExpanded ? "max-h-32 sm:max-h-48" : "max-h-10 sm:max-h-12"}`}
                          >
                            <p className={`leading-relaxed text-xs ${isExpanded ? "" : "line-clamp-2"}`}>
                              {description}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setExpandedDescriptions((prev) => ({ ...prev, [node.id]: !prev[node.id] }))
                            }}
                            className="text-purple-400 text-xs mt-1 hover:text-purple-300 focus:outline-none focus:text-purple-200 transition-colors"
                            aria-label={isExpanded ? "Show less" : "Show more"}
                          >
                            {isExpanded ? "Show less ↑" : "Show more ↓"}
                          </button>
                        </>
                      ) : (
                        <p className="leading-relaxed text-xs">{description}</p>
                      )}
                    </div>

                    <div className="mt-3 sm:mt-4 flex flex-wrap gap-1 sm:gap-2">
                      <span className="text-xs bg-purple-900/40 text-purple-300 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium border border-purple-800/30">
                        {node.agent_type}
                      </span>
                      {node.agent_config?.model && (
                        <span className="text-xs bg-indigo-900/40 text-indigo-300 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium border border-indigo-800/30">
                          {node.agent_config.model}
                        </span>
                      )}
                      {(AGENT_TYPES_REQUIRING_API_KEY.includes(node.agent_type?.toLowerCase() || "") ||
                        node.agent_type?.toLowerCase().includes("rag")) && (
                        <span className="text-xs bg-amber-900/40 text-amber-300 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium flex items-center gap-1 border border-amber-800/30">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-2.5 w-2.5 sm:h-3 sm:w-3"
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
                          <span className="hidden sm:inline">API Key</span>
                          <span className="sm:hidden">Key</span>
                        </span>
                      )}
                    </div>

                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 -z-10 bg-gradient-to-r from-purple-600/0 via-purple-600/10 to-purple-600/0 opacity-0 blur-xl transition-opacity duration-500 group-hover/card:opacity-100"></div>
                  </div>

                  {/* Add the beautifully styled arrow */}
                  {showArrow && (
                    <div className="absolute -right-6 sm:-right-8 lg:-right-10 top-1/2 transform translate-y-1.5 translate-x-4 sm:translate-x-6 lg:translate-x-7 z-20">
                      <div className="flex items-center justify-center">
                        <div className="relative">
                          {/* Arrow shaft with animated gradient */}
                          <div className="h-[2px] sm:h-[3px] w-12 sm:w-16 lg:w-20 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"></div>

                          {/* Arrow head - triangle */}
                          <div
                            className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-0 h-0 
                                        border-t-[4px] sm:border-t-[5px] lg:border-t-[6px] border-t-transparent 
                                        border-l-[6px] sm:border-l-[8px] lg:border-l-[9px] border-l-indigo-500
                                        border-b-[4px] sm:border-b-[5px] lg:border-b-[6px] border-b-transparent"
                          ></div>

                          {/* Subtle glow effect */}
                          <div className="absolute inset-0 -z-10 bg-purple-500/30 filter blur-sm rounded-full"></div>

                          {/* Pulsing animated dot in center */}
                          <div
                            className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2
                                        h-2 w-2 sm:h-2.5 sm:w-2.5 lg:h-3 lg:w-3 rounded-full bg-purple-300/80 animate-pulse"
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tooltip - unchanged */}
                  <div
                    className="hidden lg:group-hover/card:flex absolute left-1/2 -translate-x-1/2 top-full mt-4 z-30 
                    w-64 sm:w-72 flex-col bg-zinc-900/95 backdrop-blur-md border border-purple-800/40 rounded-xl 
                    shadow-[0_10px_25px_-5px_rgba(0,0,0,0.8)] p-3 sm:p-4 text-xs text-gray-200 transition-opacity 
                    duration-300 opacity-0 lg:group-hover/card:opacity-100"
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 transform rotate-45 w-4 h-4 bg-zinc-900 border-t border-l border-purple-800/40"></div>
                    <div className="font-bold text-purple-300 text-sm mb-1 border-b border-purple-900/40 pb-2">
                      {node.agent_name}
                    </div>
                    <div className="mb-2 py-2 max-h-32 sm:max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-800/30">
                      {description}
                    </div>
                    <div className="flex flex-wrap gap-1 sm:gap-2 mt-1">
                      <span className="bg-purple-900/40 text-purple-300 px-2 py-1 rounded-full text-xs">
                        {node.agent_type}
                      </span>
                      {node.agent_config?.model && (
                        <span className="bg-indigo-900/40 text-indigo-300 px-2 py-1 rounded-full text-xs">
                          {node.agent_config.model}
                        </span>
                      )}
                      {node.agent_input_type && node.agent_output_type && (
                        <span className="bg-green-900/40 text-green-300 px-2 py-1 rounded-full text-xs">
                          {node.agent_input_type} → {node.agent_output_type}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // **[NEW HELPER]** - Get file upload requirements for UI
  const getFileUploadRequirements = useCallback(() => {
    const agents = getFileUploadAgents()
    if (agents.length === 0) return null

    // For now, return requirements for the primary agent
    const primaryAgent = agents[0]
    return {
      acceptedTypes: primaryAgent.config.supportedFileTypes.join(","),
      maxSize: primaryAgent.config.maxFileSize,
      hasSpecialUI: primaryAgent.config.hasSpecialUI,
      type: primaryAgent.type,
      agentName: primaryAgent.name,
    }
  }, [getFileUploadAgents])

  // **[RESTORED]** - Fetch document collection for RAG services (endpoint now available in backend)
  useEffect(() => {
    // Only fetch if this is a RAG service and we have service details
    const isRAGService = checkIfRAGDocumentService()
    const hasServiceId = !!service?.id
    const isAuth = !!isAuthenticated

    // console.log("📝 useEffect conditions:", {
    //   isRAGService,
    //   hasServiceId,
    //   isAuth,
    //   serviceId: service?.id,
    //   shouldRun: isRAGService && hasServiceId && isAuth
    // });

    if (!isRAGService || !hasServiceId || !isAuth) return

    const fetchDocumentCollection = async () => {
      try {
        // console.log("🔍 Fetching document collection for service:", service?.id);
        setDocumentCollection((prev) => ({ ...prev, isLoading: true }))
        const token = localStorage.getItem("token") || localStorage.getItem("accessToken") || Cookies.get("accessToken")
        const currentUserId = Cookies.get("user_id")

        // Get the agent ID for the RAG service
        const agentId = getRAGAgentId()
        // console.log("🤖 RAG Agent ID:", agentId);
        if (!agentId) {
          console.error("RAG agent ID not found")
          setDocumentCollection((prev) => ({ ...prev, isLoading: false }))
          return
        }

        const url = `http://127.0.0.1:8000/api/v1/agents/${agentId}/documents?current_user_id=${currentUserId}`
        // console.log("📡 Fetching documents from:", url);

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        // console.log("📄 Response status:", response.status);

        if (!response.ok) {
          console.error("Failed to fetch document collection:", response.status, response.statusText)
          setDocumentCollection((prev) => ({ ...prev, isLoading: false }))
          return
        }

        const data = await response.json()
        // console.log("📋 Documents received:", data);

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

  // Format seconds into a readable timestamp (MM:SS.ms)
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return "00:00.0"

    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    const milliseconds = Math.floor((seconds % 1) * 10)

    const formattedMinutes = minutes.toString().padStart(2, "0")
    const formattedSeconds = remainingSeconds.toString().padStart(2, "0")

    return `${formattedMinutes}:${formattedSeconds}.${milliseconds}`
  }

  // **[HELPER FUNCTIONS]** - Add helper functions for backward compatibility
  const checkIfRAGDocumentService = (): boolean => {
    const fileUploadAgents = getFileUploadAgents()
    const isRAG = fileUploadAgents.some((agent) => agent.type === "rag")
    // console.log("🔍 Checking if RAG service:", {
    //   fileUploadAgents: fileUploadAgents.length,
    //   agentTypes: fileUploadAgents.map(a => a.type),
    //   isRAG
    // });
    return isRAG
  }

  const checkIfTranscriptionService = (): boolean => {
    const fileUploadAgents = getFileUploadAgents()
    return fileUploadAgents.some((agent) => agent.type === "transcribe")
  }

  const getRAGAgentId = (): number | null => {
    const fileUploadAgents = getFileUploadAgents()
    const ragAgent = fileUploadAgents.find((agent) => agent.type === "rag")
    return ragAgent ? ragAgent.id : null
  }

  // Copy function
  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedStates(prev => ({ ...prev, [key]: true }))
      toast({
        title: "Copied!",
        description: "Content copied to clipboard",
      })
      // Reset copy state after 2 seconds
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [key]: false }))
      }, 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
      toast({
        title: "Copy failed",
        description: "Failed to copy content to clipboard",
        variant: "destructive",
      })
    }
  }

  // Render output for individual chat messages
  const renderOutputForMessage = (result: any, messageId: string) => {
    if (!result) return null

    // Check if this is a RAG result (has source_documents or answer from backend)
    if (result.source_documents || result.sources || result.answer || result.rag_prompt) {
      return (
        <div className="w-full">
          <h3 className="text-lg font-medium text-white mb-4">Document Analysis</h3>
          <div className="whitespace-pre-wrap text-gray-300 mb-4 p-4 bg-black/30 rounded-lg border border-purple-900/20 relative group">
            {result.answer || result.response || result.output || "No response available"}
            <button
              onClick={() => copyToClipboard(result.answer || result.response || result.output || "", `text-${messageId}`)}
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

    // Determine what to display based on output type
    switch (service?.output_type) {
      case "text":
        const textOutput = result.final_output || result.output || result.results?.[0]?.output
        return (
          <div className="w-full">
            <h3 className="text-lg font-medium text-white mb-4">Result</h3>
            <div className="whitespace-pre-wrap text-gray-300 p-4 bg-black/30 rounded-lg border border-purple-900/20 relative group">
              {textOutput || "No output available"}
              <button
                onClick={() => copyToClipboard(textOutput || "", `text-${messageId}`)}
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

      case "sound":
        const audioUrl = extractAudioUrl(result)
        return (
          <div className="w-full">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center">
              <Headphones className="h-5 w-5 mr-2 text-purple-400" />
              Audio Result
            </h3>
            {audioUrl ? (
              <div className="space-y-4">
                <div className="bg-black/30 rounded-lg p-4 border border-purple-900/20">
                  <audio
                    controls
                    className="w-full h-12"
                    key={audioUrl}
                    style={{ width: '100%' }}
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  No audio output available
                </p>
              </div>
            )}
          </div>
        )

      case "image":
        const imageUrl = result.image_url || result.final_output
        return (
          <div className="w-full">
            <h3 className="text-lg font-medium text-white mb-4">Generated Image</h3>
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
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded bg-black/60 hover:bg-black/80"
                    title="Copy image URL"
                  >
                    {copiedStates[`image-${messageId}`] ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4 text-white" />
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
            <h3 className="text-lg font-medium text-white mb-4">Processed Video</h3>
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

      default:
        return (
          <div className="w-full">
            <h3 className="text-lg font-medium text-white mb-4">Result</h3>
            <div className="relative group">
              <pre className="text-xs text-gray-400 overflow-auto max-h-[400px] p-4 bg-black/30 rounded-lg border border-purple-900/20">{JSON.stringify(result, null, 2)}</pre>
              <button
                onClick={() => copyToClipboard(JSON.stringify(result, null, 2), `json-${messageId}`)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded bg-purple-600/20 hover:bg-purple-600/40"
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

  // Add user data state for avatar
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    initials: "",
  })

  // Fetch user data from JWT token and cookies
  useEffect(() => {
    const fetchUserData = () => {
      // Try to get email from cookie
      const userEmail = Cookies.get("user_email")

      // Try to get username from JWT token
      const token = getAccessToken()
      const decodedToken = token ? decodeJWT(token) : null

      let name = "User"
      let email = userEmail || ""

      if (decodedToken) {
        name = decodedToken.username || name
        email = decodedToken.email || userEmail || email
      }

      // Generate initials from name
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

  if (isServiceLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black">
        <NavBar />
        <main className="pt-16 h-[calc(100vh-64px)] flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
        </main>
      </div>
    )
  }

  if (error && !service) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black">
        <NavBar />
        <main className="pt-16 h-[calc(100vh-64px)] flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black">
      <NavBar />

      <main className="pt-16 h-[calc(100vh-64px)] flex">
        {/* Stats Sidebar - LEFT SIDE */}
        <div
          className={`${statsOpen ? "w-80 xl:w-96" : "w-16"} hidden lg:flex border-r border-purple-900/30 flex-col transition-all duration-500 ease-in-out relative min-h-full`}
        >
          {/* Stats Header with Toggle */}
          <div className="p-4 border-b border-purple-900/30 bg-gradient-to-r from-purple-900/20 to-indigo-900/20">
            <div className="flex items-center justify-center">
              <button
                onClick={() => setStatsOpen(!statsOpen)}
                className={`${statsOpen ? "w-full justify-start" : "w-10 h-10 justify-center"} flex items-center bg-purple-600/20 hover:bg-purple-600/40 rounded-xl transition-all duration-300 ease-in-out p-2 border border-purple-500/30 hover:border-purple-400/50 group`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-lg bg-purple-600/30 flex items-center justify-center group-hover:bg-purple-500/40 transition-colors">
                    <BarChart3 className="w-4 h-4 text-purple-300 group-hover:text-purple-100 transition-colors" />
                  </div>
                  {statsOpen && (
                    <span className="text-white font-medium text-sm animate-in slide-in-from-left-2 duration-300">
                      Statistics & Settings
                    </span>
                  )}
                </div>
                {statsOpen && (
                  <ChevronRight className="w-4 h-4 text-purple-300 group-hover:text-purple-100 transition-all duration-300 group-hover:rotate-180" />
                )}
              </button>
            </div>
          </div>

          {statsOpen ? (
            <div className="flex-1 flex flex-col animate-in slide-in-from-left-4 duration-500">
              {/* Statistics Section */}
              <div className="p-6 border-b border-purple-900/30 bg-gradient-to-b from-purple-950/10 to-transparent">
                <div className="flex items-center mb-6">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center mr-3 shadow-lg">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Analytics</h2>
                </div>

                <div className="space-y-6">
                  <div className="bg-black/30 rounded-xl p-4 border border-purple-900/20 backdrop-blur-sm">
                    <div className="text-purple-300 text-sm mb-2 font-medium">Total Runs</div>
                    <div className="text-white text-4xl font-bold mb-1">
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

                  {service?.average_token_usage && (
                    <div className="space-y-4">
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
              </div>

              {/* Service Settings Section */}
              <div className="p-6 flex-1 overflow-y-auto">
                <div className="flex items-center mb-6">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center mr-3 shadow-lg">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                      <path d="m12 1 3 6 6 3-6 3-3 6-3-6-6-3 6-3z" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-white">Configuration</h2>
                </div>

                <div className="text-gray-400 text-sm mb-6">Configure your service parameters and API keys</div>

                {/* API Key Configuration */}
                {getAgentsRequiringApiKey().length > 0 ? (
                  <div className="space-y-4 bg-gradient-to-br from-purple-950/30 to-indigo-950/30 rounded-xl p-5 border border-purple-900/40 mb-6 backdrop-blur-sm">
                    <h3 className="text-lg font-bold text-purple-200 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z" />
                      </svg>
                      API Keys Required
                    </h3>
                    {getAgentsRequiringApiKey().map((agent, index) => {
                      const selectedKeyId = apiKeys[agent.id] || ""
                      return (
                        <div key={agent.id} className="space-y-3 animate-in slide-in-from-bottom-2" style={{ animationDelay: `${index * 100}ms` }}>
                          <label className="text-sm text-purple-200 flex items-center font-medium">
                            <span className="inline-block w-3 h-3 rounded-full bg-gradient-to-r from-purple-400 to-indigo-400 mr-3"></span>
                            {agent.name}
                            <span className="ml-2 text-xs bg-purple-800/40 text-purple-300 px-2 py-1 rounded-full">
                              {agent.type}
                            </span>
                          </label>
                          <Select value={selectedKeyId} onValueChange={(value) => handleApiKeyChange(agent.id, value)}>
                            <SelectTrigger className="bg-black/40 border-purple-900/30 text-white text-sm hover:border-purple-500/50 transition-colors">
                              <SelectValue placeholder={`Select ${agent.type} key`} />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-950 border-purple-900/30 text-white">
                              {availableApiKeys[agent.type]?.length > 0 ? (
                                availableApiKeys[agent.type].map((key) => (
                                  <SelectItem key={key.id} value={key.id} className="text-sm hover:bg-purple-900/20">
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
                ) : (
                  <div className="space-y-4 bg-gradient-to-br from-green-950/30 to-emerald-950/30 rounded-xl p-5 border border-green-900/40 mb-6 backdrop-blur-sm">
                    <h3 className="text-lg font-bold text-green-200 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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

               
              </div>
            </div>
          ) : (
            // Collapsed sidebar - only show icons with animations
            <div className="p-4 flex flex-col items-center space-y-6 flex-1">
              <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center hover:bg-purple-600/40 transition-all duration-300 cursor-pointer group" title="Settings">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-purple-400 group-hover:text-purple-200 transition-colors">
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                  <path d="m12 1 3 6 6 3-6 3-3 6-3-6-6-3 6-3z" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              
              {getAgentsRequiringApiKey().length > 0 && (
                <div className="w-10 h-10 rounded-lg bg-amber-600/20 flex items-center justify-center hover:bg-amber-600/40 transition-all duration-300 cursor-pointer group" title="API Keys Required">
                  <svg className="w-5 h-5 text-amber-400 group-hover:text-amber-200 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z" />
                  </svg>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Back Button - Mobile */}
        <div className="lg:hidden fixed top-20 left-4 z-50">
          <Button
            variant="ghost"
            className="text-gray-400 hover:text-white bg-black/60 backdrop-blur-sm border border-purple-900/30"
            onClick={() => router.push("/apps")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Main Content Area - Chat Interface and Workflow */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${statsOpen ? "lg:ml-0" : ""}`}>
          {/* Chat Interface Header */}
          <div className="p-4 lg:p-6">
            <div className={`bg-gradient-to-r ${getServiceColor()} rounded-2xl p-6 shadow-2xl`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mr-4 backdrop-blur-sm">
                    {getServiceIcon()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{service?.name || "Service Interface"}</h2>
                    <p className="text-purple-100 mt-1">
                      {service?.description }
                    </p>
                    {/* Service Type Badges */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full font-medium backdrop-blur-sm">
                        {service?.input_type} → {service?.output_type}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Desktop Back Button */}
                <div className="hidden lg:block">
                  <Button
                    variant="ghost"
                    className="text-purple-100 hover:text-white hover:bg-white/10"
                    onClick={() => router.push("/apps")}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Container - Large Box */}
          <div className="flex-1 p-4 lg:p-6">
            <div className="h-full bg-black/40 backdrop-blur-sm rounded-2xl border border-purple-900/30 flex flex-col">
              {/* Chat Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 scroll-smooth" style={{ maxHeight: 'calc(100vh - 400px)' }} ref={chatMessagesRef}>
                <div className="max-w-4xl mx-auto">
                  {/* Chat Messages */}
                  <div className="space-y-4 min-h-[300px]">
                    {/* Bot welcome message */}
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 bg-gradient-to-r ${getServiceColor()} rounded-full flex items-center justify-center flex-shrink-0 mt-1`}>
                        {getServiceIcon() && React.cloneElement(getServiceIcon(), { className: "h-4 w-4 text-white" })}
                      </div>
                      <div className="bg-zinc-800/80 backdrop-blur-sm rounded-2xl rounded-tl-sm p-4 max-w-md">
                        <p className="text-gray-200 text-sm">
                          Hello! I'm ready to help you with {service?.input_type} processing.
                          {service?.output_type && ` I'll provide ${service.output_type} output.`}
                        </p>
                      </div>
                    </div>

                    {/* Chat History Messages */}
                    {chatHistory.map((message) => (
                      <div key={message.id}>
                        {message.type === 'user' ? (
                          /* User message */
                          <div className="flex items-start space-x-3 justify-end">
                            <div className={`bg-gradient-to-r ${getServiceColor()} rounded-2xl rounded-tr-sm p-4 max-w-md`}>
                              <p className="text-white text-sm break-words">
                                {message.file ? `📎 ${message.file.name}` : message.content}
                              </p>
                              {message.content && message.file && (
                                <p className="text-purple-100 text-xs mt-2">{message.content}</p>
                              )}
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center flex-shrink-0 mt-1 border border-purple-500/30 shadow-lg">
                              <span className="text-xs font-bold text-white">
                                {userData.initials || "U"}
                              </span>
                            </div>
                          </div>
                        ) : (
                          /* Assistant message */
                          <div className="flex items-start space-x-3">
                            <div className={`w-8 h-8 bg-gradient-to-r ${getServiceColor()} rounded-full flex items-center justify-center flex-shrink-0 mt-1`}>
                              {getServiceIcon() && React.cloneElement(getServiceIcon(), { className: "h-4 w-4 text-white" })}
                            </div>
                            <div className="bg-zinc-800/80 backdrop-blur-sm rounded-2xl rounded-tl-sm p-4 max-w-3xl relative group flex-1">
                              {message.result ? (
                                <div className="w-full">
                                  {renderOutputForMessage(message.result, message.id)}
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
                        <div className={`w-8 h-8 bg-gradient-to-r ${getServiceColor()} rounded-full flex items-center justify-center flex-shrink-0 mt-1`}>
                          {getServiceIcon() && React.cloneElement(getServiceIcon(), { className: "h-4 w-4 text-white" })}
                        </div>
                        <div className="bg-zinc-800/80 backdrop-blur-sm rounded-2xl rounded-tl-sm p-4 max-w-md">
                          <div className="flex items-center space-x-2">
                            <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                            <span className="text-gray-300 text-sm">Processing your request...</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Scroll anchor */}
                    <div />
                  </div>
                </div>
              </div>

              {/* Chat Input Area - Fixed at bottom of chat box */}
              <div className="border-t border-purple-900/30 bg-black/20 backdrop-blur-sm rounded-b-2xl">
                <div className="p-4 lg:p-6">
                  <div className="max-w-4xl mx-auto">
                    {/* API Key Warning */}
                    {getAgentsRequiringApiKey().length > 0 && !areAllRequiredApiKeysSelected && (
                      <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-4 mb-4 animate-in slide-in-from-bottom-2">
                        <div className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-amber-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-amber-200 font-medium text-sm mb-1">API Keys Required</h4>
                            <p className="text-amber-300/80 text-xs mb-3">
                              This service requires API keys to function. Please select the required API keys in the sidebar before proceeding.
                            </p>
                            <div className="space-y-1">
                              {getAgentsRequiringApiKey().map((agent) => (
                                <div key={agent.id} className="flex items-center space-x-2 text-xs text-amber-200/70">
                                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
                                  <span>{agent.name} requires {agent.type} API key</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <button
                            onClick={() => setStatsOpen(true)}
                            className="text-amber-400 hover:text-amber-300 transition-colors"
                            title="Open sidebar to configure API keys"
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

                    {/* Transcription info */}
                    {checkIfTranscriptionService() && !uploadedFile && (
                      <div className="bg-indigo-950/30 border border-indigo-800/30 rounded-lg p-3 text-indigo-200 mb-4">
                        <p className="text-xs text-indigo-300/80 flex items-center">
                          <LucideMic className="h-3 w-3 mr-2" />
                          Upload an audio or video file to get started with transcription
                        </p>
                      </div>
                    )}

                    {/* Chat Input Row */}
                    <div className="flex items-end space-x-3">
                      <div className="flex-1">{renderChatInput()}</div>

                      {/* Send Button */}
                      <Button
                        onClick={handleSubmit}
                        disabled={
                          isLoading ||
                          (getFileUploadAgents().length > 0
                            ? getFileUploadAgents()[0].type === "rag"
                              ? !userInput?.trim() || !areAllRequiredApiKeysSelected
                              : !uploadedFile
                            : !areAllRequiredApiKeysSelected || !userInput?.trim())
                        }
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold p-3 rounded-2xl shadow-lg transition-all flex items-center justify-center min-w-[48px] h-[48px]"
                      >
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRightIcon className="h-5 w-5" />}
                      </Button>
                    </div>

                    
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Workflow Visualization - Compact at bottom */}
          <div className="p-4 lg:p-6 pt-0">
            <div className="bg-black/30 backdrop-blur-sm rounded-xl border border-purple-900/20 p-3 lg:p-4">
              <h3 className="text-lg font-semibold text-white mb-3 text-center">
                Workflow
              </h3>
              <div className="overflow-x-auto">
                <div className="flex justify-center min-w-fit scale-75 lg:scale-90 origin-center">
                  {renderWorkflow()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
