"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { NavBar } from "@/components/nav-bar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BookOpen,
  Video,
  Headphones,
  ImageIcon,
  FileText,
  MessageSquare,
  FileVideo,
  Wand2,
  Save,
  Loader2,
  Plus,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Settings,
  Trash2,
  Key,
  CheckCircle2,
  Search,
  X,
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

// Type definitions
interface BaseAgentSetting {
  name: string
  label: string
  type: string
}

interface SelectAgentSetting extends BaseAgentSetting {
  type: "select"
  options: string[]
}

interface RangeAgentSetting extends BaseAgentSetting {
  type: "range"
  min: number
  max: number
  step: number
}

interface TextareaAgentSetting extends BaseAgentSetting {
  type: "textarea"
}

type AgentSetting = SelectAgentSetting | RangeAgentSetting | TextareaAgentSetting

interface Agent {
  id: string
  name: string
  description: string
  inputType: string
  outputType: string
  icon?: React.ComponentType<any>
  color?: string
  settings?: AgentSetting[]
  isPublic: boolean
  userId: string
  apiKey?: string
  apiKeyId?: string
  type?: string // Add type field
}

interface ApiKey {
  id: string
  name: string
  key: string
  provider: string
  lastUsed: string
  status: "active" | "expired" | "invalid"
}

interface WorkflowStep {
  id: string
  agentId: string
  settings: Record<string, any>
  next?: string | null
}

// Define input and output types
const inputTypes = [
  { value: "text", label: "Text", icon: MessageSquare },
  { value: "image", label: "Image", icon: ImageIcon },
  { value: "sound", label: "Sound", icon: Headphones },
  { value: "video", label: "Video", icon: Video },
 { value: "document", label: "Document", icon: FileText },
]

const outputTypes = [
  { value: "text", label: "Text", icon: MessageSquare },
  { value: "image", label: "Image", icon: ImageIcon },
  { value: "sound", label: "Sound", icon: Headphones },
  { value: "video", label: "Video", icon: Video },
  { value: "document", label: "Document", icon: FileText },
  
]

const iconOptions = [
  { value: "BookOpen", label: "Book", icon: BookOpen },
  { value: "Video", label: "Video", icon: Video },
  { value: "Headphones", label: "Headphones", icon: Headphones },
  { value: "ImageIcon", label: "Image", icon: ImageIcon },
  { value: "FileText", label: "Document", icon: FileText },
  { value: "MessageSquare", label: "Chat", icon: MessageSquare },
  { value: "FileVideo", label: "Video File", icon: FileVideo },
  { value: "Wand2", label: "Magic Wand", icon: Wand2 },
]

const colorOptions = [
  { value: "from-blue-600 to-blue-800", label: "Blue" },
  { value: "from-purple-600 to-purple-800", label: "Purple" },
  { value: "from-green-600 to-green-800", label: "Green" },
  { value: "from-pink-600 to-pink-800", label: "Pink" },
  { value: "from-orange-600 to-orange-800", label: "Orange" },
  { value: "from-red-600 to-red-800", label: "Red" },
  { value: "from-emerald-600 to-teal-800", label: "Teal" },
  { value: "from-yellow-600 to-amber-800", label: "Amber" },
  { value: "from-indigo-600 to-violet-800", label: "Indigo" },
]

// Progress steps for the workflow builder
const progressSteps = [
  { id: "details", label: "Service Details" },
  { id: "workflow", label: "Workflow Builder" },
  { id: "preview", label: "Preview & Deploy" },
]

interface ApiKeyData {
  api_key?: string;
  api_key_id?: string;
  provider?: string;
}

interface AgentType {
  type: string;
  input_type: string;
  output_type: string;
}

export default function ServiceWorkflowBuilder() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isCreatingAgent, setIsCreatingAgent] = useState(false)
  const [activeTab, setActiveTab] = useState("details")
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  //const [agentSettingsOpen, setAgentSettingsOpen] = useState<string | null>(null)
  const [agentInfoOpen, setAgentInfoOpen] = useState<string | null>(null)
  const [agentDetails, setAgentDetails] = useState<any>(null)
  const [isLoadingAgentDetails, setIsLoadingAgentDetails] = useState(false)
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([])
  const [savedApiKeys, setSavedApiKeys] = useState<ApiKey[]>([])
  const [isLoadingApiKeys, setIsLoadingApiKeys] = useState(false)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [selectedApiKey, setSelectedApiKey] = useState<string>("")
  const [customApiKey, setCustomApiKey] = useState<string>("")
  const [useCustomApiKey, setUseCustomApiKey] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null) // Add error state
  const userId = Cookies.get("user_id") || "current-user"
  const [serviceData, setServiceData] = useState({
    title: "",
    description: "",
    icon: "Wand2",
    color: "from-purple-600 to-purple-800",
    inputType: "select",  // This will now be the actual workflow input type
    outputType: "select", // This will now be the actual workflow output type
    placeholder: "",
    buttonText: "Generate",
    isPublic: false,
  })

  // Add new state for filtering
  const [filterTypes, setFilterTypes] = useState({
    inputType: "select",
    outputType: "select"
  });

  const [workflow, setWorkflow] = useState<WorkflowStep[]>([])
  const [newAgentData, setNewAgentData] = useState({
    name: "",
    description: "",
    inputType: "text",
    outputType: "text",
    systemInstruction: "",
    config: {} as Record<string, any>,
    isPublic: false,
    agentType: "", // Boş bırakıyoruz, kullanıcı seçmek zorunda
    enhancePrompt: false, //Add enhance prompt to agent data
  })

  const { toast } = useToast()

  const [agentTypes, setAgentTypes] = useState<AgentType[]>([]);
  const [isLoadingAgentTypes, setIsLoadingAgentTypes] = useState(false);

  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchAgentTypes = async () => {
      setIsLoadingAgentTypes(true);
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/v1/agents/types?current_user_id=${userId}`, {
          headers: {
            "Authorization": `Bearer ${Cookies.get("access_token")}`,
            "Content-Type": "application/json"
          }
        });
        if (!res.ok) throw new Error("Failed to fetch agent types");
        const types = await res.json();
        setAgentTypes(types);
      } catch (err) {
        console.error("Error fetching agent types:", err);
        setAgentTypes([]);
      } finally {
        setIsLoadingAgentTypes(false);
      }
    };
    fetchAgentTypes();
  }, []);

  // Fetch available agents and API keys on component mount
  useEffect(() => {
    fetchAgents()
    fetchApiKeys()
  }, [])

  // Fetch available agents from the backend
  async function fetchAgents() {
    try {
      setIsLoading(true)
      

      try {
        const response = await fetch(`http://127.0.0.1:8000/api/v1/agents/?current_user_id=${userId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Cookies.get("access_token")}`,
          },
        })

        if (!response.ok) throw new Error("Failed to fetch agents")
        const agentsRaw = await response.json()

        // Transform backend data to match our frontend interface
        const agents: Agent[] = agentsRaw.map((a: any) => ({
          id: a.id.toString(),
          name: a.name,
          description: a.description || "",
          inputType: a.input_type || "text",
          outputType: a.output_type || "text",
          icon: getIconForType(a.output_type),
          color: getColorForType(a.input_type),
          settings: getSettingsForAgent(a),
          isPublic: a.is_public || false,
          userId: a.user_id || "",
          apiKey: a.api_key,
          apiKeyId: a.api_key_id,
          type: a.agent_type,
        }))

        console.log("Mapped agents:", agents);

        setAvailableAgents(agents)
      } catch (error) {
        console.error("Error fetching agents:", error)
        // If API fails, use localStorage as fallback
        const localAgents = localStorage.getItem("availableAgents")
        if (localAgents) {
          setAvailableAgents(JSON.parse(localAgents))
        } else {
          setAvailableAgents([])
        }
      }
    } catch (error) {
      console.error("Error in fetchAgents:", error)
      setAvailableAgents([])
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch saved API keys
  async function fetchApiKeys() {
    try {
      setIsLoadingApiKeys(true)


      try {
        const response = await fetch(`http://127.0.0.1:8000/api/v1/api-keys?current_user_id=${userId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Cookies.get("access_token") || ""}`,
          },
        })

        if (!response.ok) throw new Error("Failed to fetch API keys")
        const data = await response.json()

        // Transform the data to match our frontend interface
        const formattedKeys = data.map((key: any) => ({
          id: key.id.toString(),
          name: key.provider.charAt(0).toUpperCase() + key.provider.slice(1) + " Key",
          provider: key.provider,
          lastUsed: key.last_used || "Never",
          status: "active", // assuming keys are active
        }))

        setSavedApiKeys(formattedKeys)
        setApiKeys(formattedKeys)
      } catch (error) {
        console.error("Error fetching API keys:", error)
        // If API fails, use localStorage as fallback
        const localApiKeys = localStorage.getItem("savedApiKeys")
        if (localApiKeys) {
          setSavedApiKeys(JSON.parse(localApiKeys))
        } else {
          setSavedApiKeys([])
        }
      }
    } catch (error) {
      console.error("Error in fetchApiKeys:", error)
      setSavedApiKeys([])
    } finally {
      setIsLoadingApiKeys(false)
    }
  }

  // Helper functions for mapping backend data
  function getIconForType(outputType: string): React.ComponentType<any> {
    switch (outputType) {
      case "text":
        return MessageSquare
      case "image":
        return ImageIcon
      case "video":
        return Video
      case "document":
        return FileText
      case "sound":
        return Headphones
      default:
        return MessageSquare
    }
  }

  function getColorForType(type: string): string {
    switch (type) {
      case "text":
        return "from-blue-600 to-blue-800"
      case "image":
        return "from-pink-600 to-pink-800"
      case "video":
        return "from-red-600 to-red-800"
      case "file":
        return "from-red-600 to-red-800"
      case "sound":
        return "from-green-600 to-green-800"
      default:
        return "from-purple-600 to-purple-800"
    }
  }

  function getSettingsForAgent(agent: any): AgentSetting[] {
    // Extract settings from agent config
    const settings: AgentSetting[] = []

    if (agent.config) {
      Object.entries(agent.config).forEach(([key, value]) => {
        if (typeof value === "string" && ["gpt-4", "gpt-3.5-turbo", "claude-3"].includes(value)) {
          settings.push({
            name: key,
            label: key.charAt(0).toUpperCase() + key.slice(1),
            type: "select",
            options: ["gpt-4", "gpt-3.5-turbo", "claude-3"],
          })
        } else if (typeof value === "number" && key === "temperature") {
          settings.push({
            name: key,
            label: "Temperature",
            type: "range",
            min: 0,
            max: 1,
            step: 0.1,
          })
        } else if (typeof value === "string" && value.length > 20) {
          settings.push({
            name: key,
            label: key.charAt(0).toUpperCase() + key.slice(1),
            type: "textarea",
          })
        }
      })
    }

    // Add system instruction if it exists
    if (agent.system_instruction) {
      settings.push({
        name: "systemInstruction",
        label: "System Instruction",
        type: "textarea",
      })
    }

    return settings
  }

  // Update the handleInputTypeChange to use filterTypes
  const handleInputTypeChange = (value: string) => {
    setFilterTypes(prev => ({
      ...prev,
      inputType: value
    }));
  }

  // Add output type change handler for filters
  const handleOutputTypeChange = (value: string) => {
    setFilterTypes(prev => ({
      ...prev,
      outputType: value
    }));
  }

  // Get the required input type based on the last agent's output
  const getRequiredInputType = (): string | null => {
    if (workflow.length === 0) return null;
    
    const lastStep = workflow.find(step => step.next === null);
    if (!lastStep) return null;

    const previousAgent = availableAgents.find(agent => agent.id === lastStep.agentId);
    return previousAgent ? previousAgent.outputType : null;
  };

  // Update getCompatibleAgents to use required input type
  const getCompatibleAgents = (): Agent[] => {
    const requiredInputType = getRequiredInputType();

    if (workflow.length === 0) {
      // First step: Filter based on selected filter types
      return availableAgents.filter(agent => {
        const inputMatches = filterTypes.inputType === "select" || agent.inputType === filterTypes.inputType;
        const outputMatches = filterTypes.outputType === "select" || agent.outputType === filterTypes.outputType;
        return inputMatches && outputMatches;
      });
    } else {
      // For subsequent steps: Input must match previous agent's output
      return availableAgents.filter(agent => {
        const inputMatches = agent.inputType === requiredInputType;
        const outputMatches = filterTypes.outputType === "select" || agent.outputType === filterTypes.outputType;
        return inputMatches && outputMatches;
      });
    }
  };

  // Add an agent to the workflow
  const addAgentToWorkflow = (agentId: string) => {
    const agent = availableAgents.find((a) => a.id === agentId)
    if (!agent) return

    // Create default settings for the agent
    const defaultSettings: Record<string, any> = {}
    if (agent.settings) {
      agent.settings.forEach((setting) => {
        if (setting.type === "select" && setting.options.length > 0) {
          defaultSettings[setting.name] = setting.options[0]
        } else if (setting.type === "range") {
          defaultSettings[setting.name] = (setting.min + setting.max) / 2
        } else {
          defaultSettings[setting.name] = ""
        }
      })
    }

    const newStepId = `step-${Date.now()}`

    setWorkflow((prev) => {
      if (prev.length === 0) {
        // If this is the first agent, set both input and output types
        setServiceData(current => ({
          ...current,
          inputType: agent.inputType,
          outputType: agent.outputType
        }));
        return [{ id: newStepId, agentId, settings: defaultSettings, next: null }]
      }

      const lastStep = prev.find((step) => step.next === null)
      if (lastStep) {
        // When adding subsequent agents, only update the output type
        setServiceData(current => ({
          ...current,
          outputType: agent.outputType
        }));
        return prev
          .map((step) => (step.id === lastStep.id ? { ...step, next: newStepId } : step))
          .concat([{ id: newStepId, agentId, settings: defaultSettings, next: null }])
      }

      return [...prev, { id: newStepId, agentId, settings: defaultSettings, next: null }]
    })

    setSelectedAgent(null)
  }

  // Remove a step from the workflow
  const removeWorkflowStep = (stepId: string) => {
    const previousStep = workflow.find((step) => step.next === stepId)
    const targetStep = workflow.find((step) => step.id === stepId)
    const nextStepId = targetStep?.next

    setWorkflow((prev) => {
      const newWorkflow = previousStep
        ? prev
            .map((step) => (step.id === previousStep.id ? { ...step, next: nextStepId } : step))
            .filter((step) => step.id !== stepId)
        : prev.filter((step) => step.id !== stepId)

      if (newWorkflow.length === 0) {
        // If no steps remain, reset to select
        setServiceData(current => ({
          ...current,
          inputType: "select",
          outputType: "select"
        }));
      } else {
        // Update service output type based on the new last agent
        updateServiceOutputType(newWorkflow);
      }

      return newWorkflow
    })
  }

  // Update agent settings
  const updateAgentSettings = (stepId: string, settingName: string, value: any) => {
    setWorkflow((prev) =>
      prev.map((step) =>
        step.id === stepId ? { ...step, settings: { ...step.settings, [settingName]: value } } : step,
      ),
    )
  }

  // Helper function to update service output type based on the last agent
  const updateServiceOutputType = (workflowSteps: WorkflowStep[]) => {
    const lastStep = workflowSteps.find(step => step.next === null);
    if (lastStep) {
      const lastAgent = availableAgents.find(a => a.id === lastStep.agentId);
      if (lastAgent) {
        setServiceData(current => ({
          ...current,
          outputType: lastAgent.outputType
        }));
      }
    }
  };

  // Ensure getOrderedWorkflow is correctly implemented
  const getOrderedWorkflow = () => {
    if (workflow.length === 0) return [];
  
    // Find the first step (the one that no other step points to)
    const allTargetIds = workflow.map((step) => step.next).filter(Boolean) as string[];
    const firstStepId = workflow.find((step) => !allTargetIds.includes(step.id))?.id;
  
    if (!firstStepId) {
      console.warn("Could not determine first step - workflow might have cycles");
      return workflow; // Fallback if we can't determine the first step
    }
  
    const ordered: WorkflowStep[] = [];
    let currentId = firstStepId;
    const visited = new Set<string>(); // Track visited steps to prevent infinite loops
  
    // Walk through the workflow in order
    while (currentId) {
      if (visited.has(currentId)) {
        console.warn("Cycle detected in workflow", { currentId, visited });
        break; // Prevent infinite loop
      }
      
      const currentStep = workflow.find((step) => step.id === currentId);
      if (!currentStep) break;
  
      visited.add(currentId);
      ordered.push(currentStep);
      currentId = currentStep.next || "";
      
      // Safety check to prevent infinite loops
      if (ordered.length > workflow.length) {
        console.error("Potential infinite loop detected in getOrderedWorkflow");
        break;
      }
    }
  
    return ordered;
  };
  
  // Fix the moveStepUp function
  const moveStepUp = (stepId: string) => {
    const orderedSteps = getOrderedWorkflow();
    const stepIndex = orderedSteps.findIndex((step) => step.id === stepId);
    
    if (stepIndex <= 0) return; // Already at the top or not found
    
    // Create a deep copy of the workflow
    const newWorkflow = JSON.parse(JSON.stringify(workflow));
    
    // Get the steps involved
    const currentStep = orderedSteps[stepIndex];
    const previousStep = orderedSteps[stepIndex - 1];
    const beforePreviousStep = stepIndex > 1 ? orderedSteps[stepIndex - 2] : null;
    
    // Find the actual step objects in the new workflow
    const currentStepInNew = newWorkflow.find((s: any) => s.id === currentStep.id);
    const previousStepInNew = newWorkflow.find((s: any) => s.id === previousStep.id);
    
    // If we're moving the second step up (to first position)
    if (stepIndex === 1) {
      // Current step becomes first (no incoming connection)
      // Previous step (was first) now points to what current pointed to
      currentStepInNew.next = previousStep.id;
      previousStepInNew.next = currentStep.next;
    } else {
      // We're moving a step that's not the second one
      // Find the step that pointed to the previous step
      const stepPointingToPrevious = newWorkflow.find((s: any) => s.next === previousStep.id);
      if (stepPointingToPrevious) {
        // Make it point to the current step instead
        stepPointingToPrevious.next = currentStep.id;
      }
      
      // Make current step point to previous step
      currentStepInNew.next = previousStep.id;
      
      // Make previous step point to what current step was pointing to
      previousStepInNew.next = currentStep.next;
    }
    
    setWorkflow(newWorkflow);
  };
  
  // Fix the moveStepDown function
  const moveStepDown = (stepId: string) => {
    const orderedSteps = getOrderedWorkflow();
    const stepIndex = orderedSteps.findIndex((step) => step.id === stepId);
    
    if (stepIndex === -1 || stepIndex >= orderedSteps.length - 1) return; // Already at the bottom or not found
    
    // Create a deep copy of the workflow
    const newWorkflow = JSON.parse(JSON.stringify(workflow));
    
    // Get the steps involved
    const currentStep = orderedSteps[stepIndex];
    const nextStep = orderedSteps[stepIndex + 1];
    
    // Find the actual step objects in the new workflow
    const currentStepInNew = newWorkflow.find((s: any) => s.id === currentStep.id);
    const nextStepInNew = newWorkflow.find((s: any) => s.id === nextStep.id);
    
    // If we're moving the first step down
    if (stepIndex === 0) {
      // Next step becomes first step (no incoming connections)
      // Current step (was first) now points to what next step pointed to
      nextStepInNew.next = currentStep.id;
      currentStepInNew.next = nextStep.next;
    } else {
      // Find the step that pointed to the current step
      const stepPointingToCurrent = newWorkflow.find((s: any) => s.next === currentStep.id);
      if (stepPointingToCurrent) {
        // Make it point to the next step instead
        stepPointingToCurrent.next = nextStep.id;
      }
      
      // Make next step point to current step
      nextStepInNew.next = currentStep.id;
      
      // Make current step point to what next step was pointing to
      currentStepInNew.next = nextStep.next;
    }
    
    setWorkflow(newWorkflow);
  };

  // Create a new agent
  const createAgent = async () => {
    try {
      setIsCreatingAgent(true);
      if (!userId) {
        console.error("Authentication Error: No user ID found");
        throw new Error("User not authenticated")
      }

      // Clone the config object to avoid mutation
      let config = {...newAgentData.config};
      
      // For all agent types, add the custom API key to the config if provided
      if (useCustomApiKey && customApiKey) {
        config = {
          ...config,
          api_key: customApiKey
        };
      }
      
      const agentData = {
        name: newAgentData.name,
        description: newAgentData.description,
        input_type: newAgentData.inputType,
        output_type: newAgentData.outputType,
        system_instruction: newAgentData.systemInstruction,
        config: config,
        is_public: newAgentData.isPublic,
        agent_type: newAgentData.agentType,
        api_key: useCustomApiKey ? customApiKey : null,
        api_key_id: useCustomApiKey ? null : selectedApiKey,
        enhance_prompt: newAgentData.enhancePrompt ? 1 : 0 // Add enhance_prompt parameter
      }

      console.log("Creating agent with data:", {
        ...agentData,
        api_key: agentData.api_key ? "PRESENT" : "NOT_PRESENT",
        api_key_id: agentData.api_key_id,
        config: {
          ...agentData.config,
          api_key: agentData.config.api_key ? "PRESENT IN CONFIG" : "NOT PRESENT IN CONFIG"
        },
        useCustomApiKey,
        customKeyProvided: !!customApiKey
      });
      //Agent create endpoint
      const enhancePrompt = newAgentData.enhancePrompt ? 1 : 0;
      const apiUrl = `http://127.0.0.1:8000/api/v1/agents/?enhance_prompt=${enhancePrompt}&current_user_id=${userId}`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Cookies.get("access_token")}`
        },
        body: JSON.stringify(agentData)
      })

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error Response:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`Failed to create agent: ${JSON.stringify(errorData)}`)
      }

      const data = await response.json()
      console.log("Agent created successfully:", data);

      // Yeni agent oluşturulduktan sonra agent listesini güncelle
      await fetchAgents();

      setNewAgentData({
        name: "",
        description: "",
        inputType: "text",
        outputType: "text",
        systemInstruction: "",
        enhancePrompt: false,
        config: {},
        isPublic: false,
        agentType: "text"
      })
      setSelectedApiKey("")
      setCustomApiKey("")
      setUseCustomApiKey(false)
      
      // Başarı mesajı göster
      toast({
        title: "Agent oluşturuldu",
        description: "Yeni agent başarıyla oluşturuldu ve listeye eklendi.",
      })
      
      return data
    } catch (error: any) {
      console.error("Detailed error in createAgent:", {
        error,
        message: error.message,
        stack: error.stack,
        newAgentData,
        selectedApiKey: selectedApiKey ? "PRESENT" : "NOT_PRESENT",
        customApiKey: customApiKey ? "PRESENT" : "NOT_PRESENT"
      });
      
      // Hata mesajı göster
      toast({
        variant: "destructive",
        title: "Agent creation failed",
        description: error.message || "An error occurred while creating the agent.",
      });
      
      throw error
    } finally {
      setIsCreatingAgent(false);
    }
  }

  // Format workflow for API
  const formatWorkflowForAPI = () => {
    const orderedSteps = getOrderedWorkflow();
    const nodes: Record<string, any> = {};

    orderedSteps.forEach((step, index) => {
      const agent = availableAgents.find(a => a.id === step.agentId);
      if (!agent) return;

      const nodeId = index.toString(); // Start from 0
      nodes[nodeId] = {
        agent_id: parseInt(step.agentId),
        next: index < orderedSteps.length - 1 ? (index + 1).toString() : null,
        settings: step.settings,
        agent_type: agent.type || "text"
      };
    });

    return { nodes };
  };

  // API keys are now handled at the agent level
  



  // Enhanced handleSubmit with more detailed logging
const handleSubmit = async () => {
  setIsLoading(true);
 
  try {
    console.log("Current user ID:", userId);
    console.log("Current serviceData:", serviceData);
    
    const formattedWorkflow = formatWorkflowForAPI();
    console.log("Formatted workflow:", formattedWorkflow);
    
    // Log available agents with more detail
    console.log("Available agents:", availableAgents.map(a => ({
      id: a.id,
      name: a.name,
      type: a.type,
      userId: a.userId
    })));
    
    // Validate workflow agents - only check if they exist, not ownership
    const workflowAgentIds = Object.values(formattedWorkflow.nodes).map(node => node.agent_id);
    console.log("Workflow agent IDs:", workflowAgentIds);
    
    const missingAgents = workflowAgentIds.filter(agentId => {
      const agent = availableAgents.find(a => a.id === agentId.toString());
      if (!agent) {
        console.log(`Agent ${agentId} not found in available agents`);
        return true;
      }
      return false;
    });
    
    if (missingAgents.length > 0) {
      toast({
        variant: "destructive",
        title: "Invalid Agents",
        description: `Some agents in the workflow (${missingAgents.join(', ')}) were not found.`,
      });
      setIsLoading(false);
      return;
    }
    
    const serviceDataToSend = {
      name: serviceData.title,
      description: serviceData.description || "",
      input_type: serviceData.inputType,
      output_type: serviceData.outputType,
      workflow: formattedWorkflow,
      icon: serviceData.icon,
      color: serviceData.color,
      placeholder: serviceData.placeholder,
      button_text: serviceData.buttonText,
      is_public: serviceData.isPublic
    };
    
    console.log("Service data to be sent:", JSON.stringify(serviceDataToSend, null, 2));
    
    const response = await fetch(`http://127.0.0.1:8000/api/v1/mini-services?current_user_id=${userId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Cookies.get("access_token") || ""}`,
      },
      body: JSON.stringify(serviceDataToSend),
    });

    const responseBody = await response.text();
    console.log("Response status:", response.status);
    console.log("Response body:", responseBody);

    if (!response.ok) {
      toast({
        variant: "destructive",
        title: "Service Creation Failed",
        description: responseBody,
      });
      throw new Error("Failed to create service");
    }

    router.push("/apps");
  } catch (error) {
    console.error("Error in handleSubmit:", error);
    setError(error instanceof Error ? error.message : "Failed to create service");
  } finally {
    setIsLoading(false);
  }
};

  // Get the selected icon component
  const SelectedIcon = iconOptions.find((icon) => icon.value === serviceData.icon)?.icon || Wand2

  // Get the input type icon
  const InputTypeIcon = inputTypes.find((type) => type.value === serviceData.inputType)?.icon || MessageSquare

  // Get the output type icon
  const OutputTypeIcon = outputTypes.find((type) => type.value === serviceData.outputType)?.icon || MessageSquare

  const orderedWorkflow = getOrderedWorkflow()

  // Calculate progress percentage
  const getProgressPercentage = () => {
    const stepIndex = progressSteps.findIndex((step) => step.id === activeTab)
    if (stepIndex === -1) return 0
    return ((stepIndex + 1) / progressSteps.length) * 100
  }

  // Add this useEffect to load data from localStorage on component mount
  useEffect(() => {
    // Load agents from localStorage if available
    const localAgents = localStorage.getItem("availableAgents")
    if (localAgents) {
      try {
        setAvailableAgents(JSON.parse(localAgents))
      } catch (e) {
        console.error("Error parsing local agents:", e)
      }
    }

    // Load API keys from localStorage if available
    const localApiKeys = localStorage.getItem("savedApiKeys")
    if (localApiKeys) {
      try {
        setSavedApiKeys(JSON.parse(localApiKeys))
      } catch (e) {
        console.error("Error parsing local API keys:", e)
      }
    }
    
    // Fetch API keys from server for agent creation
    fetchApiKeys();
  }, [])

  // API key selection is now handled at the agent level

  // Add handleChange function back for other service properties
  const handleChange = (field: string, value: string | boolean) => {
    setServiceData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getFilteredAgents = (): Agent[] => {
    const compatibleAgents = getCompatibleAgents()
    
    if (!searchQuery.trim()) {
      return compatibleAgents
    }
    
    return compatibleAgents.filter(agent => 
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  // Add this function after fetchAgents()
  const fetchAgentDetails = async (agentId: string) => {
    try {
      setIsLoadingAgentDetails(true)
      const response = await fetch(`http://127.0.0.1:8000/api/v1/agents/${agentId}`, {
        headers: {
          "Authorization": `Bearer ${Cookies.get("access_token")}`,
          "Content-Type": "application/json"
        }
      })
      
      if (!response.ok) throw new Error("Failed to fetch agent details")
      const data = await response.json()
      setAgentDetails(data)
    } catch (error) {
      console.error("Error fetching agent details:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch agent details"
      })
    } finally {
      setIsLoadingAgentDetails(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black">
      <NavBar />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Create Custom AI Service</h1>
            <p className="text-gray-400">Design your own AI service workflow</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {progressSteps.map((step, index) => (
                <div
                  key={step.id}
                  className={cn(
                    "flex flex-col items-center relative",
                    "md:flex-row md:items-center",
                    {
                      "text-purple-400":
                        activeTab === step.id || progressSteps.findIndex((s) => s.id === activeTab) > index,
                    },
                    {
                      "text-gray-500":
                        activeTab !== step.id && progressSteps.findIndex((s) => s.id === activeTab) < index,
                    },
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center z-10",
                      {
                        "bg-purple-600":
                          activeTab === step.id || progressSteps.findIndex((s) => s.id === activeTab) > index,
                      },
                      {
                        "bg-gray-800 border border-gray-700":
                          activeTab !== step.id && progressSteps.findIndex((s) => s.id === activeTab) < index,
                      },
                    )}
                  >
                    {activeTab === step.id ? (
                      <span className="text-white font-medium">{index + 1}</span>
                    ) : progressSteps.findIndex((s) => s.id === activeTab) > index ? (
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    ) : (
                      <span className="text-gray-400">{index + 1}</span>
                    )}
                  </div>
                  <span className="mt-2 text-sm font-medium md:ml-2 md:mt-0">{step.label}</span>
                </div>
              ))}
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2.5">
              <div
                className="bg-gradient-to-r from-purple-600 to-purple-800 h-2.5 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
          </div>

          <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            

            {/* Service Details Tab */}
            <TabsContent value="details" className="space-y-6">
              <Card className="bg-black/40 backdrop-blur-sm border border-purple-900/30 p-6">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-white">
                      Service Title
                    </Label>
                    <Input
                      id="title"
                      value={serviceData.title}
                      onChange={(e) => handleChange("title", e.target.value)}
                      placeholder="E.g., Custom Image Generator"
                      className="bg-black/40 border-purple-900/30 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-white">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={serviceData.description}
                      onChange={(e) => handleChange("description", e.target.value)}
                      placeholder="Describe what your service does..."
                      className="bg-black/40 border-purple-900/30 text-white min-h-[80px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="icon" className="text-white">
                        Icon
                      </Label>
                      <Select value={serviceData.icon} onValueChange={(value) => handleChange("icon", value)}>
                        <SelectTrigger id="icon" className="bg-black/40 border-purple-900/30 text-white">
                          <SelectValue placeholder="Select an icon" />
                        </SelectTrigger>
                        <SelectContent>
                          <div className="bg-black/90 border-purple-900/30 text-white">
                            {iconOptions.map((icon) => (
                              <SelectItem key={icon.value} value={icon.value} className="flex items-center">
                                <div className="flex items-center">
                                  <icon.icon className="h-4 w-4 mr-2" />
                                  <span>{icon.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </div>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="color" className="text-white">
                        Color Theme
                      </Label>
                      <Select value={serviceData.color} onValueChange={(value) => handleChange("color", value)}>
                        <SelectTrigger id="color" className="bg-black/40 border-purple-900/30 text-white">
                          <SelectValue placeholder="Select a color" />
                        </SelectTrigger>
                        <SelectContent>
                          <div className="bg-black/90 border-purple-900/30 text-white">
                            {colorOptions.map((color) => (
                              <SelectItem key={color.value} value={color.value}>
                                <div className="flex items-center">
                                  <div className={`h-4 w-4 rounded-full bg-gradient-to-r ${color.value} mr-2`}></div>
                                  <span>{color.label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </div>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="placeholder" className="text-white">
                      Input Placeholder
                    </Label>
                    <Input
                      id="placeholder"
                      value={serviceData.placeholder}
                      onChange={(e) => handleChange("placeholder", e.target.value)}
                      placeholder="E.g., Enter your prompt here..."
                      className="bg-black/40 border-purple-900/30 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="buttonText" className="text-white">
                      Button Text
                    </Label>
                    <Input
                      id="buttonText"
                      value={serviceData.buttonText}
                      onChange={(e) => handleChange("buttonText", e.target.value)}
                      placeholder="E.g., Generate"
                      className="bg-black/40 border-purple-900/30 text-white"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={() => setActiveTab("workflow")}
                      className="bg-gradient-to-r from-purple-600 to-purple-800 text-white hover:opacity-90"
                    >
                      Continue to Workflow Builder
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Workflow Builder Tab */}
            <TabsContent value="workflow" className="space-y-6">
              <Card className="bg-black/40 backdrop-blur-sm border border-purple-900/30 p-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-white">Workflow Builder</h3>
                    <Badge variant="outline" className="bg-purple-900/20">
                      {orderedWorkflow.length} {orderedWorkflow.length === 1 ? "Step" : "Steps"}
                    </Badge>
                  </div>

                

                  {availableAgents.length === 0 && !isLoading && (
                    <div className="bg-red-900/20 border border-purple-900/30 rounded-md p-4 mb-4">
                      <p className="text-white text-sm">
                        No agents are available. First you need to create agents to use in your workflow.
                      </p>
                    </div>
                  )}

                  <div className="bg-black/40 rounded-lg border border-purple-900/30 p-4">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                        <InputTypeIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="ml-3">
                        <h4 className="text-white font-medium">Input</h4>
                        <p className="text-gray-400 text-sm">
                          {serviceData.inputType === "select" 
                            ? "Select input type" 
                            : inputTypes.find((type) => type.value === serviceData.inputType)?.label || "Text Input"}
                        </p>
                      </div>
                    </div>

                    {/* Workflow Steps */}
                    <div className="space-y-4 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-white text-sm font-medium">Workflow Steps</h5>
                        
                        {/* Filter Controls - Responsive Version */}
                        <div className="flex flex-col md:flex-row md:items-center gap-2 w-full md:w-auto">
                          {/* Search Button/Input */}
                          <div className="relative w-full md:w-auto">
                            {isSearchOpen ? (
                              <div className="flex items-center bg-black/40 border border-purple-900/30 rounded-md pr-1 w-full">
                                <Input
                                  type="text"
                                  placeholder="Search agents..."
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  className="h-8 text-xs border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-white w-full"
                                  autoFocus
                                  onBlur={() => {
                                    if (!searchQuery) {
                                      setIsSearchOpen(false)
                                    }
                                  }}
                                />
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-7 w-7 p-0 flex-shrink-0"
                                  onClick={() => {
                                    setSearchQuery("")
                                    setIsSearchOpen(false)
                                  }}
                                >
                                  <X className="h-3 w-3 text-gray-400" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 bg-black/40 border-purple-900/30 hover:bg-purple-900/20 w-full md:w-auto"
                                onClick={() => setIsSearchOpen(true)}
                              >
                                <Search className="h-4 w-4 text-white mr-2" />
                                
                              </Button>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-2 w-full md:w-auto">
                            <Select 
                              value={workflow.length > 0 ? getRequiredInputType() || "select" : filterTypes.inputType} 
                              onValueChange={handleInputTypeChange}
                              disabled={workflow.length > 0}
                            >
                              <SelectTrigger 
                                id="inputType" 
                                className={cn(
                                  "bg-black/40 border-purple-900/30 text-white h-8 text-xs flex-1 min-w-[120px] md:w-[140px]",
                                  workflow.length > 0 && "opacity-50 cursor-not-allowed"
                                )}
                              >
                                <SelectValue placeholder="Input Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <div className="bg-black/90 border-purple-900/30 text-white">
                                  <SelectItem value="select">All Inputs</SelectItem>
                                  {inputTypes.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                      <div className="flex items-center">
                                        <type.icon className="h-3 w-3 mr-2" />
                                        <span>{type.label}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </div>
                              </SelectContent>
                            </Select>
                            
                            <Select 
                              value={filterTypes.outputType} 
                              onValueChange={handleOutputTypeChange}
                            >
                              <SelectTrigger 
                                id="outputType" 
                                className="bg-black/40 border-purple-900/30 text-white h-8 text-xs flex-1 min-w-[120px] md:w-[140px]"
                              >
                                <SelectValue placeholder="Output Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <div className="bg-black/90 border-purple-900/30 text-white">
                                  <SelectItem value="select">All Outputs</SelectItem>
                                  {outputTypes.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                      <div className="flex items-center">
                                        <type.icon className="h-3 w-3 mr-2" />
                                        <span>{type.label}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </div>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {orderedWorkflow.map((step, index) => {
                        const agent = availableAgents.find((a) => a.id === step.agentId)
                        if (!agent) return null

                        return (
                          <div key={step.id} className="relative">
                            {/* Connector line */}
                            {index > 0 && <div className="absolute left-5 -top-4 w-0.5 h-4 bg-purple-500/50"></div>}

                            <div className="bg-gray-900/50 rounded-lg border border-purple-900/30 p-4">
                              <div className="flex items-start">
                                <div
                                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${agent.color} flex items-center justify-center flex-shrink-0`}
                                >
                                  {agent.icon && <agent.icon className="h-5 w-5 text-white" />}
                                </div>

                                <div className="ml-3 flex-grow">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-white font-medium">{agent.name}</h4>
                                    <div className="flex space-x-1">
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-7 w-7 rounded-full hover:bg-gray-800"
                                              onClick={() => {
                                                setAgentInfoOpen(agentInfoOpen === step.id ? null : step.id)
                                                if (agentInfoOpen !== step.id) {
                                                  fetchAgentDetails(step.agentId)
                                                }
                                              }}
                                            >
                                              <BookOpen className="h-4 w-4 text-gray-400" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Agent Info</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>

                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-7 w-7 rounded-full hover:bg-gray-800 hover:text-red-400"
                                              onClick={() => removeWorkflowStep(step.id)}
                                            >
                                              <Trash2 className="h-4 w-4 text-gray-400" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Remove Step</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>
                                  </div>

                                  <p className="text-gray-400 text-sm">{agent.description}</p>

                                  <div className="flex mt-2 space-x-2">
                                    <Badge variant="outline" className="bg-purple-900/20 text-xs">
                                      Input: {agent.inputType}
                                    </Badge>
                                    <Badge variant="outline" className="bg-purple-900/20 text-xs">
                                      Output: {agent.outputType}
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              {/* Agent Info Dialog */}
                              {agentInfoOpen === step.id && (
                                <div className="mt-4 pt-4 border-t border-purple-900/30">
                                  <h5 className="text-white text-sm font-medium mb-3">Agent Details</h5>
                                  {isLoadingAgentDetails ? (
                                    <div className="flex items-center justify-center py-4">
                                      <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                                    </div>
                                  ) : agentDetails ? (
                                    <div className="space-y-4">
                                      <div>
                                        <Label className="text-gray-300 text-xs">Description</Label>
                                        <p className="text-white text-sm mt-1">{agentDetails.description}</p>
                                      </div>
                                      <div>
                                        <Label className="text-gray-300 text-xs">System Instruction</Label>
                                        <p className="text-white text-sm mt-1 whitespace-pre-wrap">{agentDetails.system_instruction}</p>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-gray-400 text-sm">Failed to load agent details</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Add Step Button */}
                    <div className="relative">
                      {orderedWorkflow.length > 0 && (
                        <div className="absolute left-5 -top-4 w-0.5 h-4 bg-purple-500/50"></div>
                      )}

                      {selectedAgent ? (
                        <div className="bg-gray-900/50 rounded-lg border border-purple-900/30 p-4">
                          <h4 className="text-white font-medium mb-3">Select an Agent</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {isLoading ? (
                              <div className="col-span-full flex items-center justify-center p-6">
                                <Loader2 className="h-6 w-6 animate-spin mr-2 text-purple-400" />
                                <span className="text-gray-400">Loading available agents...</span>
                              </div>
                            ) : getFilteredAgents().length > 0 ? (
                              getFilteredAgents().map((agent) => (
                                <div
                                  key={agent.id}
                                  className="bg-black/40 rounded-lg border border-purple-900/30 p-3 cursor-pointer hover:border-purple-500/50 transition-colors"
                                  onClick={() => addAgentToWorkflow(agent.id)}
                                >
                                  <div className="flex items-center">
                                    <div
                                      className={`w-8 h-8 rounded-full bg-gradient-to-br ${agent.color} flex items-center justify-center flex-shrink-0`}
                                    >
                                      {agent.icon && <agent.icon className="h-4 w-4 text-white" />}
                                    </div>
                                    <div className="ml-2">
                                      <h5 className="text-white text-sm font-medium">{agent.name}</h5>
                                      <div className="flex mt-1 space-x-1">
                                        <Badge variant="outline" className="bg-purple-900/20 text-[10px] px-1 py-0 h-4">
                                          {agent.inputType} → {agent.outputType}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="col-span-full text-center p-6">
                                {searchQuery ? (
                                  <p className="text-gray-400 mb-2">No agents found matching "{searchQuery}".</p>
                                ) : (
                                  <>
                                    <p className="text-gray-400 mb-2">No compatible agents found for this step.</p>
                                    <p className="text-sm text-gray-500">Create a new agent or change the previous step.</p>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-3 text-gray-400 hover:text-white"
                            onClick={() => setSelectedAgent(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full border-dashed border-purple-900/50 text-purple-400 hover:text-purple-300 hover:border-purple-500/50 bg-black/20"
                          onClick={() => setSelectedAgent("select")}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Loading Agents...
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Processing Step
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    {/* Output */}
                    <div className="flex items-center mt-4 pt-4 border-t border-purple-900/30">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-700 to-purple-900 flex items-center justify-center">
                        <OutputTypeIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="ml-3">
                        <h4 className="text-white font-medium">Output</h4>
                        <p className="text-gray-400 text-sm">
                          {serviceData.outputType === "select" 
                            ? "Select output type" 
                            : outputTypes.find((type) => type.value === serviceData.outputType)?.label || "Text Output"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Create Agent Dialog */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-gradient-to-r from-purple-600 to-purple-800 text-white hover:opacity-90">
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Agent
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-3xl w-[90vw] max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Create New Agent</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        {/* Agent Type Selection */}
                        <div className="space-y-2">
                          <Label htmlFor="agentType" className="text-white">
                            Agent Type <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={newAgentData.agentType}
                            onValueChange={(value) => {
                              const selectedType = agentTypes.find(type => type.type === value);
                              if (selectedType) {
                                setNewAgentData({ 
                                  ...newAgentData, 
                                  agentType: value,
                                  inputType: selectedType.input_type,
                                  outputType: selectedType.output_type
                                });
                              }
                            }}
                          >
                            <SelectTrigger id="agentType" className="bg-black/40 border-purple-900/30 text-white">
                              <SelectValue placeholder="Select agent type" />
                            </SelectTrigger>
                            <SelectContent>
                              <div className="bg-black/90 border-purple-900/30 text-white">
                                {isLoadingAgentTypes ? (
                                  <div className="p-2 text-center text-sm text-gray-400">Loading...</div>
                                ) : agentTypes.length > 0 ? (
                                  agentTypes.map((type) => (
                                    <SelectItem key={type.type} value={type.type}>
                                      {type.type}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <div className="p-2 text-center text-sm text-gray-400">No agent types found</div>
                                )}
                              </div>
                            </SelectContent>
                          </Select>
                          {!newAgentData.agentType && (
                            <p className="text-xs text-red-500">Please select an agent type</p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="agentName">Agent Name</Label>
                            <Input
                              id="agentName"
                              value={newAgentData.name}
                              onChange={(e) => setNewAgentData({ ...newAgentData, name: e.target.value })}
                              placeholder="My Custom Agent"
                              className="bg-black/40 border-purple-900/30 text-white"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="agentDescription">Description</Label>
                            <Input
                              id="agentDescription"
                              value={newAgentData.description}
                              onChange={(e) => setNewAgentData({ ...newAgentData, description: e.target.value })}
                              placeholder="What does this agent do?"
                              className="bg-black/40 border-purple-900/30 text-white"
                            />
                          </div>
                        </div>

                        {/* Replace input/output type dropdowns with text display */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Input Type</Label>
                            <div className="p-2 bg-black/40 border border-purple-900/30 rounded-md">
                              <p className="text-white text-sm">
                                {newAgentData.inputType || "Will be set based on agent type"}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Output Type</Label>
                            <div className="p-2 bg-black/40 border border-purple-900/30 rounded-md">
                              <p className="text-white text-sm">
                                {newAgentData.outputType || "Will be set based on agent type"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="systemInstruction">System Instruction</Label>
                          <Textarea
                            id="systemInstruction"
                            value={newAgentData.systemInstruction}
                            onChange={(e) => setNewAgentData({ ...newAgentData, systemInstruction: e.target.value })}
                            placeholder="Instructions for the agent..."
                            className="bg-black/40 border-purple-900/30 text-white min-h-[80px]"
                          />
                          <p className="text-gray-400 text-xs">Provide instructions to guide the agent's behavior</p>
                        </div>

                        {/* Agent type specific fields */}
                        {newAgentData.agentType === "gemini" && (
                          <div className="space-y-2">
                            <Label htmlFor="model">Model</Label>
                            <Select
                              value={newAgentData.config.model || ""}
                              onValueChange={(value) => 
                                setNewAgentData({ 
                                  ...newAgentData, 
                                  config: { ...newAgentData.config, model: value }
                                })
                              }
                            >
                              <SelectTrigger className="bg-black/40 border-purple-900/30 text-white">
                                <SelectValue placeholder="Select model" />
                              </SelectTrigger>
                              <SelectContent>
                                <div className="bg-black/90 border-purple-900/30 text-white">
                                  <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                                  <SelectItem value="gemini-pro-vision">Gemini Pro Vision</SelectItem>
                                </div>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {newAgentData.agentType === "text2speech" && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="voice">Voice</Label>
                              <Select
                                value={newAgentData.config.voice || ""}
                                onValueChange={(value) => 
                                  setNewAgentData({ 
                                    ...newAgentData, 
                                    config: { ...newAgentData.config, voice: value }
                                  })
                                }
                              >
                                <SelectTrigger className="bg-black/40 border-purple-900/30 text-white">
                                  <SelectValue placeholder="Select voice" />
                                </SelectTrigger>
                                <SelectContent>
                                  <div className="bg-black/90 border-purple-900/30 text-white">
                                    <SelectItem value="en-US-ChristopherNeural">English US - Christopher</SelectItem>
                                    <SelectItem value="en-US-JennyNeural">English US - Jenny</SelectItem>
                                    <SelectItem value="en-US-GuyNeural">English US - Guy</SelectItem>
                                    <SelectItem value="en-US-AriaNeural">English US - Aria</SelectItem>
                                    <SelectItem value="en-GB-SoniaNeural">English UK - Sonia</SelectItem>
                                    <SelectItem value="en-GB-RyanNeural">English UK - Ryan</SelectItem>
                                  </div>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="rate">Speech Rate</Label>
                              <Select
                                value={newAgentData.config.rate || "+0%"}
                                onValueChange={(value) => 
                                  setNewAgentData({ 
                                    ...newAgentData, 
                                    config: { ...newAgentData.config, rate: value }
                                  })
                                }
                              >
                                <SelectTrigger className="bg-black/40 border-purple-900/30 text-white">
                                  <SelectValue placeholder="Select rate" />
                                </SelectTrigger>
                                <SelectContent>
                                  <div className="bg-black/90 border-purple-900/30 text-white">
                                    <SelectItem value="-50%">Very Slow</SelectItem>
                                    <SelectItem value="-25%">Slow</SelectItem>
                                    <SelectItem value="+0%">Normal</SelectItem>
                                    <SelectItem value="+25%">Fast</SelectItem>
                                    <SelectItem value="+50%">Very Fast</SelectItem>
                                  </div>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}

                        {/* API Key Selection for Agent */}
                        <div className="space-y-4 border-t border-purple-900/30 pt-4">
                          <h3 className="text-lg font-medium text-white flex items-center">
                            <Key className="h-5 w-5 mr-2 text-purple-400" />
                            API Key Configuration
                          </h3>

                          <div className="space-y-3">
                            <div className="flex flex-col space-y-2">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="agent-saved-key"
                                  checked={!useCustomApiKey}
                                  onChange={() => setUseCustomApiKey(false)}
                                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-600 bg-gray-700"
                                />
                                <label htmlFor="agent-saved-key" className="text-sm font-medium text-white">
                                  Use saved API key
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="agent-custom-key"
                                  checked={useCustomApiKey}
                                  onChange={() => setUseCustomApiKey(true)}
                                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-600 bg-gray-700"
                                />
                                <label htmlFor="agent-custom-key" className="text-sm font-medium text-white">
                                  Use custom API key
                                </label>
                              </div>
                            </div>

                            {!useCustomApiKey ? (
                              <div className="space-y-2">
                                <Label htmlFor="selectedApiKey" className="text-white">
                                  Select API Key
                                </Label>
                                <Select
                                  value={selectedApiKey}
                                  onValueChange={setSelectedApiKey}
                                >
                                  <SelectTrigger id="selectedApiKey" className="bg-black/40 border-purple-900/30 text-white">
                                    <SelectValue placeholder="Select a saved API key" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <div className="bg-black/90 border-purple-900/30 text-white">
                                      {isLoadingApiKeys ? (
                                        <div className="flex items-center justify-center p-2">
                                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                          <span>Loading keys...</span>
                                        </div>
                                      ) : savedApiKeys.length > 0 ? (
                                        savedApiKeys.map((key) => (
                                          <SelectItem key={key.id} value={key.id}>
                                            {key.name} ({key.provider})
                                          </SelectItem>
                                        ))
                                      ) : (
                                        <div className="p-2 text-center text-sm text-gray-400">No saved API keys found</div>
                                      )}
                                    </div>
                                  </SelectContent>
                                </Select>
                                <p className="text-gray-400 text-xs">
                                  Select from your saved API keys. These are securely stored and encrypted.
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <Label htmlFor="customApiKey" className="text-white">
                                  Custom API Key
                                </Label>
                                <Input
                                  id="customApiKey"
                                  type="password"
                                  value={customApiKey}
                                  onChange={(e) => setCustomApiKey(e.target.value)}
                                  placeholder="Enter API key"
                                  className="bg-black/40 border-purple-900/30 text-white"
                                />
                                <p className="text-gray-400 text-xs">
                                  This key will only be used for this agent and won't be saved to your account.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="enhancePrompt" className="text-white">
                              Enhance Prompt
                            </Label>
                            <Switch
                              id="enhancePrompt"
                              checked={newAgentData.enhancePrompt}
                              onCheckedChange={(checked) => setNewAgentData({ ...newAgentData, enhancePrompt: checked })}
                            />
                          </div>
                          <p className="text-gray-400 text-xs">Automatically improve prompts using AI before processing</p>
                        </div>

                        

                        <div className="flex justify-end pt-2">
                          <Button
                            onClick={async () => {
                              setIsCreatingAgent(true);
                              try {
                                await createAgent();
                                // Dialog'u kapat - bunu parent component'te yapmamız gerekiyor
                                const dialogCloseButton = document.querySelector('[data-state="open"] button[aria-label="Close"], [data-state="open"] button.dialog-close');
                                if (dialogCloseButton) {
                                  (dialogCloseButton as HTMLButtonElement).click();
                                }
                              } catch (error) {
                                console.error("Agent oluşturma hatası:", error);
                              } finally {
                                setIsCreatingAgent(false);
                              }
                            }}
                            className="bg-gradient-to-r from-purple-600 to-purple-800 text-white hover:opacity-90"
                            disabled={isCreatingAgent || !newAgentData.name || !newAgentData.agentType}
                          >
                            {isCreatingAgent ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            {!newAgentData.name ? (
                              "Enter agent name"
                            ) : !newAgentData.agentType ? (
                              "Select agent type"
                            ) : (
                              "Create Agent"
                            )}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("details")}
                      className="border-purple-900/30 text-white hover:bg-purple-900/20"
                    >
                      Back to Details
                    </Button>

                    <Button
                      onClick={() => setActiveTab("preview")}
                      className="bg-gradient-to-r from-purple-600 to-purple-800 text-white hover:opacity-90"
                    >
                      Continue to Preview
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Preview Section */}
                <div className="lg:col-span-2">
                  <Card className="bg-black/40 backdrop-blur-sm border border-purple-900/30 p-6">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold text-white">Service Preview</h3>
                        <Badge variant="outline" className="bg-purple-900/20">
                          {orderedWorkflow.length} {orderedWorkflow.length === 1 ? "Step" : "Steps"}
                        </Badge>
                      </div>

                      {/* Service Card Preview */}
                      <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-purple-900/30 p-6">
                        <div
                          className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-gradient-to-br ${serviceData.color}`}
                        >
                          <SelectedIcon className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">
                          {serviceData.title || "Service Title"}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          {serviceData.description || "Service description will appear here..."}
                        </p>
                        <div className="mt-4 text-xs font-medium text-purple-400 flex items-center">
                          <span>{serviceData.buttonText || "Generate"}</span>
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </div>
                      </div>

                      {/* Service Interface Preview */}
                      <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-purple-900/30 p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Service Interface</h3>

                        <div className="space-y-4">
                          {/* Input Preview */}
                          <div className="space-y-2">
                            <Label className="text-white">
                              {serviceData.inputType === "text" ? "Your Prompt" : "Input"}
                            </Label>

                            {serviceData.inputType === "text" && (
                              <Textarea
                                placeholder={serviceData.placeholder || "Enter your text here..."}
                                className="bg-black/40 border-purple-900/30 text-white min-h-[100px]"
                                disabled
                              />
                            )}

                            {serviceData.inputType === "image" && (
                              <div className="border-2 border-dashed border-purple-900/50 rounded-lg p-6 text-center">
                                <ImageIcon className="h-8 w-8 mx-auto text-purple-400 mb-2" />
                                <p className="text-gray-400 text-sm">Drag and drop an image here, or click to select</p>
                              </div>
                            )}

                            {serviceData.inputType === "video" && (
                              <div className="border-2 border-dashed border-purple-900/50 rounded-lg p-6 text-center">
                                <Video className="h-8 w-8 mx-auto text-purple-400 mb-2" />
                                <p className="text-gray-400 text-sm">Drag and drop a video here, or click to select</p>
                              </div>
                            )}

                            {serviceData.inputType === "document" && (
                              <div className="border-2 border-dashed border-purple-900/50 rounded-lg p-6 text-center">
                                <FileText className="h-8 w-8 mx-auto text-purple-400 mb-2" />
                                <p className="text-gray-400 text-sm">
                                  Drag and drop a document here, or click to select
                                </p>
                              </div>
                            )}

                            {serviceData.inputType === "audio" && (
                              <div className="border-2 border-dashed border-purple-900/50 rounded-lg p-6 text-center">
                                <Headphones className="h-8 w-8 mx-auto text-purple-400 mb-2" />
                                <p className="text-gray-400 text-sm">
                                  Drag and drop an audio file here, or click to select
                                </p>
                              </div>
                            )}
                          </div>

                          <Button
                            className={`bg-gradient-to-r ${serviceData.color} text-white hover:opacity-90`}
                            disabled
                          >
                            {serviceData.buttonText || "Generate"}
                          </Button>
                          {/* Output Preview */}
                          <div className="mt-6 pt-6 border-t border-purple-900/30">
                            <h4 className="text-white font-medium mb-3">Output Preview</h4>

                            {serviceData.outputType === "text" && (
                              <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-purple-900/30 p-4">
                                <p className="text-gray-500 italic">Text output will appear here...</p>
                              </div>
                            )}

                            {serviceData.outputType === "image" && (
                              <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-purple-900/30 p-4 flex items-center justify-center">
                                <div className="w-full h-48 bg-gray-900/50 rounded-lg flex items-center justify-center">
                                  <ImageIcon className="h-10 w-10 text-gray-700" />
                                </div>
                              </div>
                            )}

                            {serviceData.outputType === "sound" && (
                              <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-purple-900/30 p-4">
                                <div className="w-full h-12 bg-gray-900/50 rounded-lg flex items-center justify-center">
                                  <Headphones className="h-6 w-6 text-gray-700 mr-2" />
                                  <div className="w-3/4 h-1 bg-gray-800 rounded-full"></div>
                                </div>
                              </div>
                            )}

                            {serviceData.outputType === "video" && (
                              <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-purple-900/30 p-4">
                                <div className="w-full h-48 bg-gray-900/50 rounded-lg flex items-center justify-center">
                                  <Video className="h-10 w-10 text-gray-700" />
                                </div>
                              </div>
                            )}

                            {serviceData.outputType === "text-audio" && (
                              <div className="space-y-4">
                                <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-purple-900/30 p-4">
                                  <p className="text-gray-500 italic">Text output will appear here...</p>
                                </div>
                                <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-purple-900/30 p-4">
                                  <div className="w-full h-12 bg-gray-900/50 rounded-lg flex items-center justify-center">
                                    <Headphones className="h-6 w-6 text-gray-700 mr-2" />
                                    <div className="w-3/4 h-1 bg-gray-800 rounded-full"></div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {serviceData.outputType === "text-video" && (
                              <div className="space-y-4">
                                <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-purple-900/30 p-4">
                                  <div className="w-full h-48 bg-gray-900/50 rounded-lg flex items-center justify-center">
                                    <Video className="h-10 w-10 text-gray-700" />
                                  </div>
                                </div>
                                <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-purple-900/30 p-4">
                                  <p className="text-gray-500 italic">Text output will appear here...</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between">
                        <Button
                          variant="outline"
                          onClick={() => setActiveTab("workflow")}
                          className="border-purple-900/30 text-white hover:bg-purple-900/20"
                        >
                          Back to Workflow
                        </Button>

                        <Button
                          onClick={handleSubmit}
                          disabled={isLoading || !serviceData.title || orderedWorkflow.length === 0}
                          className={`bg-gradient-to-r ${serviceData.color} text-white hover:opacity-90`}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating Service...
                            </>
                          ) : !serviceData.title ? (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Service Needs a Title
                            </>
                          ) : orderedWorkflow.length === 0 ? (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Add Agents to Workflow
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Deploy Service
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Summary Section */}
                <div className="lg:col-span-1">
                  <div className="sticky top-24 space-y-6">
                    <Card className="bg-black/40 backdrop-blur-sm border border-purple-900/30 p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Service Summary</h3>

                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-400">Service Details</h4>
                          <ul className="mt-2 space-y-2">
                            <li className="flex justify-between">
                              <span className="text-gray-500 text-sm">Name:</span>
                              <span className="text-white text-sm font-medium">{serviceData.title || "Untitled"}</span>
                            </li>
                            <li className="flex justify-between">
                              <span className="text-gray-500 text-sm">Input Type:</span>
                              <span className="text-white text-sm font-medium">
                                {inputTypes.find((t) => t.value === serviceData.inputType)?.label || "Text Input"}
                              </span>
                            </li>
                            <li className="flex justify-between">
                              <span className="text-gray-500 text-sm">Output Type:</span>
                              <span className="text-white text-sm font-medium">
                                {outputTypes.find((t) => t.value === serviceData.outputType)?.label || "Text Output"}
                              </span>
                            </li>
                            <li className="flex justify-between">
                              <span className="text-gray-500 text-sm">Visibility:</span>
                              <span className="text-white text-sm font-medium">
                                {serviceData.isPublic ? "Public" : "Private"}
                              </span>
                            </li>
                          </ul>
                        </div>

                        <div className="pt-4 border-t border-purple-900/30">
                          <h4 className="text-sm font-medium text-gray-400">Workflow Steps</h4>
                          {orderedWorkflow.length === 0 ? (
                            <p className="mt-2 text-gray-500 text-sm italic">No workflow steps added yet.</p>
                          ) : (
                            <ul className="mt-2 space-y-2">
                              {orderedWorkflow.map((step, index) => {
                                const agent = availableAgents.find((a) => a.id === step.agentId)
                                if (!agent) return null

                                return (
                                  <li key={step.id} className="flex items-center">
                                    <span className="w-5 h-5 rounded-full bg-purple-900/30 text-white text-xs flex items-center justify-center mr-2">
                                      {index + 1}
                                    </span>
                                    <span className="text-white text-sm">{agent.name}</span>
                                  </li>
                                )
                              })}
                            </ul>
                          )}
                        </div>
                      </div>
                    </Card>

                    <Card className="bg-black/40 backdrop-blur-sm border border-purple-900/30 p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Deployment Info</h3>
                      <p className="text-gray-400 text-sm">
                        When you deploy this service, it will be available in your dashboard and can be accessed via its
                        unique ID.
                      </p>

                      <div className="mt-4 pt-4 border-t border-purple-900/30">
                        <h4 className="text-sm font-medium text-gray-400">Next Steps</h4>
                        <ul className="mt-2 space-y-2 text-sm text-gray-400">
                          <li className="flex items-start">
                            <span className="text-purple-400 mr-2">1.</span>
                            <span>Deploy your service to make it available in your dashboard</span>
                          </li>
                          <li className="flex items-start">
                            <span className="text-purple-400 mr-2">2.</span>
                            <span>Access your service via the dashboard or direct URL</span>
                          </li>
                          <li className="flex items-start">
                            <span className="text-purple-400 mr-2">3.</span>
                            <span>Share with others if you've made it public</span>
                          </li>
                        </ul>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

