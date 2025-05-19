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
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center h-16 my-2 relative">
            <Button
              variant="ghost"
              onClick={() => router.push("/apps")}
              className="flex items-center text-gray-300 hover:text-white p-0 hover:bg-transparent absolute left-0"
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
            </Button>
            <div className="flex items-center justify-center w-full">
              <Key className="h-5 w-5 text-purple-400 mr-2" />
              <span className="text-white font-semibold">API Key Management</span>
            </div>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <TabsList className="bg-black/40 border border-purple-900/30 w-full sm:w-auto">
                <TabsTrigger value="all">All Keys</TabsTrigger>
                <TabsTrigger value="openai">OpenAI</TabsTrigger>
                <TabsTrigger value="gemini">Gemini</TabsTrigger>
                <TabsTrigger value="custom">Custom</TabsTrigger>
              </TabsList>
              <Dialog open={isAddKeyDialogOpen} onOpenChange={setIsAddKeyDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Key
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-purple-900/50">
                  <DialogHeader>
                    <DialogTitle>Add New API Key</DialogTitle>
                    <DialogDescription>
                      Add a new API key to use with AI services. The key will be encrypted and stored securely.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="provider">Provider</Label>
                      <Select value={newKeyProvider} onValueChange={setNewKeyProvider}>
                        <SelectTrigger className="bg-black/30 border-purple-900/30">
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-purple-900/50">
                          <SelectItem value="openai">OpenAI</SelectItem>
                          <SelectItem value="gemini">Gemini</SelectItem>
                          <SelectItem value="anthropic">Anthropic</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="key">API Key</Label>
                      <Input
                        id="key"
                        placeholder="sk-..."
                        value={newApiKey}
                        onChange={(e) => setNewApiKey(e.target.value)}
                        className="bg-black/30 border-purple-900/30"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddKeyDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      className="bg-purple-600 hover:bg-purple-700"
                      onClick={createApiKey}
                    >
                      Add Key
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <TabsContent value="all" className="mt-0">
              <Card className="bg-black/40 backdrop-blur-sm border-purple-900/30">
                <CardHeader>
                  <CardTitle>Your API Keys</CardTitle>
                  <CardDescription>
                    Manage your API keys for different AI services. These keys are encrypted and stored securely.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {error && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-md text-red-200 text-sm">
                      {error}
                      <Button
                        variant="link"
                        className="text-red-200 p-0 h-auto text-xs ml-2 underline"
                        onClick={() => fetchApiKeys()}
                      >
                        Try again
                      </Button>
                    </div>
                  )}

                  {isLoading ? (
                    <div className="flex justify-center items-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-500 border-r-2 border-purple-500 border-b-2 border-transparent"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {apiKeys.map((apiKey) => (
                        // Update the card component that displays API keys
                        <div
                          key={apiKey.id}
                          className="p-4 rounded-lg border border-purple-900/30 bg-black/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="flex-grow">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-medium text-white">{apiKey.name}</h3>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(apiKey.status)} border-current flex items-center gap-1`}
                              >
                                {getStatusIcon(apiKey.status)}
                                {apiKey.status.charAt(0).toUpperCase() + apiKey.status.slice(1)}
                              </span>
                              {apiKey.provider === "gemini" && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/30 text-blue-300 border border-blue-800/50">
                                  Google
                                </span>
                              )}
                              {apiKey.provider === "openai" && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/30 text-green-300 border border-green-800/50">
                                  OpenAI
                                </span>
                              )}
                            </div>
                            <div className="flex items-center mt-2">
                              <div className="font-mono text-xs text-gray-400 bg-black/30 px-3 py-1 rounded border border-gray-700 flex-1 truncate max-w-[300px]">
                                {showKey[apiKey.id]
                                  ? apiKey.key
                                  : apiKey.key.length > 4
                                    ? apiKey.key.substring(0, 4) + "•".repeat(apiKey.key.length - 4)
                                    : "•".repeat(apiKey.key.length)
                                }
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleShowKey(apiKey.id)}
                                className="ml-2 text-gray-400"
                              >
                                {showKey[apiKey.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Last used: {apiKey.lastUsed}</p>
                          </div>
                          <div className="flex sm:flex-col gap-2 self-end sm:self-center">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-gray-900 border-purple-900/50">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete your {apiKey.provider} API key.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-gray-800 hover:bg-gray-700 border-0">Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={() => deleteKey(apiKey.id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between border-t border-purple-900/30 pt-6">
                  <p className="text-sm text-gray-400">
                    API keys are encrypted and stored securely. We never share your keys with third parties.
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="openai" className="mt-0">
              <Card className="bg-black/40 backdrop-blur-sm border-purple-900/30">
                <CardHeader>
                  <CardTitle>OpenAI API Keys</CardTitle>
                  <CardDescription>
                    Manage your OpenAI API keys for GPT models and other OpenAI services.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center items-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-500 border-r-2 border-purple-500 border-b-2 border-transparent"></div>
                    </div>
                  ) : apiKeys.filter((key) => key.provider === "openai").length > 0 ? (
                    <div className="space-y-4">
                      {apiKeys
                        .filter((key) => key.provider === "openai")
                        .map((apiKey) => (
                          <div
                            key={apiKey.id}
                            className="p-4 rounded-lg border border-purple-900/30 bg-black/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-white">{apiKey.name}</h3>
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(apiKey.status)} border-current flex items-center gap-1`}
                                >
                                  {getStatusIcon(apiKey.status)}
                                  {apiKey.status.charAt(0).toUpperCase() + apiKey.status.slice(1)}
                                </span>
                              </div>
                              <div className="flex items-center mt-2">
                                <div className="font-mono text-xs text-gray-400 bg-black/30 px-3 py-1 rounded border border-gray-700 flex-1 truncate max-w-[300px]">
                                  {showKey[apiKey.id]
                                    ? apiKey.key
                                    : apiKey.key.length > 4
                                      ? apiKey.key.substring(0, 4) + "•".repeat(apiKey.key.length - 4)
                                      : "•".repeat(apiKey.key.length)
                                  }
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleShowKey(apiKey.id)}
                                  className="ml-2 text-gray-400"
                                >
                                  {showKey[apiKey.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              </div>
                              <p className="text-xs text-gray-500 mt-2">Last used: {apiKey.lastUsed}</p>
                            </div>
                            <div className="flex sm:flex-col gap-2 self-end sm:self-center">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-gray-900 border-purple-900/50">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete the API key.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-gray-800 hover:bg-gray-700 border-0">Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-red-600 hover:bg-red-700"
                                      onClick={() => deleteKey(apiKey.id)}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center p-8">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-purple-900/20 flex items-center justify-center mx-auto mb-4">
                          <Key className="h-8 w-8 text-purple-400" />
                        </div>
                        <h3 className="text-white font-medium mb-2">No OpenAI Keys Yet</h3>
                        <p className="text-gray-400 text-sm mb-4">
                          Add an OpenAI API key to use GPT models and other OpenAI services
                        </p>
                        <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setIsAddKeyDialogOpen(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add OpenAI Key
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="gemini" className="mt-0">
              <Card className="bg-black/40 backdrop-blur-sm border-purple-900/30">
                <CardHeader>
                  <CardTitle>Gemini API Keys</CardTitle>
                  <CardDescription>
                    Manage your Google Gemini API keys for Gemini models and other Google AI services.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {apiKeys
                      .filter((key) => key.provider === "gemini")
                      .map((apiKey) => (
                        <div
                          key={apiKey.id}
                          className="p-4 rounded-lg border border-purple-900/30 bg-black/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-white">{apiKey.name}</h3>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(apiKey.status)} border-current flex items-center gap-1`}
                              >
                                {getStatusIcon(apiKey.status)}
                                {apiKey.status.charAt(0).toUpperCase() + apiKey.status.slice(1)}
                              </span>
                            </div>
                            <div className="flex items-center mt-2">
                              <div className="font-mono text-xs text-gray-400 bg-black/30 px-3 py-1 rounded border border-gray-700 flex-1 truncate max-w-[300px]">
                                {showKey[apiKey.id]
                                  ? apiKey.key
                                  : apiKey.key.length > 4
                                    ? apiKey.key.substring(0, 4) + "•".repeat(apiKey.key.length - 4)
                                    : "•".repeat(apiKey.key.length)
                                }
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleShowKey(apiKey.id)}
                                className="ml-2 text-gray-400"
                              >
                                {showKey[apiKey.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Last used: {apiKey.lastUsed}</p>
                          </div>
                          <div className="flex sm:flex-col gap-2 self-end sm:self-center">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the API key.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={() => deleteKey(apiKey.id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="custom" className="mt-0">
              <Card className="bg-black/40 backdrop-blur-sm border-purple-900/30">
                <CardHeader>
                  <CardTitle>Custom API Endpoints</CardTitle>
                  <CardDescription>
                    Configure custom API endpoints for self-hosted models or other AI services.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center p-8">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-purple-900/20 flex items-center justify-center mx-auto mb-4">
                        <Plus className="h-8 w-8 text-purple-400" />
                      </div>
                      <h3 className="text-white font-medium mb-2">No Custom Endpoints Yet</h3>
                      <p className="text-gray-400 text-sm mb-4">
                        Add a custom endpoint to connect to your self-hosted models
                      </p>
                      <Button className="bg-purple-600 hover:bg-purple-700">Add Custom Endpoint</Button>
                    </div>
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
