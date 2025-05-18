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
      } catch (error) {
        console.error("Error fetching service:", error);
        setError("Failed to load service details");
      } finally {
        setIsServiceLoading(false);
      }
    };
  
    fetchService();
  }, [serviceId, isAuthenticated]);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
    }
  }

  // Add state for API keys
  const [apiKeys, setApiKeys] = useState<{[agentId: number]: string}>({});
  const [availableApiKeys, setAvailableApiKeys] = useState<{[provider: string]: {id: string, name: string}[]}>({});
  
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
        const groupedKeys: {[provider: string]: {id: string, name: string}[]} = {};
        
        data.forEach((key: any) => {
          if (!groupedKeys[key.provider]) {
            groupedKeys[key.provider] = [];
          }
          groupedKeys[key.provider].push({
            id: key.id,
            name: key.name || `${key.provider.charAt(0).toUpperCase() + key.provider.slice(1)} Key ${key.id}`
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
      // Check if agent type requires API key based on our list from backend
      if (node.agent_type && AGENT_TYPES_REQUIRING_API_KEY.includes(node.agent_type.toLowerCase())) {
        agents.push({
          id: node.agent_id,
          name: node.agent_name || `Agent ${node.agent_id}`,
          type: node.agent_type.toLowerCase(),
          nodeId
        });
      }
    });
    
    console.log("Agents requiring API key:", agents);
    return agents;
  }, [service?.workflow]);
  
  // Check if all required API keys are selected
  const areAllRequiredApiKeysSelected = useCallback(() => {
    const requiredAgents = getAgentsRequiringApiKey();
    if (requiredAgents.length === 0) return true;
    
    return requiredAgents.every(agent => apiKeys[agent.id]);
  }, [apiKeys, getAgentsRequiringApiKey]);
  
  // Handle API key selection
  const handleApiKeyChange = (agentId: number, keyId: string) => {
    setApiKeys(prev => ({
      ...prev,
      [agentId]: keyId
    }));
  };

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
          api_keys: apiKeys
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
        if (Object.keys(apiKeys).length > 0) {
          body.append("api_keys", JSON.stringify(apiKeys));
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

  // Render workflow visualization
  const renderWorkflow = () => {
    if (!service?.workflow?.nodes) return null;
    
    // Function to get nodes in order
    const getOrderedNodes = () => {
      const nodes = service.workflow.nodes;
      const orderedNodes: any[] = [];
      
      // Find starting node
      let currentNodeId = Object.keys(nodes).find(id => {
        // A starting node is typically not referenced as "next" in any other node
        return !Object.values(nodes).some(node => node.next === id);
      });
      
      // If no starting node found, just use the first node
      if (!currentNodeId && Object.keys(nodes).length > 0) {
        currentNodeId = Object.keys(nodes)[0];
      }
      
      // Traverse the linked nodes
      while (currentNodeId) {
        const node = nodes[currentNodeId];
        if (!node) break;
        
        // Log the node structure to debug
        console.log(`Node ${currentNodeId}:`, node);
        
        orderedNodes.push({
          id: currentNodeId,
          ...node
        });
        
        currentNodeId = node.next as string | undefined;
      }
      
      return orderedNodes;
    };
    
    const orderedNodes = getOrderedNodes();
    console.log("Ordered nodes:", orderedNodes);
    
    return (
      <div className="mt-6 overflow-x-auto pb-4">
        <div className="flex flex-col space-y-8 min-w-fit">
          {orderedNodes.map((node, index) => (
            <div key={node.id} className="flex flex-col">
              <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-purple-900/30 p-4">
                <h3 className="font-semibold text-white text-sm">
                  {node.agent_name || `Agent ${node.agent_id}`}
                </h3>
                <p className="text-gray-400 text-xs mt-1">
                  {node.agent_description || "No description available"}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="text-xs bg-purple-900/40 text-purple-300 px-2 py-1 rounded-full">
                    Type: {node.agent_type || "Unknown"}
                  </span>
                  <span className="text-xs bg-blue-900/40 text-blue-300 px-2 py-1 rounded-full">
                    ID: {node.agent_id}
                  </span>
                  {AGENT_TYPES_REQUIRING_API_KEY.includes(node.agent_type?.toLowerCase() || "") && (
                    <span className="text-xs bg-amber-900/40 text-amber-300 px-2 py-1 rounded-full">
                      Requires API Key
                    </span>
                  )}
                </div>
              </div>
              
              {index < orderedNodes.length - 1 && (
                <div className="flex justify-center my-1">
                  <ArrowRightIcon className="h-5 w-5 text-purple-400 rotate-90" />
                </div>
              )}
            </div>
          ))}
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
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black">
      <NavBar />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              className="text-gray-400 hover:text-white"
              onClick={() => router.push("/apps")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            
            <Button
              variant="outline"
              className="text-red-400 hover:text-red-300 border-red-900/30 hover:bg-red-950/30"
              onClick={handleDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Service
            </Button>
          </div>

          {/* Service header with gradient background */}
          <div className={`bg-gradient-to-r ${getServiceColor()} rounded-xl p-6 mb-8`}>
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <Wand2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{service?.name}</h2>
                <p className="text-white/80 mt-1">{service?.description}</p>
                <div className="flex items-center mt-2 space-x-2">
                  <span className="text-xs bg-black/30 text-white px-2 py-1 rounded-full">
                    Input: {service?.input_type}
                  </span>
                  <span className="text-xs bg-black/30 text-white px-2 py-1 rounded-full">
                    Output: {service?.output_type}
                  </span>
                </div>

                {/* Usage stats */}
                {(service?.average_token_usage || service?.run_time !== undefined) && (
                  <div className="mt-3 pt-2 border-t border-white/20">
                    <h3 className="text-sm text-white/90 mb-1">Service Stats:</h3>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {service?.run_time !== undefined && (
                        <div className="text-xs bg-black/30 p-2 rounded">
                          <span className="block text-white/70">Avg. Run Time</span>
                          <span className="text-white font-medium">{Math.round(service.run_time)}</span>
                        </div>
                      )}
                      {service?.average_token_usage && (
                        <>
                          <div className="text-xs bg-black/30 p-2 rounded">
                            <span className="block text-white/70">Prompt Tokens</span>
                            <span className="text-white font-medium">{Math.round(service.average_token_usage.prompt_tokens)}</span>
                          </div>
                          <div className="text-xs bg-black/30 p-2 rounded">
                            <span className="block text-white/70">Completion Tokens</span>
                            <span className="text-white font-medium">{Math.round(service.average_token_usage.completion_tokens)}</span>
                          </div>
                          <div className="text-xs bg-black/30 p-2 rounded">
                            <span className="block text-white/70">Total Tokens</span>
                            <span className="text-white font-medium">{Math.round(service.average_token_usage.total_tokens)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main content with workflow visualization */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input/Output section - 2/3 of the screen on large displays */}
            <Card className="bg-black/40 backdrop-blur-sm border border-purple-900/30 p-6 md:p-8 lg:col-span-2">
              {/* Input section */}
              <div className="space-y-6 mb-8">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-200">
                    {service?.input_type === "text"
                      ? "Your Input"
                      : `${(service?.input_type || "").charAt(0).toUpperCase() + (service?.input_type || "").slice(1)} Input`}
                  </label>
                  {renderInput()}
                </div>

                {/* API Key Selection */}
                {getAgentsRequiringApiKey().length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-purple-800/50 mt-6 bg-purple-900/10 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-purple-300">Required API Keys</h3>
                    <p className="text-xs text-gray-400 mb-3">
                      This service requires API keys for the following agents:
                    </p>
                    
                    {getAgentsRequiringApiKey().map(agent => (
                      <div key={agent.id} className="space-y-2 bg-black/30 p-3 rounded-lg">
                        <label className="text-xs font-medium text-purple-200 flex items-center">
                          <span className="inline-block w-3 h-3 rounded-full bg-purple-500 mr-2"></span>
                          Select API Key for {agent.name} ({agent.type})
                        </label>
                        <Select
                          value={apiKeys[agent.id] || ""}
                          onValueChange={(value) => handleApiKeyChange(agent.id, value)}
                        >
                          <SelectTrigger className="bg-black/40 border-purple-900/30 text-white">
                            <SelectValue placeholder={`Select ${agent.type} API Key`} />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-950 border-purple-900/30 text-white">
                            {availableApiKeys[agent.type]?.length > 0 ? (
                              availableApiKeys[agent.type]?.map(key => (
                                <SelectItem key={key.id} value={key.id} className="hover:bg-zinc-800">
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
                    ))}
                    
                    {Object.keys(availableApiKeys).length === 0 && (
                      <div className="text-amber-400 text-xs p-2 bg-amber-900/20 rounded-md">
                        No API keys available. Please add API keys in your settings.
                      </div>
                    )}
                  </div>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || (!userInput && !uploadedFile) || !areAllRequiredApiKeysSelected()}
                  className={`bg-gradient-to-r ${getServiceColor()} text-white hover:opacity-90`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Run Service"
                  )}
                </Button>
              </div>

              {/* Output section */}
              {(result || error) && <div className="mt-8">{renderOutput()}</div>}
            </Card>

            {/* Workflow visualization - 1/3 of the screen on large displays */}
            <Card className="bg-black/40 backdrop-blur-sm border border-purple-900/30 p-6 lg:row-start-1">
              <h3 className="text-lg font-medium text-white mb-4">Workflow Visualization</h3>
              <p className="text-gray-400 text-sm mb-4">
                This diagram shows how agents are connected in this service.
              </p>
              {renderWorkflow()}
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
