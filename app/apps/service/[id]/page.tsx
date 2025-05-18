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

 * 
 * API Endpoints Used:
 * ------------------
 * - GET    /api/v1/mini-services/{id} - Fetch service details
 * - POST   /api/v1/mini-services/{id}/run - Run service
 * - DELETE /api/v1/mini-services/{id} - Delete service
 * - GET    /api/v1/mini-services/audio/{processId} - Get audio output
 * 

 */

"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import Cookies from "js-cookie"
import { NavBar } from "@/components/nav-bar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, ArrowLeft, Wand2, ImageIcon, Headphones, FileText, Video, Trash2, ArrowRightIcon } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { deleteMiniService } from "@/lib/services"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface MiniService {
  id: number
  name: string
  description: string
  workflow: {
    nodes: {
      [key: string]: {
        agent_id: number;
        agent_name?: string;
        agent_description?: string;
        agent_type?: string;
        next: string | null;
      }
    }
  };
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
  id: number;
  name: string;
  system_instruction?: string;
  agent_type: string;
  config?: any;
  input_type: string;
  output_type: string;
  owner_id: number;
  created_at: string;
  is_enhanced: boolean;
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
  const [agentDetails, setAgentDetails] = useState<{[id: number]: AgentDetails}>({});
  // Add state for expanded descriptions
  const [expandedDescriptions, setExpandedDescriptions] = useState<{[nodeId: string]: boolean}>({});
  
  // Authentication check
  useEffect(() => {
    const checkAuth = () => {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        Cookies.get("accessToken");
  
      const userId = Cookies.get("user_id"); // Debug: Check if user_id is available
      console.log("Auth check - Token:", !!token, "User ID:", userId); // Debug log
  
      if (token) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        router.push("/auth/login");
      }
    };
  
    checkAuth();
  }, [router]);

  // Fetch service details
  useEffect(() => {
    if (!serviceId || !isAuthenticated) return;
  
    const fetchService = async () => {
      try {
        setIsServiceLoading(true);
        const currentUserId = Cookies.get("user_id") || "0";
  
        console.log("Fetching service details for ID:", serviceId);
  
        const response = await fetch(
          `http://127.0.0.1:8000/api/v1/mini-services/${serviceId}?current_user_id=${currentUserId}`
        );
  
        if (!response.ok) {
          if (response.status === 404) {
            // Service not found, redirect to apps page
            window.location.href = "/apps";
            return;
          }
          throw new Error("Service not found");
        }
  
        const data = await response.json();
        console.log("Loaded service data:", {
          id: data.id,
          name: data.name,
          workflow: data.workflow,
          api_key: data.api_key ? "present" : "not present",
          api_key_id: data.api_key_id,
          workflow_first_node: data.workflow?.nodes ? Object.keys(data.workflow.nodes)[0] : null,
          workflow_nodes_count: data.workflow?.nodes ? Object.keys(data.workflow.nodes).length : 0,
          workflow_sample_node: data.workflow?.nodes ? data.workflow.nodes[Object.keys(data.workflow.nodes)[0]] : null,
          average_token_usage: data.average_token_usage,
          run_time: data.run_time
        });
        
        setService(data);
        
        // After setting the service, fetch detailed agent information
        if (data.workflow?.nodes) {
          await fetchAgentDetails(data.workflow.nodes);
        }
      } catch (error) {
        console.error("Error fetching service:", error);
        setError("Failed to load service details");
      } finally {
        setIsServiceLoading(false);
      }
    };
  
    fetchService();
  }, [serviceId, isAuthenticated]);

  // New function to fetch detailed agent information
  const fetchAgentDetails = async (nodes: any) => {
    try {
      const agentIds = Object.values(nodes).map((node: any) => node.agent_id);
      const uniqueAgentIds = [...new Set(agentIds)];
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken") || Cookies.get("accessToken");
      const currentUserId = Cookies.get("user_id") || "0";
      
      console.log("Fetching details for agents:", uniqueAgentIds);
      
      const agentDetailsMap: {[id: number]: AgentDetails} = {};
      
      await Promise.all(
        uniqueAgentIds.map(async (agentId: number) => {
          try {
            const response = await fetch(
              `http://127.0.0.1:8000/api/v1/agents/${agentId}?current_user_id=${currentUserId}`,
              {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              }
            );
            
            if (!response.ok) {
              console.warn(`Could not fetch details for agent ${agentId}: ${response.statusText}`);
              return;
            }
            
            const agentData = await response.json();
            agentDetailsMap[agentId] = agentData;
            console.log(`Fetched details for agent ${agentId}:`, agentData);
          } catch (error) {
            console.error(`Error fetching agent ${agentId} details:`, error);
          }
        })
      );
      
      setAgentDetails(agentDetailsMap);
      
      // Update API key requirements based on agent types
      updateRequiredApiKeys(agentDetailsMap);
    } catch (error) {
      console.error("Error fetching agent details:", error);
    }
  };
  
  // Function to update required API keys based on agent details
  const updateRequiredApiKeys = (agents: {[id: number]: AgentDetails}) => {
    // We'll enhance our API key management based on detailed agent information
    const initialApiKeyState: {[agentId: number]: string} = {};
    
    Object.entries(agents).forEach(([agentId, details]) => {
      if (AGENT_TYPES_REQUIRING_API_KEY.includes(details.agent_type.toLowerCase())) {
        initialApiKeyState[Number(agentId)] = "";
      }
    });
    
    // Only update if we have new API key requirements
    if (Object.keys(initialApiKeyState).length > 0) {
      setApiKeys(prev => ({...prev, ...initialApiKeyState}));
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
    }
  }

  // Add state for API keys (store key id, not api_key value)
  const [apiKeys, setApiKeys] = useState<{[agentId: number]: string}>({});
  const [availableApiKeys, setAvailableApiKeys] = useState<{[provider: string]: {id: string, name: string, api_key: string}[]}>({});
  
  // Fetch available API keys
  useEffect(() => {
    const fetchApiKeys = async () => {
      if (!isAuthenticated) return;
      
      try {
        const token = localStorage.getItem("token") || localStorage.getItem("accessToken") || Cookies.get("accessToken");
        const currentUserId = Cookies.get("user_id");
        
        const response = await fetch(
          `http://127.0.0.1:8000/api/v1/api-keys?current_user_id=${currentUserId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        if (!response.ok) throw new Error("Failed to fetch API keys");
        
        const data = await response.json();
        const groupedKeys: {[provider: string]: {id: string, name: string, api_key: string}[]} = {};
        
        data.forEach((key: any) => {
          if (!groupedKeys[key.provider]) {
            groupedKeys[key.provider] = [];
          }
          groupedKeys[key.provider].push({
            id: key.id,
            name: key.name || `${key.provider.charAt(0).toUpperCase() + key.provider.slice(1)} Key ${key.id}`,
            api_key: key.api_key // Store the actual API key value
          });
        });
        
        setAvailableApiKeys(groupedKeys);
      } catch (error) {
        console.error("Error fetching API keys:", error);
      }
    };
    
    fetchApiKeys();
  }, [isAuthenticated]);
  
  // Add a list of agent types that require API keys based on backend data
  const AGENT_TYPES_REQUIRING_API_KEY = [
    "gemini",
    "openai",
    "gemini_text2image",
    "custom_endpoint_llm"
  ];

  // Function to extract agents that require API keys
  const getAgentsRequiringApiKey = useCallback(() => {
    if (!service?.workflow?.nodes) return [];
    
    const agents: {id: number, name: string, type: string, nodeId: string}[] = [];
    
    Object.entries(service.workflow.nodes).forEach(([nodeId, node]) => {
      const agentId = node.agent_id;
      const agentDetail = agentDetails[agentId];
      
      // If we have detailed agent info, use it to determine if API key is required
      if (agentDetail && AGENT_TYPES_REQUIRING_API_KEY.includes(agentDetail.agent_type.toLowerCase())) {
        agents.push({
          id: agentId,
          name: agentDetail.name || `Agent ${agentId}`,
          type: agentDetail.agent_type.toLowerCase(),
          nodeId
        });
      } 
      // Fallback to the basic node info if detailed info not available
      else if (node.agent_type && AGENT_TYPES_REQUIRING_API_KEY.includes(node.agent_type.toLowerCase())) {
        agents.push({
          id: agentId,
          name: node.agent_name || `Agent ${agentId}`,
          type: node.agent_type.toLowerCase(),
          nodeId
        });
      }
    });
    
    console.log("Agents requiring API key:", agents);
    return agents;
  }, [service?.workflow, agentDetails]);
  
  // Check if all required API keys are selected
  const areAllRequiredApiKeysSelected = useCallback(() => {
    const requiredAgents = getAgentsRequiringApiKey();
    if (requiredAgents.length === 0) return true;

    // Debug output
    console.log("[DEBUG] Required agents:", requiredAgents);
    console.log("[DEBUG] apiKeys state:", apiKeys);
    console.log("[DEBUG] availableApiKeys:", availableApiKeys);

    // Check for each required agent if a valid key is selected
    const allSelected = requiredAgents.every(agent => {
      const selectedKeyId = apiKeys[agent.id];
      if (!selectedKeyId) return false;
      // Must match an available key for this agent type
      const found = availableApiKeys[agent.type]?.some(key => key.id === selectedKeyId);
      if (!found) {
        console.log(`[DEBUG] No valid key found for agent ${agent.id} (${agent.type}) with selectedKeyId:`, selectedKeyId);
      }
      return found;
    });
    console.log("[DEBUG] All required API keys selected:", allSelected);
    return allSelected;
  }, [apiKeys, getAgentsRequiringApiKey, availableApiKeys]);
  
  // Handle API key selection (store key id)
  const handleApiKeyChange = (agentId: number, keyId: string) => {
    setApiKeys(prev => ({
      ...prev,
      [agentId]: keyId
    }));
  };

  // Move getApiKeysForBackend inside ServicePage and make it always use latest state
  const getApiKeysForBackend = () => {
    const result: {[agentId: number]: string} = {};
    const requiredAgents = getAgentsRequiringApiKey();
    requiredAgents.forEach(agent => {
      const keyId = apiKeys[agent.id];
      if (keyId) {
        const keyObj = (availableApiKeys[agent.type] || []).find(k => k.id === keyId);
        if (keyObj) {
          result[agent.id] = keyObj.api_key;
        } else {
          console.warn("[getApiKeysForBackend] No keyObj found for agent", agent, "with keyId", keyId);
        }
      } else {
        console.warn("[getApiKeysForBackend] No keyId for agent", agent);
      }
    });
    console.log("[getApiKeysForBackend] Result:", result);
    return result;
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!service || (!userInput && !uploadedFile)) return;


    setIsLoading(true);
    setResult(null);
    setError(null);
  
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken") || Cookies.get("accessToken");
      if (!token) {
        throw new Error("Authentication token not found");
      }
  
      const currentUserId = Cookies.get("user_id");
      if (!currentUserId) {
        throw new Error("User ID not found");
      }
  
      // Prepare request headers
      const headers: Record<string, string> = {
        "Authorization": `Bearer ${token}`,
      };
  
      // Prepare request body
      let body: FormData | string;
      if (service.input_type === "text") {
        const bodyData = { 
          input: userInput,
          api_keys: getApiKeysForBackend()
        };
        body = JSON.stringify(bodyData);
        console.log("Request body:", {
          ...bodyData,
          api_keys: Object.keys(bodyData.api_keys).length > 0 ? "present" : "not present",
        });
        headers["Content-Type"] = "application/json";
      } else if (uploadedFile) {
        body = new FormData();
        body.append("file", uploadedFile);
        if (userInput) {
          body.append("input", userInput);
        }
        
        // Add API keys to form data
        const backendKeys = getApiKeysForBackend();
        if (Object.keys(backendKeys).length > 0) {
          body.append("api_keys", JSON.stringify(backendKeys));
        }
      } else {
        throw new Error("No input provided");
      }
  
      // Make the API request
      const response = await fetch(
        `http://127.0.0.1:8000/api/v1/mini-services/${serviceId}/run?current_user_id=${currentUserId}`,
        {
          method: "POST",
          headers,
          body,
        }
      );
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("Backend error details:", {
          status: response.status,
          statusText: response.statusText,
          errorData,
          headers: response.headers,
        });
        
        throw new Error(
          errorData?.detail || 
          `Server error: ${response.status} ${response.statusText}`
        );
      }
  
      const data = await response.json();
      console.log("Service response:", data);
      setResult(data);
    } catch (err) {
      console.error("Error running service:", err);
      setError(
        err instanceof Error 
          ? err.message 
          : "An unexpected error occurred while processing your request"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle service deletion
  const handleDelete = async () => {
    if (!service?.id) return;
    
    await deleteMiniService(service.id, {
      showToast: true,
      onSuccess: () => {
        router.refresh();
        router.push("/apps");
      }
    });
  };

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

  // Extract audio URL from result
  const extractAudioUrl = (result: any): string | null => {
    if (!result || !result.process_id) return null;

    const userId = Cookies.get("user_id");
    if (!userId) return null;

    // Construct the base URL for audio endpoint
    return `http://127.0.0.1:8000/api/v1/mini-services/audio/${result.process_id}?current_user_id=${userId}`;
  };

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

  // Render input based on service type
  const renderInput = () => {
    if (!service) return null

    switch (service.input_type) {
      case "text":
        return (
          <Textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Enter your text input here..."
            className="bg-black/40 border-purple-900/30 text-white min-h-[150px]"
          />
        )

      case "image":
        return (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-purple-900/50 rounded-lg p-6 text-center hover:border-purple-500/50 transition-colors cursor-pointer">
              <ImageIcon className="h-8 w-8 mx-auto text-purple-400 mb-2" />
              <p className="text-gray-400 text-sm">Drag and drop an image here, or click to select</p>
              <p className="text-gray-500 text-xs mt-1">Supports JPG, PNG, WebP up to 5MB</p>
              <input type="file" accept="image/*" className="hidden" id="image-upload" onChange={handleFileUpload} />
              <Button
                onClick={() => document.getElementById("image-upload")?.click()}
                variant="outline"
                className="mt-4 border-purple-900/30 text-white"
              >
                Select Image
              </Button>
            </div>
            {uploadedFile && <div className="text-sm text-gray-300">Selected: {uploadedFile.name}</div>}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Additional Description (Optional)</label>
              <Input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Add any additional context..."
                className="bg-black/40 border-purple-900/30 text-white"
              />
            </div>
          </div>
        )

      case "sound":
        return (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-purple-900/50 rounded-lg p-6 text-center hover:border-purple-500/50 transition-colors cursor-pointer">
              <Headphones className="h-8 w-8 mx-auto text-purple-400 mb-2" />
              <p className="text-gray-400 text-sm">Drag and drop an audio file here, or click to select</p>
              <p className="text-gray-500 text-xs mt-1">Supports MP3, WAV, M4A up to 10MB</p>
              <input type="file" accept="audio/*" className="hidden" id="audio-upload" onChange={handleFileUpload} />
              <Button
                onClick={() => document.getElementById("audio-upload")?.click()}
                variant="outline"
                className="mt-4 border-purple-900/30 text-white"
              >
                Select Audio
              </Button>
            </div>
            {uploadedFile && <div className="text-sm text-gray-300">Selected: {uploadedFile.name}</div>}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Additional Instructions (Optional)</label>
              <Input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Add any additional instructions..."
                className="bg-black/40 border-purple-900/30 text-white"
              />
            </div>
          </div>
        )

      case "video":
        return (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-purple-900/50 rounded-lg p-6 text-center hover:border-purple-500/50 transition-colors cursor-pointer">
              <Video className="h-8 w-8 mx-auto text-purple-400 mb-2" />
              <p className="text-gray-400 text-sm">Drag and drop a video here, or click to select</p>
              <p className="text-gray-500 text-xs mt-1">Supports MP4, WebM, MOV up to 50MB</p>
              <input type="file" accept="video/*" className="hidden" id="video-upload" onChange={handleFileUpload} />
              <Button
                onClick={() => document.getElementById("video-upload")?.click()}
                variant="outline"
                className="mt-4 border-purple-900/30 text-white"
              >
                Select Video
              </Button>
            </div>
            {uploadedFile && <div className="text-sm text-gray-300">Selected: {uploadedFile.name}</div>}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Additional Instructions (Optional)</label>
              <Input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Add any additional instructions..."
                className="bg-black/40 border-purple-900/30 text-white"
              />
            </div>
          </div>
        )

      case "document":
        return (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-purple-900/50 rounded-lg p-6 text-center hover:border-purple-500/50 transition-colors cursor-pointer">
              <FileText className="h-8 w-8 mx-auto text-purple-400 mb-2" />
              <p className="text-gray-400 text-sm">Drag and drop a document here, or click to select</p>
              <p className="text-gray-500 text-xs mt-1">Supports PDF, DOCX, TXT up to 10MB</p>
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                className="hidden"
                id="document-upload"
                onChange={handleFileUpload}
              />
              <Button
                onClick={() => document.getElementById("document-upload")?.click()}
                variant="outline"
                className="mt-4 border-purple-900/30 text-white"
              >
                Select Document
              </Button>
            </div>
            {uploadedFile && <div className="text-sm text-gray-300">Selected: {uploadedFile.name}</div>}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">Additional Instructions (Optional)</label>
              <Input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Add any additional context..."
                className="bg-black/40 border-purple-900/30 text-white"
              />
            </div>
          </div>
        )

      default:
        return (
          <Textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Enter your input here..."
            className="bg-black/40 border-purple-900/30 text-white min-h-[150px]"
          />
        )
    }
  }

  // Render output based on service type and result
  const renderOutput = () => {
    if (!result) return null;

    // Handle error display
    if (error) {
      return (
        <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4">
          <p className="text-red-300">{error}</p>
        </div>
      );
    }

    // Determine what to display based on output type
    switch (service?.output_type) {
      case "text":
        const textOutput = result.final_output || result.output || result.results?.[0]?.output;
        return (
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-purple-900/30 p-6">
            <h3 className="text-lg font-medium text-white mb-4">Result</h3>
            <div className="whitespace-pre-wrap text-gray-300">
              {textOutput || "No output available"}
            </div>
          </div>
        );

      case "sound":
        const audioUrl = extractAudioUrl(result);

        return (
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-purple-900/30 p-6">
            <h3 className="text-lg font-medium text-white mb-4">Audio Result</h3>
            {audioUrl ? (
              <div>
                <div className="mt-4">
                  <audio 
                    controls 
                    className="w-full" 
                    key={audioUrl}
                    onError={(e) => {
                      console.error("Audio playback error:", e);
                      toast({
                        title: "Error",
                        description: "Failed to play audio. Please try downloading the file.",
                        variant: "destructive",
                      });
                    }}
                  >
                    <source src={audioUrl} type="audio/mp3" />
                    Your browser does not support the audio element.
                  </audio>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => window.open(audioUrl, "_blank")}
                  >
                    Download Audio
                  </Button>
                </div>

                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-4 pt-4 border-t border-purple-900/30">
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
              <p className="text-gray-400">No audio output available</p>
            )}
          </div>
        );

      case "image":
        const imageUrl = result.image_url || result.final_output
        return (
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-purple-900/30 p-6">
            <h3 className="text-lg font-medium text-white mb-4">Generated Image</h3>
            {imageUrl && (
              <div className="mt-4 flex justify-center">
                <img
                  src={imageUrl.startsWith("http") ? imageUrl : `http://127.0.0.1:8000${imageUrl}`}
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
    if (!service?.workflow?.nodes) return null;

    // Get nodes in order
    const getOrderedNodes = () => {
      const nodes = service.workflow.nodes;
      const orderedNodes: any[] = [];
      let currentNodeId = Object.keys(nodes).find(id => !Object.values(nodes).some(node => node.next === id));
      if (!currentNodeId && Object.keys(nodes).length > 0) currentNodeId = Object.keys(nodes)[0];
      while (currentNodeId) {
        const node = nodes[currentNodeId];
        if (!node) break;
        const agentDetail = node.agent_id ? agentDetails[node.agent_id] : null;
        orderedNodes.push({
          id: currentNodeId,
          ...node,
          agent_name: agentDetail?.name || node.agent_name || `Agent ${node.agent_id}`,
          agent_description: agentDetail?.system_instruction || node.agent_description || "No description available",
          agent_type: agentDetail?.agent_type || node.agent_type || "Unknown",
          agent_config: agentDetail?.config,
          agent_input_type: agentDetail?.input_type,
          agent_output_type: agentDetail?.output_type,
        });
        currentNodeId = node.next as string | undefined;
      }
      return orderedNodes;
    };
    const orderedNodes = getOrderedNodes();
    
    // Get card color based on agent type
    const getAgentColor = (type: string) => {
      type = type.toLowerCase();
      if (type.includes('gemini')) return 'from-blue-600/20 to-blue-900/30';
      if (type.includes('openai')) return 'from-green-600/20 to-green-900/30';
      if (type.includes('image')) return 'from-purple-600/20 to-purple-900/30';
      if (type.includes('text')) return 'from-pink-600/20 to-pink-900/30';
      if (type.includes('audio')) return 'from-orange-600/20 to-orange-900/30';
      if (type.includes('video')) return 'from-red-600/20 to-red-900/30';
      return 'from-indigo-600/20 to-indigo-900/30';
    };

    return (
      <div className="relative bg-black/20 border border-purple-900/20 backdrop-blur-sm rounded-xl p-6 mb-2">
        {/* Flow line connector - continuous line through all nodes */}
        <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 bg-gradient-to-r from-purple-500/10 via-indigo-500/30 to-purple-500/10 z-0"></div>
        
        <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-purple-900/30 hover:scrollbar-thumb-purple-600/50">
          <div className="flex items-stretch gap-16 min-w-fit py-4">
            {orderedNodes.map((node, idx) => {
              const description = node.agent_description || "";
              const isLongDescription = description.length > 100;
              const isExpanded = expandedDescriptions[node.id];
              const agentColor = getAgentColor(node.agent_type);
              
              return (
                <div key={node.id} className="relative flex flex-col items-center group">
                  {/* Node number indicator above card */}
                 
                  
                  {/* Card */}
                  <div 
                    className={`
                      transition-all duration-300 bg-gradient-to-br from-zinc-900 to-zinc-950 
                      border-2 border-purple-900/30 rounded-xl shadow-[0_4px_20px_rgba(107,70,193,0.2)]
                      px-5 py-4 w-64 z-10 hover:scale-105 hover:border-purple-500/60 
                      focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-black
                      cursor-pointer group/card origin-center
                      ${agentColor}
                    `}
                    tabIndex={0}
                    role="button"
                    aria-expanded={isExpanded}
                    onClick={() => setExpandedDescriptions(prev => ({ ...prev, [node.id]: !prev[node.id] }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setExpandedDescriptions(prev => ({ ...prev, [node.id]: !prev[node.id] }));
                      }
                    }}
                  >
                     <div className="absolute -top-3 bg-gradient-to-br from-purple-6 00 to-indigo-700 h-6 w-6 rounded-full flex items-center justify-center shadow-lg shadow-purple-900/20 z-100">
                    <span className="text-xs font-bold text-white">{idx + 1}</span>
                  </div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`h-8 w-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 
                        flex items-center justify-center shadow-inner text-xs text-white font-bold
                        transition-all group-hover/card:scale-110 group-hover/card:shadow-purple-500/30`}
                      >
                        {(() => {
                          const type = node.agent_type.toLowerCase();
                          // Select emoji based on agent type
                          if (type.includes('gemini') && type.includes('text2image')) {
                            return '🎨';
                          } else if (type.includes('gemini')) {
                            return '🤖';
                          } else if (type.includes('openai')) {
                            return '🤖';
                          } else if (type.includes('edge_tts') || type.includes('bark_tts')) {
                            return '🔊';
                          } else if (type.includes('transcribe')) {
                            return '🎤';
                          } else if (type.includes('text2image') || type.includes('gemini_text2image')) {
                            return '🖼️';
                          } else if (type.includes('internet_research')) {
                            return '🔍';
                          } else if (type.includes('document_parser')) {
                            return '📄';
                          } else if (type.includes('custom_endpoint')) {
                            return '🔌';
                          } else if (type.includes('audio')) {
                            return '🎵';
                          } else if (type.includes('video')) {
                            return '🎬';
                          } else {
                            // Fallback emoji
                            return '✨';
                          }
                        })()}
                      </div>
                      <h3 className="font-semibold text-white text-base truncate flex-1" title={node.agent_name}>
                        {node.agent_name}
                      </h3>
                    </div>
                    
                    <div className="text-gray-300 text-xs mt-1">
                      {isLongDescription ? (
                        <>
                          <div className={`overflow-hidden transition-all duration-300 ease-in-out
                            ${isExpanded ? "max-h-48" : "max-h-12"}`}
                          >
                            <p className={`leading-relaxed ${isExpanded ? "" : "line-clamp-2"}`}>
                              {description}
                            </p>
                          </div>
                          <button
                            onClick={e => { 
                              e.stopPropagation(); 
                              setExpandedDescriptions(prev => ({ ...prev, [node.id]: !prev[node.id] })); 
                            }}
                            className="text-purple-400 text-xs mt-1 hover:text-purple-300 focus:outline-none focus:text-purple-200 transition-colors"
                            aria-label={isExpanded ? "Show less" : "Show more"}
                          >
                            {isExpanded ? "Show less ↑" : "Show more ↓"}
                          </button>
                        </>
                      ) : (
                        <p className="leading-relaxed">{description}</p>
                      )}
                    </div>
                    
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="text-xs bg-purple-900/40 text-purple-300 px-2 py-1 rounded-full font-medium border border-purple-800/30">
                        {node.agent_type}
                      </span>
                      {node.agent_config?.model && (
                        <span className="text-xs bg-indigo-900/40 text-indigo-300 px-2 py-1 rounded-full font-medium border border-indigo-800/30">
                          {node.agent_config.model}
                        </span>
                      )}
                      {AGENT_TYPES_REQUIRING_API_KEY.includes(node.agent_type?.toLowerCase() || "") && (
                        <span className="text-xs bg-amber-900/40 text-amber-300 px-2 py-1 rounded-full font-medium flex items-center gap-1 border border-amber-800/30">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                          API Key
                        </span>
                      )}
                    </div>
                    
                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 -z-10 bg-gradient-to-r from-purple-600/0 via-purple-600/10 to-purple-600/0 opacity-0 blur-xl transition-opacity duration-500 group-hover/card:opacity-100"></div>
                  </div>
                  
                  {/* Arrow connection using SVG for better animation and style */}
                  {idx < orderedNodes.length - 1 && (
                    <div className="absolute right-[-58px] top-1/2 -translate-y-1/2 z-0 pointer-events-none">
                      <svg width="58" height="40" viewBox="0 0 58 40">
                        <defs>
                          <linearGradient id={`arrow-gradient-${idx}`} x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.4" />
                            <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.7" />
                            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.4" />
                          </linearGradient>
                        </defs>
                        <path 
                          d="M2,20 Q30,20 50,20" 
                          stroke={`url(#arrow-gradient-${idx})`} 
                          strokeWidth="2.5" 
                          fill="none"
                          strokeDasharray="5,3"
                          className="animate-pulse" 
                        />
                        <polygon points="50,20 45,16 45,24" fill="#8b5cf6" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Enhanced tooltip on hover with more detail and style */}
                  <div 
                    className="hidden group-hover/card:flex absolute left-1/2 -translate-x-1/2 top-full mt-4 z-30 
                    w-72 flex-col bg-zinc-900/95 backdrop-blur-md border border-purple-800/40 rounded-xl 
                    shadow-[0_10px_25px_-5px_rgba(0,0,0,0.8)] p-4 text-xs text-gray-200 transition-opacity 
                    duration-300 opacity-0 group-hover/card:opacity-100"
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 transform rotate-45 w-4 h-4 bg-zinc-900 border-t border-l border-purple-800/40"></div>
                    <div className="font-bold text-purple-300 text-sm mb-1 border-b border-purple-900/40 pb-2">{node.agent_name}</div>
                    <div className="mb-2 py-2 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-800/30">{description}</div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="bg-purple-900/40 text-purple-300 px-2 py-1 rounded-full">{node.agent_type}</span>
                      {node.agent_config?.model && (
                        <span className="bg-indigo-900/40 text-indigo-300 px-2 py-1 rounded-full">{node.agent_config.model}</span>
                      )}
                      {node.agent_input_type && node.agent_output_type && (
                        <span className="bg-green-900/40 text-green-300 px-2 py-1 rounded-full">{node.agent_input_type} → {node.agent_output_type}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Legend or helper text */}
        <div className="flex justify-center mt-4 text-xs text-gray-500">
          <p>Click on any node to see more details or scroll horizontally to view the entire workflow</p>
        </div>
      </div>
    );
  };

  if (isServiceLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black">
        <NavBar />
        <main className="pt-24 pb-16 px-4 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
        </main>
      </div>
    )
  }

  if (error && !service) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black">
        <NavBar />
        <main className="pt-24 pb-16 px-4">
          <div className="max-w-4xl mx-auto">
            <Button
              variant="ghost"
              className="mb-6 text-gray-400 hover:text-white"
              onClick={() => router.push("/apps")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>

            <Card className="bg-black/40 backdrop-blur-sm border border-purple-900/30 p-6 md:p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Service Not Found</h2>
              <p className="text-gray-400 mb-6">The requested service could not be found.</p>
              <Button
                onClick={() => router.push("/apps")}
                className="bg-purple-600 hover:bg-purple-700 text-white"
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
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/30 to-black">
      <NavBar />
      
      <main className="pt-24 pb-16 px-2 sm:px-4 flex flex-col items-center">
        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-8 gap-8">
          {/* Main Content */}
          <section className="lg:col-span-8 flex flex-col gap-8 w-full">
            {/* Service Header with Back button at top left */}
            <div className="flex flex-col gap-4">
              {/* Back to Dashboard button now at top left */}
              <div className="mb-1">
                <Button
                  variant="ghost"
                  className="text-gray-400 hover:text-white -ml-1"
                  onClick={() => router.push("/apps")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Button>
              </div>
              
              <Card className={`bg-gradient-to-r ${getServiceColor()} rounded-2xl p-8 shadow-xl border-0 flex flex-col gap-4`}>
                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                  <div className="w-16 h-16 rounded-full bg-black/30 flex items-center justify-center shadow-lg">
                    <Wand2 className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">{service?.name}</h1>
                    <p className="text-white/80 text-base mb-2">{service?.description}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs bg-black/40 text-white px-3 py-1 rounded-full font-medium">Input: {service?.input_type}</span>
                      <span className="text-xs bg-black/40 text-white px-3 py-1 rounded-full font-medium">Output: {service?.output_type}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <Button
                      variant="outline"
                      className="text-red-400 hover:text-red-300 border-red-900/30 hover:bg-red-950/30"
                      onClick={handleDelete}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete Service
                    </Button>
                  </div>
                </div>
                {/* Stats */}
                {(service?.average_token_usage || service?.run_time !== undefined) && (
                  <div className="mt-4 flex flex-wrap gap-4 border-t border-white/20 pt-4">
                    {service?.run_time !== undefined && (
                      <div className="text-xs bg-black/30 p-3 rounded-xl min-w-[120px]">
                        <span className="block text-white/70">Avg. Run Time</span>
                        <span className="text-white font-bold text-lg">{Math.round(service.run_time)}</span>
                      </div>
                    )}
                    {service?.average_token_usage && (
                      <>
                        <div className="text-xs bg-black/30 p-3 rounded-xl min-w-[120px]">
                          <span className="block text-white/70">Prompt Tokens</span>
                          <span className="text-white font-bold text-lg">{Math.round(service.average_token_usage.prompt_tokens)}</span>
                        </div>
                        <div className="text-xs bg-black/30 p-3 rounded-xl min-w-[120px]">
                          <span className="block text-white/70">Completion Tokens</span>
                          <span className="text-white font-bold text-lg">{Math.round(service.average_token_usage.completion_tokens)}</span>
                        </div>
                        <div className="text-xs bg-black/30 p-3 rounded-xl min-w-[120px]">
                          <span className="block text-white/70">Total Tokens</span>
                          <span className="text-white font-bold text-lg">{Math.round(service.average_token_usage.total_tokens)}</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </Card>
            </div>

            {/* Input & API Key Section */}
            <Card className="bg-zinc-950/80 border-0 rounded-2xl shadow-xl p-8 flex flex-col gap-8">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1 flex flex-col gap-6">
                  <div>
                    <label className="text-base font-semibold text-purple-200 mb-2 block">
                      {service?.input_type === "text"
                        ? "Your Input"
                        : `${(service?.input_type || "").charAt(0).toUpperCase() + (service?.input_type || "").slice(1)} Input`}
                    </label>
                    {renderInput()}
                  </div>
                  <div className="flex flex-col gap-4">
                    {getAgentsRequiringApiKey().length > 0 && (
                      <div className="rounded-xl border border-purple-900/40 bg-purple-950/30 p-5">
                        <h3 className="text-sm font-bold text-purple-300 mb-1">Required API Keys</h3>
                        <p className="text-xs text-gray-400 mb-4">This service requires API keys for the following agents:</p>
                        <div className="flex flex-col gap-4">
                          {getAgentsRequiringApiKey().map(agent => {
                            const selectedKeyId = apiKeys[agent.id] || "";
                            return (
                              <div key={agent.id} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 bg-black/40 p-3 rounded-lg border border-purple-900/20">
                                <div className="flex-1">
                                  <label className="text-xs font-semibold text-purple-200 flex items-center mb-1">
                                    <span className="inline-block w-3 h-3 rounded-full bg-purple-500 mr-2"></span>
                                    {agent.name} <span className="ml-2 text-purple-400">({agent.type})</span>
                                  </label>
                                  <Select
                                    value={selectedKeyId}
                                    onValueChange={(value) => handleApiKeyChange(agent.id, value)}
                                  >
                                    <SelectTrigger className="bg-black/40 border-purple-900/30 text-white">
                                      <SelectValue placeholder={`Select ${agent.type} API Key`} />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-950 border-purple-900/30 text-white">
                                      {availableApiKeys[agent.type]?.length > 0 ? (
                                        availableApiKeys[agent.type].map(key => (
                                          <SelectItem key={key.id} value={key.id}>
                                            {key.name}
                                          </SelectItem>
                                        ))
                                      ) : (
                                        <SelectItem value="none" disabled>
                                          No {agent.type} API keys available
                                        </SelectItem>
                                      )}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="mt-2 md:mt-0 text-xs min-w-[120px] text-right">
                                  <span className={selectedKeyId ? "text-green-400" : "text-amber-400"}>
                                    {selectedKeyId ? "Selected ✅" : "Not selected ❌"}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {Object.keys(availableApiKeys).length === 0 && (
                          <div className="text-amber-400 text-xs p-2 bg-amber-900/20 rounded-md mt-4">
                            No API keys available. Please add API keys in your settings.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-4 mt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || !areAllRequiredApiKeysSelected() || 
                    (service?.input_type === "text" && !userInput?.trim() && !uploadedFile) ||
                    (service?.input_type !== "text" && !uploadedFile && service?.input_type !== "text")}
                  className={`bg-gradient-to-r ${getServiceColor()} text-white font-bold text-lg px-8 py-3 rounded-xl shadow-lg hover:opacity-90 transition-all relative`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>Run Service</>
                  )}
                </Button>
              </div>
              {(result || error) && (
                <div className="mt-8">
                  <Card className="bg-black/60 border-0 rounded-xl p-6 shadow-lg">
                    {renderOutput()}
                  </Card>
                </div>
              )}
            </Card>
          </section>
        </div>

        {/* Workflow Visualization - now below the service, centered and wider */}
        <div className="w-full flex flex-col items-center mt-12">
          <Card className="bg-zinc-950/90 border-0 rounded-2xl shadow-xl p-6 w-full max-w-[1200px]">
            <h3 className="text-lg font-bold text-white mb-2 text-center">Workflow Visualization</h3>
            <p className="text-gray-400 text-xs mb-4 text-center">This diagram shows how agents are connected in this service.</p>
            <div className="w-full">
              {/* Fix overflow and improve scrollbar styling */}
              <div
                className="overflow-x-auto rounded-xl scrollbar-thin custom-wf-scrollbar"
                style={{ WebkitOverflowScrolling: 'touch', minHeight: '220px' }}
              >
                <div className="min-w-[900px] flex justify-center">
                  {renderWorkflow()}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}



