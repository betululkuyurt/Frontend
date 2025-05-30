"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Cookies from "js-cookie"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { ChevronLeft, Key, Plus, Trash2, Eye, EyeOff, Check, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { NavBar } from "@/components/nav-bar"

interface ApiKey {
  id: string
  name: string
  key: string
  provider: string
  lastUsed: string
  status: "active" | "expired" | "invalid"
}

export default function ApiKeysPage() {
  const [showKey, setShowKey] = useState<Record<string, boolean>>({})
  const router = useRouter()
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newApiKey, setNewApiKey] = useState("")
  const [newKeyProvider, setNewKeyProvider] = useState("openai")
  const [isAddKeyDialogOpen, setIsAddKeyDialogOpen] = useState(false)
  const [actualKeys, setActualKeys] = useState<Record<string, string>>({})
  const toggleShowKey = (id: string) => {
    setShowKey((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const deleteKey = async (id: string) => {
    try {
      const userId = Cookies.get("user_id")
      if (!userId) {
        throw new Error("User not authenticated")
      }

      const response = await fetch(`http://127.0.0.1:8000/api/v1/api-keys/${id}?current_user_id=${userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Cookies.get("access_token")}`
        }
      })

      if (!response.ok) {
        throw new Error("Failed to delete API key")
      }

      // Update the local state
      setApiKeys(prev => prev.filter(key => key.id !== id))
    } catch (error: any) {
      console.error("Error deleting API key:", error)
      setError(error.message)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-500"
      case "expired":
        return "text-amber-500"
      case "invalid":
        return "text-red-500"
      default:
        return "text-gray-500"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Check className="h-4 w-4 text-green-500" />
      case "expired":
        return <X className="h-4 w-4 text-amber-500" />
      case "invalid":
        return <X className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  useEffect(() => {
    fetchApiKeys()
  }, [])


  // Updated fetchApiKeys function to handle the new API response format
  const fetchApiKeys = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const userId = Cookies.get("user_id")
      if (!userId) {
        throw new Error("User not authenticated")
      }

      const response = await fetch(`http://127.0.0.1:8000/api/v1/api-keys?current_user_id=${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Cookies.get("access_token")}`
        }
      })

      if (!response.ok) {
        throw new Error("Failed to fetch API keys")
      }

      const data = await response.json()

      // Transform the data to match our frontend interface
      const formattedKeys = data.map((key: any) => ({
        id: key.id.toString(),
        name: key.provider.charAt(0).toUpperCase() + key.provider.slice(1) + " API Key",
        key: key.api_key, // Store the actual key
        maskedKey: "•".repeat(24), // Create a masked version
        provider: key.provider,
        lastUsed: key.last_used || "Never used",
        status: "active" // Assuming keys are active by default
      }))

      setApiKeys(formattedKeys)
    } catch (error: any) {
      console.error("Error fetching API keys:", error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Create a new API key
  const createApiKey = async () => {
    try {
      const userId = Cookies.get("user_id")
      if (!userId) {
        throw new Error("User not authenticated")
      }

      if (!newApiKey || !newKeyProvider) {
        throw new Error("All fields are required")
      }

      const response = await fetch(`http://127.0.0.1:8000/api/v1/api-keys/?current_user_id=${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Cookies.get("access_token")}`
        },
        // Only send the fields expected by the backend
        body: JSON.stringify({
          api_key: newApiKey,
          provider: newKeyProvider
        })
      })

      if (!response.ok) {
        throw new Error("Failed to create API key")
      }

      // Refresh the API keys list
      await fetchApiKeys()

      // Reset form fields
      setNewApiKey("")
      setNewKeyProvider("openai")
      setIsAddKeyDialogOpen(false)

    } catch (error: any) {
      console.error("Error creating API key:", error)
      setError(error.message)
    }
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black">
      <NavBar />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Enhanced Header */}
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push("/apps")}
              className="flex items-center text-gray-300 hover:text-white hover:bg-purple-900/20 px-3 py-2 rounded-lg transition-all duration-300"
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              Back to Apps
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
                <Key className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">API Key Management</h1>
            </div>
          </div>          <Tabs defaultValue="all" className="w-full">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
              <TabsList className="bg-black/60 border border-purple-900/30 backdrop-blur-sm rounded-xl p-1">
                <TabsTrigger 
                  value="all" 
                  className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-400 rounded-lg px-4 py-2 transition-all duration-300"
                >
                  All Keys
                </TabsTrigger>
                <TabsTrigger 
                  value="openai"
                  className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-400 rounded-lg px-4 py-2 transition-all duration-300"
                >
                  OpenAI
                </TabsTrigger>
                <TabsTrigger 
                  value="gemini"
                  className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-400 rounded-lg px-4 py-2 transition-all duration-300"
                >
                  Gemini
                </TabsTrigger>
                <TabsTrigger 
                  value="custom"
                  className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-400 rounded-lg px-4 py-2 transition-all duration-300"
                >
                  Custom
                </TabsTrigger>
              </TabsList>
              <Dialog open={isAddKeyDialogOpen} onOpenChange={setIsAddKeyDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white border-0 rounded-xl px-6 py-3 transition-all duration-300 shadow-lg hover:shadow-purple-500/25">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Key
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-black/90 backdrop-blur-sm border border-purple-900/50 rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-white text-xl">Add New API Key</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Add a new API key to use with AI services. The key will be encrypted and stored securely.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    <div className="space-y-3">
                      <Label htmlFor="provider" className="text-gray-300 font-medium">Provider</Label>
                      <Select value={newKeyProvider} onValueChange={setNewKeyProvider}>
                        <SelectTrigger className="bg-black/40 border-purple-900/40 text-gray-200 h-12 rounded-xl focus:border-purple-500/60">
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent className="bg-black/90 border-purple-900/50 backdrop-blur-sm rounded-xl">
                          <SelectItem value="openai" className="text-gray-300 hover:bg-purple-900/30">OpenAI</SelectItem>
                          <SelectItem value="gemini" className="text-gray-300 hover:bg-purple-900/30">Gemini</SelectItem>
                          <SelectItem value="anthropic" className="text-gray-300 hover:bg-purple-900/30">Anthropic</SelectItem>
                          <SelectItem value="custom" className="text-gray-300 hover:bg-purple-900/30">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="key" className="text-gray-300 font-medium">API Key</Label>
                      <Input
                        id="key"
                        placeholder="sk-..."
                        value={newApiKey}
                        onChange={(e) => setNewApiKey(e.target.value)}
                        className="bg-black/40 border-purple-900/40 text-gray-200 h-12 rounded-xl focus:border-purple-500/60 focus:ring-purple-500/20"
                      />
                    </div>
                  </div>
                  <DialogFooter className="gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddKeyDialogOpen(false)}
                      className="border-purple-900/40 text-gray-300 hover:bg-purple-900/20 rounded-xl"
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white border-0 rounded-xl"
                      onClick={createApiKey}
                    >
                      Add Key
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>            <TabsContent value="all" className="mt-0">
              <Card className="bg-black/60 backdrop-blur-sm border-purple-900/30 rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-purple-900/20 bg-gradient-to-r from-purple-900/10 to-transparent">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
                      <Key className="h-3 w-3 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-xl">Your API Keys</CardTitle>
                      <CardDescription className="text-gray-400 mt-1">
                        Manage your API keys for different AI services. These keys are encrypted and stored securely.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-200 text-sm backdrop-blur-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-red-500 rounded-full flex-shrink-0"></div>
                        <span>{error}</span>
                        <Button
                          variant="link"
                          className="text-red-200 p-0 h-auto text-xs ml-auto underline hover:text-red-100"
                          onClick={() => fetchApiKeys()}
                        >
                          Try again
                        </Button>
                      </div>
                    </div>
                  )}

                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center p-12">
                      <div className="w-12 h-12 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="text-gray-400">Loading your API keys...</p>
                    </div>
                  ) : apiKeys.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-900/30 to-purple-800/20 flex items-center justify-center mb-6">
                        <Key className="h-10 w-10 text-purple-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">No API Keys Yet</h3>
                      <p className="text-gray-400 mb-6 max-w-md">
                        Get started by adding your first API key. Connect to OpenAI, Gemini, or any custom AI service.
                      </p>
                      <Button 
                        className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white border-0 rounded-xl px-6 py-3"
                        onClick={() => setIsAddKeyDialogOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Key
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {apiKeys.map((apiKey) => (
                        <div
                          key={apiKey.id}
                          className="group p-6 rounded-xl border border-purple-900/30 bg-gradient-to-r from-black/40 to-black/20 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-900/20 relative overflow-hidden"
                        >
                          {/* Background decoration */}
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          
                          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex-grow space-y-3">
                              <div className="flex flex-wrap items-center gap-3">
                                <h3 className="font-semibold text-white text-lg">{apiKey.name}</h3>
                                <span
                                  className={`text-xs px-3 py-1 rounded-full border ${getStatusColor(apiKey.status)} border-current flex items-center gap-2 bg-black/20`}
                                >
                                  {getStatusIcon(apiKey.status)}
                                  {apiKey.status.charAt(0).toUpperCase() + apiKey.status.slice(1)}
                                </span>
                                {apiKey.provider === "gemini" && (
                                  <span className="text-xs px-3 py-1 rounded-full bg-blue-900/30 text-blue-300 border border-blue-800/50">
                                    Google
                                  </span>
                                )}
                                {apiKey.provider === "openai" && (
                                  <span className="text-xs px-3 py-1 rounded-full bg-green-900/30 text-green-300 border border-green-800/50">
                                    OpenAI
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                <div className="font-mono text-sm text-gray-300 bg-black/40 px-4 py-2 rounded-lg border border-gray-700/50 flex-1 max-w-md">
                                  {showKey[apiKey.id]
                                    ? apiKey.key
                                    : apiKey.key.length > 4
                                      ? apiKey.key.substring(0, 4) + "•".repeat(Math.min(apiKey.key.length - 4, 20))
                                      : "•".repeat(apiKey.key.length)
                                  }
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleShowKey(apiKey.id)}
                                  className="text-gray-400 hover:text-white hover:bg-purple-900/20 rounded-lg h-10 w-10"
                                >
                                  {showKey[apiKey.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              </div>
                              
                              <p className="text-xs text-gray-500">Last used: {apiKey.lastUsed}</p>
                            </div>
                            
                            <div className="flex gap-3">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="destructive" 
                                    size="sm"
                                    className="bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30 hover:border-red-500/50 rounded-lg"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-black/90 backdrop-blur-sm border border-purple-900/50 rounded-2xl">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-gray-400">
                                      This action cannot be undone. This will permanently delete your {apiKey.provider} API key.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter className="gap-3">
                                    <AlertDialogCancel className="bg-gray-800/50 hover:bg-gray-700/50 border-gray-600/30 text-gray-300 rounded-xl">
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
                                      onClick={() => deleteKey(apiKey.id)}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t border-purple-900/20 bg-gradient-to-r from-purple-900/5 to-transparent p-6">
                  <div className="flex items-center space-x-3 text-sm text-gray-400">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <p>API keys are encrypted and stored securely. We never share your keys with third parties.</p>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>            <TabsContent value="openai" className="mt-0">
              <Card className="bg-black/60 backdrop-blur-sm border-purple-900/30 rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-purple-900/20 bg-gradient-to-r from-green-900/10 to-transparent">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-sm"></div>
                    </div>
                    <div>
                      <CardTitle className="text-white text-xl">OpenAI API Keys</CardTitle>
                      <CardDescription className="text-gray-400 mt-1">
                        Manage your OpenAI API keys for GPT models and other OpenAI services.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center p-12">
                      <div className="w-12 h-12 border-2 border-green-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="text-gray-400">Loading OpenAI keys...</p>
                    </div>
                  ) : apiKeys.filter((key) => key.provider === "openai").length > 0 ? (
                    <div className="grid gap-4">
                      {apiKeys
                        .filter((key) => key.provider === "openai")
                        .map((apiKey) => (
                          <div
                            key={apiKey.id}
                            className="group p-6 rounded-xl border border-green-900/30 bg-gradient-to-r from-black/40 to-green-900/5 hover:border-green-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-900/20 relative overflow-hidden"
                          >
                            {/* Background decoration */}
                            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            
                            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                              <div className="flex-grow space-y-3">
                                <div className="flex flex-wrap items-center gap-3">
                                  <h3 className="font-semibold text-white text-lg">{apiKey.name}</h3>
                                  <span
                                    className={`text-xs px-3 py-1 rounded-full border ${getStatusColor(apiKey.status)} border-current flex items-center gap-2 bg-black/20`}
                                  >
                                    {getStatusIcon(apiKey.status)}
                                    {apiKey.status.charAt(0).toUpperCase() + apiKey.status.slice(1)}
                                  </span>
                                  <span className="text-xs px-3 py-1 rounded-full bg-green-900/30 text-green-300 border border-green-800/50">
                                    OpenAI
                                  </span>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                  <div className="font-mono text-sm text-gray-300 bg-black/40 px-4 py-2 rounded-lg border border-gray-700/50 flex-1 max-w-md">
                                    {showKey[apiKey.id]
                                      ? apiKey.key
                                      : apiKey.key.length > 4
                                        ? apiKey.key.substring(0, 4) + "•".repeat(Math.min(apiKey.key.length - 4, 20))
                                        : "•".repeat(apiKey.key.length)
                                    }
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleShowKey(apiKey.id)}
                                    className="text-gray-400 hover:text-white hover:bg-green-900/20 rounded-lg h-10 w-10"
                                  >
                                    {showKey[apiKey.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </Button>
                                </div>
                                
                                <p className="text-xs text-gray-500">Last used: {apiKey.lastUsed}</p>
                              </div>
                              
                              <div className="flex gap-3">
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="destructive" 
                                      size="sm"
                                      className="bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30 hover:border-red-500/50 rounded-lg"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="bg-black/90 backdrop-blur-sm border border-purple-900/50 rounded-2xl">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
                                      <AlertDialogDescription className="text-gray-400">
                                        This action cannot be undone. This will permanently delete the API key.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="gap-3">
                                      <AlertDialogCancel className="bg-gray-800/50 hover:bg-gray-700/50 border-gray-600/30 text-gray-300 rounded-xl">
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
                                        onClick={() => deleteKey(apiKey.id)}
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-900/30 to-green-800/20 flex items-center justify-center mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-800 rounded-lg flex items-center justify-center">
                          <div className="w-5 h-5 bg-white rounded-sm"></div>
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">No OpenAI Keys Yet</h3>
                      <p className="text-gray-400 mb-6 max-w-md">
                        Add an OpenAI API key to use GPT models and other OpenAI services in your applications.
                      </p>
                      <Button 
                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white border-0 rounded-xl px-6 py-3"
                        onClick={() => setIsAddKeyDialogOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add OpenAI Key
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>            <TabsContent value="gemini" className="mt-0">
              <Card className="bg-black/60 backdrop-blur-sm border-purple-900/30 rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-purple-900/20 bg-gradient-to-r from-blue-900/10 to-transparent">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                    <div>
                      <CardTitle className="text-white text-xl">Gemini API Keys</CardTitle>
                      <CardDescription className="text-gray-400 mt-1">
                        Manage your Google Gemini API keys for Gemini models and other Google AI services.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center p-12">
                      <div className="w-12 h-12 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="text-gray-400">Loading Gemini keys...</p>
                    </div>
                  ) : apiKeys.filter((key) => key.provider === "gemini").length > 0 ? (
                    <div className="grid gap-4">
                      {apiKeys
                        .filter((key) => key.provider === "gemini")
                        .map((apiKey) => (
                          <div
                            key={apiKey.id}
                            className="group p-6 rounded-xl border border-blue-900/30 bg-gradient-to-r from-black/40 to-blue-900/5 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-900/20 relative overflow-hidden"
                          >
                            {/* Background decoration */}
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            
                            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                              <div className="flex-grow space-y-3">
                                <div className="flex flex-wrap items-center gap-3">
                                  <h3 className="font-semibold text-white text-lg">{apiKey.name}</h3>
                                  <span
                                    className={`text-xs px-3 py-1 rounded-full border ${getStatusColor(apiKey.status)} border-current flex items-center gap-2 bg-black/20`}
                                  >
                                    {getStatusIcon(apiKey.status)}
                                    {apiKey.status.charAt(0).toUpperCase() + apiKey.status.slice(1)}
                                  </span>
                                  <span className="text-xs px-3 py-1 rounded-full bg-blue-900/30 text-blue-300 border border-blue-800/50">
                                    Google
                                  </span>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                  <div className="font-mono text-sm text-gray-300 bg-black/40 px-4 py-2 rounded-lg border border-gray-700/50 flex-1 max-w-md">
                                    {showKey[apiKey.id]
                                      ? apiKey.key
                                      : apiKey.key.length > 4
                                        ? apiKey.key.substring(0, 4) + "•".repeat(Math.min(apiKey.key.length - 4, 20))
                                        : "•".repeat(apiKey.key.length)
                                    }
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleShowKey(apiKey.id)}
                                    className="text-gray-400 hover:text-white hover:bg-blue-900/20 rounded-lg h-10 w-10"
                                  >
                                    {showKey[apiKey.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </Button>
                                </div>
                                
                                <p className="text-xs text-gray-500">Last used: {apiKey.lastUsed}</p>
                              </div>
                              
                              <div className="flex gap-3">
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="destructive" 
                                      size="sm"
                                      className="bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30 hover:border-red-500/50 rounded-lg"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="bg-black/90 backdrop-blur-sm border border-purple-900/50 rounded-2xl">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
                                      <AlertDialogDescription className="text-gray-400">
                                        This action cannot be undone. This will permanently delete the API key.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="gap-3">
                                      <AlertDialogCancel className="bg-gray-800/50 hover:bg-gray-700/50 border-gray-600/30 text-gray-300 rounded-xl">
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
                                        onClick={() => deleteKey(apiKey.id)}
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-12 text-center">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-900/30 to-blue-800/20 flex items-center justify-center mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                          <div className="w-5 h-5 bg-white rounded-full"></div>
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">No Gemini Keys Yet</h3>
                      <p className="text-gray-400 mb-6 max-w-md">
                        Add a Google Gemini API key to use Gemini Pro and other Google AI models in your applications.
                      </p>
                      <Button 
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white border-0 rounded-xl px-6 py-3"
                        onClick={() => setIsAddKeyDialogOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Gemini Key
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent><TabsContent value="custom" className="mt-0">
              <Card className="bg-black/60 backdrop-blur-sm border-purple-900/30 rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-purple-900/20 bg-gradient-to-r from-amber-900/10 to-transparent">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center">
                      <Plus className="h-3 w-3 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-xl">Custom API Endpoints</CardTitle>
                      <CardDescription className="text-gray-400 mt-1">
                        Configure custom API endpoints for self-hosted models or other AI services.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-12">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-900/30 to-amber-800/20 flex items-center justify-center mb-8 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent"></div>
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-amber-800 rounded-xl flex items-center justify-center relative z-10">
                        <Plus className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-semibold text-white mb-3">No Custom Endpoints Yet</h3>
                    <p className="text-gray-400 mb-8 max-w-lg leading-relaxed">
                      Connect to your self-hosted models, local AI services, or any custom API endpoints. 
                      Perfect for enterprise deployments and specialized AI workflows.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 w-full max-w-2xl">
                      <div className="bg-black/40 rounded-xl p-4 border border-gray-800/50">
                        <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center mb-3">
                          <div className="w-4 h-4 bg-blue-400 rounded-sm"></div>
                        </div>
                        <h4 className="text-white font-medium mb-2">Self-Hosted</h4>
                        <p className="text-gray-500 text-xs">Connect to your own AI models</p>
                      </div>
                      <div className="bg-black/40 rounded-xl p-4 border border-gray-800/50">
                        <div className="w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center mb-3">
                          <div className="w-4 h-4 bg-green-400 rounded-sm"></div>
                        </div>
                        <h4 className="text-white font-medium mb-2">Local APIs</h4>
                        <p className="text-gray-500 text-xs">Integrate local services</p>
                      </div>
                      <div className="bg-black/40 rounded-xl p-4 border border-gray-800/50">
                        <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center mb-3">
                          <div className="w-4 h-4 bg-purple-400 rounded-sm"></div>
                        </div>
                        <h4 className="text-white font-medium mb-2">Enterprise</h4>
                        <p className="text-gray-500 text-xs">Custom enterprise solutions</p>
                      </div>
                    </div>
                    <Button 
                      className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white border-0 rounded-xl px-8 py-3 text-lg"
                      disabled
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Add Custom Endpoint
                    </Button>
                    <p className="text-xs text-gray-500 mt-4">Coming soon - Custom endpoint configuration</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
