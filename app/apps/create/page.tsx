"use client"

import React, { useState, useEffect, useRef } from 'react';
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

// Service creation response interfaces
interface Agent {
  id?: number;
  name: string;
  agent_type: string;
  system_instruction: string;
  config: any;
  input_type: string;
  output_type: string;
  owner_id?: number;
  created_at?: string;
  is_enhanced?: boolean;
}

// Checklist interfaces
interface ChecklistItem {
  completed: boolean;
  value: string;
}

interface Checklist {
  service_purpose: ChecklistItem;
  input_type: ChecklistItem;
  output_type: ChecklistItem;
  service_name: ChecklistItem;
}

// Workflow interfaces
interface WorkflowNode {
  agent_id: number;
  next: string | null;
}

interface Workflow {
  nodes: { [key: string]: WorkflowNode };
}

interface WorkflowState {
  agents: Agent[];
  workflow: Workflow;
  ready_for_approval: boolean;
}

// Service specification for approval
interface ServiceSpecification {
  service: {
    name: string;
    description: string;
    input_type: string;
    output_type: string;
    is_public: boolean;
  };
  agents: Agent[];
  workflow: Workflow;
  ready_for_approval: boolean;
}

// Server response types
interface ChatResponse {
  type: "chat_response";
  message: string;
  conversation_history: Array<{role: string; content: string}>;
  checklist: Checklist;
  workflow_state: WorkflowState;
}

interface ApprovalRequiredResponse {
  type: "approval_required";
  message: string;
  service_specification: ServiceSpecification;
  conversation_history: Array<{role: string; content: string}>;
  checklist: Checklist;
  workflow_state: WorkflowState;
}

interface MiniService {
  id: number;
  name: string;
  description: string;
  workflow: any;
  input_type: string;
  output_type: string;
  owner_id: number;
  created_at: string;
  is_enhanced: boolean;
  is_public: boolean;
}

interface ServiceCreatedResponse {
  type: "service_created";
  mini_service: MiniService;
  agents: Agent[];
  message: string;
  conversation_history: any[];
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
  
  // Service creation success state
  const [createdService, setCreatedService] = useState<MiniService | null>(null)
  const [createdAgents, setCreatedAgents] = useState<Agent[]>([])
  const [isServiceCreated, setIsServiceCreated] = useState(false)

  // New state for tracking conversation and workflow
  const [currentChecklist, setCurrentChecklist] = useState<Checklist | null>(null)
  const [currentWorkflowState, setCurrentWorkflowState] = useState<WorkflowState | null>(null)
  const [serviceSpecification, setServiceSpecification] = useState<ServiceSpecification | null>(null)
  const [readyForApproval, setReadyForApproval] = useState(false)

  // Ref for chat messages container for auto-scroll
  const chatMessagesRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight
    }
  }, [chatHistory, isTyping])

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
    setCreatedService(null)
    setCreatedAgents([])
    setIsServiceCreated(false)
    setCurrentChecklist(null)
    setCurrentWorkflowState(null)
    setServiceSpecification(null)
    setReadyForApproval(false)
  }

  const handleChatSubmit = async () => {
    if (!userInput.trim() || readyForApproval) return

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

      // Transform conversation history to the format expected by backend
      const formattedHistory = chatHistory.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))

      const response = await fetch(`http://127.0.0.1:8000/api/v1/mini-services/chat-generate?current_user_id=${currentUserId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userInput.trim(),
          conversation_history: formattedHistory,
          approve_service: false,
          gemini_api_key: null
        })
      })

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`)
      }

      const data = await response.json()

      // Handle different response types
      if (data.type === "service_created") {
        const serviceData = data as ServiceCreatedResponse
        
        // Set service creation success state
        setCreatedService(serviceData.mini_service)
        setCreatedAgents(serviceData.agents)
        setIsServiceCreated(true)

        // Add the final success message to chat
        const successMessage: ChatMessage = {
          id: `success-${Date.now()}`,
          type: 'assistant',
          content: serviceData.message,
          timestamp: new Date()
        }
        setChatHistory(prev => [...prev, successMessage])

        // Show success toast
        toast({
          title: "Service Created Successfully!",
          description: `Your service "${serviceData.mini_service.name}" has been created with ${serviceData.agents.length} agents.`,
          duration: 5000,
        })
      } else if (data.type === "chat_response") {
        const chatData = data as ChatResponse
        
        // Update state with new information
        setCurrentChecklist(chatData.checklist)
        setCurrentWorkflowState(chatData.workflow_state)
        setReadyForApproval(false)

        // Add AI message to chat
        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          type: 'assistant',
          content: chatData.message,
          timestamp: new Date()
        }
        setChatHistory(prev => [...prev, aiMessage])
      } else if (data.type === "approval_required") {
        const approvalData = data as ApprovalRequiredResponse
        
        // Update state with service specification
        setCurrentChecklist(approvalData.checklist)
        setCurrentWorkflowState(approvalData.workflow_state)
        setServiceSpecification(approvalData.service_specification)
        setReadyForApproval(true)

        // Add AI message to chat
        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          type: 'assistant',
          content: approvalData.message,
          timestamp: new Date()
        }
        setChatHistory(prev => [...prev, aiMessage])
      } else {
        // Fallback for unknown response types
        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          type: 'assistant',
          content: data.message || "I'm sorry, I couldn't generate a proper response. Could you please try rephrasing your request?",
          timestamp: new Date()
        }
        setChatHistory(prev => [...prev, aiMessage])
      }

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

  // New function to handle service approval
  const handleApproveService = async () => {
    if (!serviceSpecification) return

    setIsLoading(true)

    try {
      const currentUserId = Cookies.get("user_id")
      const token = Cookies.get("access_token")

      const formattedHistory = chatHistory.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))

      const response = await fetch(`http://127.0.0.1:8000/api/v1/mini-services/chat-generate?current_user_id=${currentUserId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: "User approved the service",
          conversation_history: formattedHistory,
          approve_service: true,
          service_specification: serviceSpecification,
          gemini_api_key: null
        })
      })

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`)
      }

      const data = await response.json()

      if (data.type === "service_created") {
        const serviceData = data as ServiceCreatedResponse
        
        setCreatedService(serviceData.mini_service)
        setCreatedAgents(serviceData.agents)
        setIsServiceCreated(true)
        setReadyForApproval(false)

        toast({
          title: "Service Created Successfully!",
          description: `Your service "${serviceData.mini_service.name}" has been created successfully.`,
          duration: 5000,
        })
      }

    } catch (error) {
      console.error('Service approval error:', error)
      toast({
        variant: "destructive",
        title: "Creation Error",
        description: "Failed to create service. Please try again."
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRejectService = () => {
    setReadyForApproval(false)
    setServiceSpecification(null)
    setCurrentChecklist(null)
    setCurrentWorkflowState(null)
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
    setCreatedService(null)
    setCreatedAgents([])
    setIsServiceCreated(false)
    setCurrentChecklist(null)
    setCurrentWorkflowState(null)
    setServiceSpecification(null)
    setReadyForApproval(false)
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
          {/* Header - Only show when service hasn't been created */}
          {!isServiceCreated && (
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Create Your AI Service
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Choose how you'd like to build your custom AI service
              </p>
            </div>
          )}

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

          {selectedOption === 'ai' && !isServiceCreated && (
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
                    </div>                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={chatMessagesRef}>
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

                    {/* Chat Input or Approval Buttons */}
                    <div className="p-4 border-t border-purple-900/30">
                      {readyForApproval ? (
                        /* Approval Buttons */
                        <div className="space-y-4">
                          <div className="text-center">
                            <p className="text-yellow-400 text-sm mb-4 flex items-center justify-center">
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              Service specification ready for approval
                            </p>
                          </div>
                          <div className="flex gap-3">
                            <Button
                              onClick={handleApproveService}
                              disabled={isLoading}
                              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0"
                            >
                              {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <CheckCircle className="h-4 w-4 mr-2" />
                              )}
                              Create Service
                            </Button>
                            <Button
                              onClick={handleRejectService}
                              disabled={isLoading}
                              variant="outline"
                              className="flex-1 border-red-700/40 text-red-400 hover:text-white hover:bg-red-900/30"
                            >
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              Modify
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* Regular Chat Input */
                        <>
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
                        </>
                      )}
                    </div>
                  </Card>
                </div>

                {/* Dynamic Sidebar */}
                <div className="lg:col-span-1">
                  <div className="space-y-6">
                    {/* Checklist Card */}
                    {currentChecklist && (
                      <Card className="bg-black/40 backdrop-blur-sm border border-purple-900/30 rounded-2xl p-6">
                        <div className="flex items-center mb-4">
                          <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                          <h3 className="text-white font-medium">Progress Checklist</h3>
                        </div>
                        
                        <div className="space-y-3">
                          <div className={`flex items-center justify-between p-2 rounded ${currentChecklist.service_purpose.completed ? 'bg-green-900/20' : 'bg-gray-800/30'}`}>
                            <span className="text-sm text-gray-300">Service Purpose</span>
                            <div className="flex items-center gap-2">
                              {currentChecklist.service_purpose.completed ? (
                                <CheckCircle className="h-4 w-4 text-green-400" />
                              ) : (
                                <div className="h-4 w-4 border-2 border-gray-600 rounded-full" />
                              )}
                            </div>
                          </div>
                          
                          <div className={`flex items-center justify-between p-2 rounded ${currentChecklist.input_type.completed ? 'bg-green-900/20' : 'bg-gray-800/30'}`}>
                            <span className="text-sm text-gray-300">Input Type</span>
                            <div className="flex items-center gap-2">
                              {currentChecklist.input_type.completed ? (
                                <>
                                  <span className="text-xs text-green-300">{currentChecklist.input_type.value}</span>
                                  <CheckCircle className="h-4 w-4 text-green-400" />
                                </>
                              ) : (
                                <div className="h-4 w-4 border-2 border-gray-600 rounded-full" />
                              )}
                            </div>
                          </div>
                          
                          <div className={`flex items-center justify-between p-2 rounded ${currentChecklist.output_type.completed ? 'bg-green-900/20' : 'bg-gray-800/30'}`}>
                            <span className="text-sm text-gray-300">Output Type</span>
                            <div className="flex items-center gap-2">
                              {currentChecklist.output_type.completed ? (
                                <>
                                  <span className="text-xs text-green-300">{currentChecklist.output_type.value}</span>
                                  <CheckCircle className="h-4 w-4 text-green-400" />
                                </>
                              ) : (
                                <div className="h-4 w-4 border-2 border-gray-600 rounded-full" />
                              )}
                            </div>
                          </div>
                          
                          <div className={`flex items-center justify-between p-2 rounded ${currentChecklist.service_name.completed ? 'bg-green-900/20' : 'bg-gray-800/30'}`}>
                            <span className="text-sm text-gray-300">Service Name</span>
                            <div className="flex items-center gap-2">
                              {currentChecklist.service_name.completed ? (
                                <>
                                  <span className="text-xs text-green-300 font-medium">"{currentChecklist.service_name.value}"</span>
                                  <CheckCircle className="h-4 w-4 text-green-400" />
                                </>
                              ) : (
                                <div className="h-4 w-4 border-2 border-gray-600 rounded-full" />
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* Service Specification Card */}
                    {serviceSpecification && (
                      <Card className="bg-black/40 backdrop-blur-sm border border-blue-900/30 rounded-2xl p-6">
                        <div className="flex items-center mb-4">
                          <Bot className="h-5 w-5 text-blue-400 mr-2" />
                          <h3 className="text-white font-medium">Service Details</h3>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-blue-300 font-medium text-sm mb-2">Name</h4>
                            <p className="text-white text-sm bg-blue-900/20 p-2 rounded border border-blue-800/30">
                              {serviceSpecification.service.name}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="text-blue-300 font-medium text-sm mb-2">Description</h4>
                            <p className="text-gray-300 text-xs leading-relaxed bg-blue-900/10 p-2 rounded border border-blue-800/20">
                              {serviceSpecification.service.description}
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <h4 className="text-blue-300 font-medium text-xs mb-1">Input</h4>
                              <span className="text-gray-300 text-xs bg-blue-900/20 px-2 py-1 rounded">
                                {serviceSpecification.service.input_type}
                              </span>
                            </div>
                            <div>
                              <h4 className="text-blue-300 font-medium text-xs mb-1">Output</h4>
                              <span className="text-gray-300 text-xs bg-blue-900/20 px-2 py-1 rounded">
                                {serviceSpecification.service.output_type}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* Agents Card */}
                    {currentWorkflowState && currentWorkflowState.agents.length > 0 && (
                      <Card className="bg-black/40 backdrop-blur-sm border border-indigo-900/30 rounded-2xl p-6">
                        <div className="flex items-center mb-4">
                          <Sparkles className="h-5 w-5 text-indigo-400 mr-2" />
                          <h3 className="text-white font-medium">AI Agents ({currentWorkflowState.agents.length})</h3>
                        </div>
                        
                        <div className="space-y-3">
                          {currentWorkflowState.agents.map((agent, index) => (
                            <div key={index} className="bg-indigo-900/20 p-3 rounded border border-indigo-800/30">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">{index + 1}</span>
                                </div>
                                <h4 className="text-indigo-300 font-medium text-sm">{agent.name}</h4>
                              </div>
                              <p className="text-gray-400 text-xs mb-2">
                                <span className="font-medium">Type:</span> {agent.agent_type}
                              </p>
                              <p className="text-gray-300 text-xs leading-relaxed">
                                {agent.system_instruction}
                              </p>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}

                    {/* Guidelines Card - Show when no other info is available */}
                    {!currentChecklist && !serviceSpecification && !currentWorkflowState && (
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
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Service Creation Success Display - Full Width */}
          {selectedOption === 'ai' && isServiceCreated && createdService && (
            <div className="max-w-6xl mx-auto animate-fade-in">
              {/* Magic Sparkles Background Effect */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="magic-sparkles"></div>
              </div>
              
              {/* Success Header with Magic Animation */}
              <div className="text-center mb-12 relative z-10">
                <div className="relative inline-block">
                  <div className="absolute -inset-4 bg-gradient-to-r from-green-400/20 via-emerald-400/20 to-green-400/20 rounded-full blur-xl animate-pulse"></div>
                  <div className="relative w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/30 mx-auto mb-6 animate-magical-bounce">
                    <CheckCircle className="h-12 w-12 text-white animate-magical-glow" />
                  </div>
                </div>
                
                <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-gradient-to-r from-green-400 via-emerald-400 to-green-400 bg-clip-text mb-4 animate-magical-text">
                  Service Created Successfully!
                </h2>
                <p className="text-xl text-green-300 mb-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                  Your AI service is ready to use
                </p>
                
                <div className="bg-gradient-to-r from-green-900/30 via-emerald-900/30 to-green-900/30 border border-green-500/40 rounded-2xl p-6 inline-block backdrop-blur-sm animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                  <p className="text-green-200 text-lg">
                    ✨ <span className="font-bold text-white text-xl">"{createdService.name}"</span> ✨
                  </p>
                  <p className="text-green-300 text-sm mt-2">
                    Deployed with <span className="font-semibold text-white">{createdAgents.length}</span> AI agent{createdAgents.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              
              {/* Service and Agent Details with Staggered Animations */}
              <div className="grid md:grid-cols-2 gap-8 mb-12">
                {/* Service Details Card */}
                <Card className="relative overflow-hidden bg-gradient-to-br from-green-900/40 via-emerald-900/30 to-green-900/40 border border-green-500/50 backdrop-blur-sm animate-magical-slide-left">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 via-transparent to-emerald-400/10"></div>
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-green-400/20 rounded-full blur-3xl animate-magical-float"></div>
                  
                  <div className="relative z-10 p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30 animate-magical-rotate">
                        <Sparkles className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-2xl">Service Details</h3>
                        <p className="text-green-300 text-sm">Successfully created</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="group hover:bg-green-900/30 rounded-xl p-4 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/20">
                        <p className="text-sm text-gray-300">
                          <span className="text-green-400 font-bold block mb-2 text-base">Service Name</span>
                          <span className="text-white font-semibold text-lg">{createdService.name}</span>
                        </p>
                      </div>
                      
                      <div className="group hover:bg-green-900/30 rounded-xl p-4 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/20">
                        <p className="text-sm text-gray-300">
                          <span className="text-green-400 font-bold block mb-2 text-base">Description</span>
                          <span className="text-white text-base">{createdService.description}</span>
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="group hover:bg-green-900/30 rounded-xl p-4 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/20">
                          <p className="text-sm text-gray-300">
                            <span className="text-green-400 font-bold block mb-2">Input</span>
                            <span className="text-white capitalize bg-green-900/40 px-3 py-2 rounded-lg text-sm font-medium">
                              {createdService.input_type}
                            </span>
                          </p>
                        </div>
                        
                        <div className="group hover:bg-green-900/30 rounded-xl p-4 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/20">
                          <p className="text-sm text-gray-300">
                            <span className="text-green-400 font-bold block mb-2">Output</span>
                            <span className="text-white capitalize bg-green-900/40 px-3 py-2 rounded-lg text-sm font-medium">
                              {createdService.output_type}
                            </span>
                          </p>
                        </div>
                      </div>
                      
                      <div className="group hover:bg-green-900/30 rounded-xl p-4 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/20">
                        <p className="text-sm text-gray-300">
                          <span className="text-green-400 font-bold block mb-2">Visibility</span>
                          <span className={`text-white px-3 py-2 rounded-lg text-sm font-medium ${createdService.is_public ? 'bg-blue-900/40' : 'bg-gray-900/40'}`}>
                            {createdService.is_public ? 'Public' : 'Private'}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Agents Card */}
                <Card className="relative overflow-hidden bg-gradient-to-br from-blue-900/40 via-indigo-900/30 to-blue-900/40 border border-blue-500/50 backdrop-blur-sm animate-magical-slide-right">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-transparent to-indigo-400/10"></div>
                  <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl animate-magical-float" style={{ animationDelay: '1s' }}></div>
                  
                  <div className="relative z-10 p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 animate-magical-rotate" style={{ animationDelay: '0.5s' }}>
                        <Bot className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-2xl">AI Agents</h3>
                        <p className="text-blue-300 text-sm">{createdAgents.length} agent{createdAgents.length !== 1 ? 's' : ''} configured</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar">
                      {createdAgents.map((agent, index) => (
                        <div 
                          key={agent.id} 
                          className="group relative overflow-hidden bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border border-blue-700/40 rounded-xl p-5 hover:border-blue-500/60 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20 animate-fade-in-up"
                          style={{ animationDelay: `${0.7 + index * 0.1}s` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg">
                                {index + 1}
                              </div>
                              <h4 className="text-white font-bold text-base">{agent.name}</h4>
                            </div>
                            
                            <div className="space-y-2">
                              <p className="text-sm text-blue-300">
                                <span className="font-semibold">Type:</span> {agent.agent_type.replace('_', ' ').toUpperCase()}
                              </p>
                              <div className="flex items-center gap-3 text-sm">
                                <span className="bg-blue-800/50 text-blue-200 px-3 py-1 rounded-lg font-medium">
                                  {agent.input_type}
                                </span>
                                <ArrowRight className="h-4 w-4 text-blue-400" />
                                <span className="bg-indigo-800/50 text-indigo-200 px-3 py-1 rounded-lg font-medium">
                                  {agent.output_type}
                                </span>
                              </div>
                              {agent.is_enhanced && (
                                <div className="flex items-center gap-2 mt-2">
                                  <Sparkles className="h-4 w-4 text-yellow-400 animate-pulse" />
                                  <span className="text-sm text-yellow-300 font-semibold">Enhanced Agent</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Action Buttons with Magic Animation */}
              <div className="flex flex-col sm:flex-row justify-center gap-6 animate-fade-in-up" style={{ animationDelay: '1.2s' }}>
                <Button
                  onClick={() => router.push(`/apps/service/${createdService.id}`)}
                  className="relative overflow-hidden bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:from-green-600 hover:via-emerald-600 hover:to-green-700 text-white border-0 shadow-xl hover:shadow-green-500/40 transition-all duration-300 px-10 py-4 text-lg font-bold rounded-xl group transform hover:scale-105"
                  size="lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400/30 to-emerald-400/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center">
                    <FileText className="mr-3 h-6 w-6 group-hover:animate-bounce" />
                    View Service Dashboard
                    <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Button>
                
                <Button
                  onClick={handleBackToOptions}
                  variant="outline"
                  className="relative overflow-hidden border-2 border-gray-500/50 text-gray-300 hover:text-white hover:bg-gray-800/50 hover:border-gray-400 transition-all duration-300 px-10 py-4 text-lg font-bold rounded-xl group transform hover:scale-105"
                  size="lg"
                >
                  <div className="relative flex items-center">
                    <Wand2 className="mr-3 h-6 w-6 group-hover:rotate-12 transition-transform" />
                    Create Another Service
                  </div>
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
