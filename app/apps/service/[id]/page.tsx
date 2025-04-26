"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Cookies from "js-cookie"
import { NavBar } from "@/components/nav-bar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, ArrowLeft, Wand2, ImageIcon, Headphones, FileText, Video } from "lucide-react"

interface MiniService {
  id: number
  name: string
  description: string
  workflow: any
  input_type: string
  output_type: string
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
        const currentUserId = Cookies.get("user_id") || "0"; // Fallback to "0" if undefined
  
        console.log("Using currentUserId for fetch:", currentUserId); // Debug log
  
        const response = await fetch(
          `http://127.0.0.1:8000/api/v1/mini-services/${serviceId}?current_user_id=${currentUserId}`
        );
  
        if (!response.ok) {
          throw new Error("Service not found");
        }
  
        const data = await response.json();
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

  // Handle form submission
  const handleSubmit = async () => {
    if (!service || (!userInput && !uploadedFile)) return;
  
    setIsLoading(true);
    setResult(null);
    setError(null);
  
    try {
      // Prepare form data for file uploads if needed
      const formData = new FormData();
  
      if (service.input_type === "text") {
        formData.append("input", userInput);
      } else if (uploadedFile) {
        formData.append("file", uploadedFile);
        if (userInput) {
          formData.append("input", userInput); // Additional text input if provided
        }
      }
  
      // Get current user ID from cookies
      const currentUserId = Cookies.get("user_id") || "0"; // Fallback to "0" if undefined
  
      console.log("Using currentUserId:", currentUserId); // Debug log
  
      // Call the service API with current_user_id parameter
      const response = await fetch(
        `http://127.0.0.1:8000/api/v1/mini-services/${serviceId}/run?current_user_id=${currentUserId}`,
        {
          method: "POST",
          body: service.input_type === "text" ? JSON.stringify({ input: userInput }) : formData,
          headers: service.input_type === "text" ? { "Content-Type": "application/json" } : {}, // No Content-Type header for multipart/form-data
        }
      );
  
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
  
      const data = await response.json();
      console.log("Service response:", data); // Debug log
      setResult(data);
    } catch (err) {
      console.error("Error running service:", err);
      setError("Failed to process your request. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
    if (!result) return null

    // Check all possible paths where the audio URL might be stored
    let audioPath = null

    // First check audio_urls array (most common in your JSON example)
    if (result.audio_urls && result.audio_urls.length > 0) {
      audioPath = result.audio_urls[0].audio_url
    }

    // If not found, check final_output
    if (!audioPath && result.final_output) {
      audioPath = result.final_output
    }

    // If not found, check in results array
    if (!audioPath && result.results && result.results.length > 0) {
      // Try to find the TTS agent result (usually the last one)
      const ttsResult = result.results.find(
        (r: any) => r.raw?.agent_type === "tts" || r.agent_id === 1, // Assuming agent_id 1 is the TTS agent
      )

      if (ttsResult) {
        audioPath = ttsResult.output || ttsResult.raw?.audio_url || ttsResult.raw?.audio_file
      }
    }

    if (!audioPath) return null

    // Extract the filename from the path
    const filename = audioPath.split("/").pop()

    if (!filename) return null

    // Construct the full URL to the audio file
    return `http://127.0.0.1:8000/api/v1/audio/${filename}`
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
    if (!result) return null

    // Handle error display
    if (error) {
      return (
        <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4">
          <p className="text-red-300">{error}</p>
        </div>
      )
    }

    // Determine what to display based on output type
    switch (service?.output_type) {
      case "text":
        return (
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-purple-900/30 p-6">
            <h3 className="text-lg font-medium text-white mb-4">Result</h3>
            <div className="whitespace-pre-wrap text-gray-300">
              {result.final_output || result.output || result.results?.[0]?.output || "No output available"}
            </div>
          </div>
        )

      case "sound":
        const audioUrl = extractAudioUrl(result)
        console.log("Extracted Audio URL:", audioUrl) // Debug log

        return (
          <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-purple-900/30 p-6">
            <h3 className="text-lg font-medium text-white mb-4">Audio Result</h3>
            {audioUrl ? (
              <div>
                {/* Native audio element (hidden but functional) */}
                <audio
                  id="audio-element"
                  src={audioUrl}
                  className="hidden"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                />

                {/* Custom audio player UI */}
                <div className="bg-black/30 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-full bg-purple-600 hover:bg-purple-700 border-none"
                      onClick={() => {
                        const audioElement = document.getElementById("audio-element") as HTMLAudioElement
                        if (isPlaying) {
                          audioElement.pause()
                        } else {
                          audioElement.play().catch((err) => {
                            console.error("Error playing audio:", err)
                            setError("Failed to play audio. Please try again.")
                          })
                        }
                      }}
                    >
                      {isPlaying ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-white"
                        >
                          <rect x="6" y="4" width="4" height="16"></rect>
                          <rect x="14" y="4" width="4" height="16"></rect>
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-white"
                        >
                          <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                      )}
                    </Button>
                    <div>
                      <p className="text-sm text-white">Audio Output</p>
                      <p className="text-xs text-gray-400">{audioUrl.split("/").pop()}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => window.open(audioUrl, "_blank")}
                  >
                    Download
                  </Button>
                </div>

                {/* Alternative native audio player (backup) */}
                <div className="mt-4">
                  <p className="text-sm text-gray-400 mb-2">
                    If the custom player doesn't work, use this native player:
                  </p>
                  <audio controls className="w-full" key={audioUrl}>
                    <source src={audioUrl} type="audio/mp3" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              </div>
            ) : (
              <p className="text-gray-400">No audio output available</p>
            )}

            {/* Display raw result for debugging */}
            <div className="mt-4 pt-4 border-t border-purple-900/30">
              <details>
                <summary className="text-sm text-gray-400 cursor-pointer">Show raw result data</summary>
                <pre className="mt-2 text-xs text-gray-500 overflow-auto max-h-[200px] bg-black/30 p-2 rounded">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
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
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>

            <Card className="bg-black/40 backdrop-blur-sm border border-purple-900/30 p-6 md:p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Service Not Found</h2>
              <p className="text-gray-400 mb-6">The requested service could not be found.</p>
              <Button
                onClick={() => router.push("/dashboard")}
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
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            className="mb-6 text-gray-400 hover:text-white"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>

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
              </div>
            </div>
          </div>

          {/* Main content card */}
          <Card className="bg-black/40 backdrop-blur-sm border border-purple-900/30 p-6 md:p-8">
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

              <Button
                onClick={handleSubmit}
                disabled={isLoading || (!userInput && !uploadedFile)}
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
        </div>
      </main>
    </div>
  )
}
