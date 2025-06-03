"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation"
import { NavBar } from "@/components/nav-bar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  ArrowRight,
  MessageSquare,
  Wand2,
  Bot,
  Sparkles,
  ArrowLeft,
  Loader2,
  Send,
  Copy,
  RefreshCw,
  Lightbulb,
  FileText,
  CheckCircle,
  AlertTriangle,
  Info
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "@/components/ui/use-toast"
import Cookies from "js-cookie"

// Chat message interface
interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ServiceCreationPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [selectedOption, setSelectedOption] = useState<'diy' | 'ai' | null>(null)
  
  // Chat interface state
  const [userInput, setUserInput] = useState("")
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)

  // Authentication check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login")
    }
  }, [authLoading, isAuthenticated, router])

  const handleDIYOption = () => {
    router.push("/apps/create/service-workflow-builder")
  }

  const handleAIOption = () => {
    setSelectedOption('ai')
    // Add initial AI greeting message
    if (chatHistory.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: `welcome-${Date.now()}`,
        type: 'assistant',
        content: "Hello! I'm here to help you create a custom AI service through natural conversation. Tell me what you'd like your service to do, and I'll guide you through building it step by step.\n\nFor example, you could say:\n• \"I want to create a service that summarizes long documents\"\n• \"Help me build a chatbot for customer support\"\n• \"I need a service that translates text between languages\"",
        timestamp: new Date()
      }
      setChatHistory([welcomeMessage])
    }
  }

  const handleBackToOptions = () => {
    setSelectedOption(null)
    setChatHistory([])
    setUserInput("")
  }

  const handleChatSubmit = async () => {
    if (!userInput.trim()) return

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: userInput.trim(),
      timestamp: new Date()
    }

    setChatHistory(prev => [...prev, userMessage])
    setUserInput("")
    setIsTyping(true)

    try {
      // Call the Gemini AI endpoint
      const currentUserId = Cookies.get("user_id")
      const token = Cookies.get("access_token")

      const response = await fetch('http://127.0.0.1:8000/api/v1/mini-services/chat-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_message: userInput.trim(),
          conversation_history: chatHistory,
          current_user_id: currentUserId
        })
      })

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`)
      }

      const data = await response.json()

      // Add AI response
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        type: 'assistant',
        content: data.response || "I'm sorry, I couldn't generate a proper response. Could you please try rephrasing your request?",
        timestamp: new Date()
      }

      setChatHistory(prev => [...prev, aiMessage])

    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again or consider using the DIY service builder if the issue persists.",
        timestamp: new Date()
      }
      setChatHistory(prev => [...prev, errorMessage])
      
      toast({
        variant: "destructive",
        title: "Chat Error",
        description: "Failed to get AI response. Please try again."
      })
    } finally {
      setIsTyping(false)
    }
  }

  const copyToClipboard = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedMessageId(messageId)
      toast({
        title: "Copied to clipboard",
        description: "Message content has been copied",
        duration: 2000,
      })
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
        duration: 2000,
      })
    }
  }

  const resetConversation = () => {
    setChatHistory([])
    setUserInput("")
    setIsTyping(false)
    handleAIOption() // This will add the welcome message back
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleChatSubmit()
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black">
      <NavBar />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Create Your AI Service
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Choose how you'd like to build your custom AI service
            </p>
          </div>

          {selectedOption === null && (
            /* Main Options */
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* DIY Option */}
              <Card className="group relative overflow-hidden bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-700/40 hover:border-purple-500/60 transition-all duration-300 hover:scale-105 cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10 p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Wand2 className="h-8 w-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-4">
                    I will create my services myself
                  </h3>
                  <p className="text-gray-300 mb-6 leading-relaxed">
                    Use our powerful visual workflow builder to create custom AI services. 
                    Connect different AI models, tools, and APIs with a drag-and-drop interface.
                  </p>
                  
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center text-sm text-gray-400">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                      Full control over your workflow
                    </div>
                    <div className="flex items-center text-sm text-gray-400">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                      Visual drag-and-drop builder
                    </div>
                    <div className="flex items-center text-sm text-gray-400">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                      Advanced customization options
                    </div>
                  </div>

                  <Button 
                    onClick={handleDIYOption}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 shadow-lg transition-all duration-200 hover:shadow-purple-500/25"
                  >
                    Start Building
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Card>

              {/* AI-Assisted Option */}
              <Card className="group relative overflow-hidden bg-gradient-to-br from-indigo-900/30 to-blue-800/20 border border-indigo-700/40 hover:border-indigo-500/60 transition-all duration-300 hover:scale-105 cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10 p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Bot className="h-8 w-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Create service by describing it
                  </h3>
                  <p className="text-gray-300 mb-6 leading-relaxed">
                    Describe what you want your AI service to do in natural language, 
                    and our AI assistant will help you design and create it step by step.
                  </p>
                  
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center text-sm text-gray-400">
                      <Sparkles className="h-4 w-4 mr-2 text-blue-400" />
                      AI-powered guidance
                    </div>
                    <div className="flex items-center text-sm text-gray-400">
                      <Sparkles className="h-4 w-4 mr-2 text-blue-400" />
                      Natural language interface
                    </div>
                    <div className="flex items-center text-sm text-gray-400">
                      <Sparkles className="h-4 w-4 mr-2 text-blue-400" />
                      Intelligent recommendations
                    </div>
                  </div>

                  <Button 
                    onClick={handleAIOption}
                    className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white border-0 shadow-lg transition-all duration-200 hover:shadow-indigo-500/25"
                  >
                    Chat with AI
                    <MessageSquare className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {selectedOption === 'ai' && (
            /* AI Chat Interface */
            <div className="max-w-6xl mx-auto">
              <div className="grid lg:grid-cols-4 gap-8">
                {/* Chat Interface */}
                <div className="lg:col-span-3">
                  <Card className="bg-black/60 backdrop-blur-sm border border-purple-900/30 rounded-2xl overflow-hidden h-[700px] flex flex-col">
                    {/* Chat Header */}
                    <div className="p-4 border-b border-purple-900/30 bg-gradient-to-r from-indigo-900/20 to-transparent">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-full flex items-center justify-center mr-3">
                            <Bot className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <h3 className="text-white font-medium">AI Service Designer</h3>
                            <p className="text-xs text-gray-400">{chatHistory.length} message{chatHistory.length !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={resetConversation}
                            className="border-purple-700/40 text-gray-400 hover:text-white hover:bg-purple-900/30"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleBackToOptions}
                            className="border-purple-700/40 text-gray-400 hover:text-white hover:bg-purple-900/30"
                          >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {chatHistory.map((message) => (
                        <div 
                          key={message.id}
                          className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          {message.type === 'assistant' && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center border border-indigo-600/30">
                              <Bot className="h-4 w-4 text-indigo-400" />
                            </div>
                          )}
                          
                          <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : ''}`}>
                            <div className={`p-3 rounded-lg relative group ${
                              message.type === 'user' 
                                ? 'bg-purple-600 text-white' 
                                : 'bg-gray-800/50 text-gray-100 border border-gray-700/30'
                            }`}>
                              <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                              
                              {/* Copy button */}
                              <button
                                onClick={() => copyToClipboard(message.id, message.content)}
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-black/20"
                              >
                                {copiedMessageId === message.id ? (
                                  <CheckCircle className="h-3 w-3 text-green-400" />
                                ) : (
                                  <Copy className="h-3 w-3 text-gray-400" />
                                )}
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 px-1">
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>

                          {message.type === 'user' && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center border border-purple-600/30 order-1">
                              <span className="text-purple-400 text-xs font-bold">You</span>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Typing indicator */}
                      {isTyping && (
                        <div className="flex gap-3 justify-start">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center border border-indigo-600/30">
                            <Bot className="h-4 w-4 text-indigo-400" />
                          </div>
                          <div className="bg-gray-800/50 border border-gray-700/30 rounded-lg p-3">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Chat Input */}
                    <div className="p-4 border-t border-purple-900/30">
                      <div className="flex gap-3">
                        <Textarea
                          value={userInput}
                          onChange={(e) => setUserInput(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Describe the AI service you want to create..."
                          className="flex-1 bg-black/40 border-purple-900/40 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all resize-none"
                          rows={3}
                          disabled={isLoading || isTyping}
                        />
                        <Button
                          onClick={handleChatSubmit}
                          disabled={!userInput.trim() || isLoading || isTyping}
                          className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white border-0 px-6"
                        >
                          {isLoading || isTyping ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Press Enter to send, Shift+Enter for new line
                      </p>
                    </div>
                  </Card>
                </div>

                {/* Guidelines Sidebar */}
                <div className="lg:col-span-1">
                  <Card className="bg-black/40 backdrop-blur-sm border border-purple-900/30 rounded-2xl p-6 h-fit sticky top-24">
                    <div className="flex items-center mb-4">
                      <Lightbulb className="h-5 w-5 text-yellow-400 mr-2" />
                      <h3 className="text-white font-medium">Guidelines & Tips</h3>
                    </div>

                    <div className="space-y-4 text-sm">
                      <div>
                        <h4 className="text-green-400 font-medium mb-2 flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          What to Write
                        </h4>
                        <ul className="space-y-1 text-gray-300 text-xs">
                          <li>• Be specific about your service's purpose</li>
                          <li>• Mention input and output types (text, image, audio)</li>
                          <li>• Describe the AI models you prefer</li>
                          <li>• Include any special requirements</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-red-400 font-medium mb-2 flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          What to Avoid
                        </h4>
                        <ul className="space-y-1 text-gray-300 text-xs">
                          <li>• Vague or unclear descriptions</li>
                          <li>• Multiple unrelated functions</li>
                          <li>• Technical jargon without context</li>
                          <li>• Impossible or unrealistic requests</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-blue-400 font-medium mb-2 flex items-center">
                          <Info className="h-4 w-4 mr-1" />
                          Examples
                        </h4>
                        <div className="space-y-2 text-gray-300 text-xs">
                          <div className="p-2 bg-blue-900/20 rounded border border-blue-800/30">
                            "Create a document summarizer that takes long PDFs and creates concise summaries"
                          </div>
                          <div className="p-2 bg-green-900/20 rounded border border-green-800/30">
                            "I need a chatbot for customer support using OpenAI that can answer FAQs"
                          </div>
                          <div className="p-2 bg-purple-900/20 rounded border border-purple-800/30">
                            "Build a service that translates text between English and Spanish"
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
