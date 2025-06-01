"use client"

import React, { useRef, useState, useMemo, useEffect } from 'react';
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
  ArrowLeft,
  AlertCircle,
  Play,
  Volume2,
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import ReactFlow, {
  Background,
  Controls,
  Panel,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  ConnectionLineType
} from 'reactflow';
import 'reactflow/dist/style.css';
import AgentNode from './nodes/AgentNode';
import InputNode from './nodes/InputNode';
import OutputNode from './nodes/OutputNode';

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

// Add these interface and state definitions with the other interfaces
interface Language {
  code: string;
  name: string;
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
  requires_api_key: boolean; // Add this field
}

// For React Flow node data, allow both inputType and outputType for agent nodes
// type AgentNodeData = { inputType: string; outputType: string; icon: React.ReactElement; label: string; onDelete: () => void };
// type InputNodeData = { inputType: string; icon: React.ReactElement };
// type OutputNodeData = { outputType: string; icon: React.ReactElement };
// Use a single type for all nodes:
type WorkflowNodeData = {
  inputType?: string;
  outputType?: string;
  icon: React.ReactElement;
  label?: string;
  onDelete?: () => void;
};

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
  const [isAgentDialogOpen, setIsAgentDialogOpen] = useState(false)

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

  // **[NEW STATE]** - Add file upload state for RAG agents
  const [ragDocumentFile, setRagDocumentFile] = useState<File | null>(null);

  const { toast } = useToast()

  const [agentTypes, setAgentTypes] = useState<AgentType[]>([]);
  const [isLoadingAgentTypes, setIsLoadingAgentTypes] = useState(false);

  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Within the ServiceWorkflowBuilder component
  const [translateLanguages, setTranslateLanguages] = useState<Language[]>([]);
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(false);

  // **[NEW STATE]** - Add TTS voices and test functionality
  const [ttsVoices, setTtsVoices] = useState<Array<{code: string, name: string, gender: string, locale: string}>>([]);
  const [isLoadingTtsVoices, setIsLoadingTtsVoices] = useState(false);
  const [testText, setTestText] = useState("Hello, this is a test of the text-to-speech configuration.");
  const [isTestingTts, setIsTestingTts] = useState(false);
  const [testAudioUrl, setTestAudioUrl] = useState<string | null>(null);

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
          userId: a.owner_id?.toString() || "", // Use owner_id from backend
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

      // **[RAG AGENT VALIDATION]** - Check if RAG agent has required file
      if (newAgentData.agentType === "rag" && !ragDocumentFile) {
        throw new Error("RAG agents require a PDF document to be uploaded");
      }

      // Clone the config object to avoid mutation
      let config = { ...newAgentData.config };

      // **[MULTIPART FORM DATA]** - RAG agents require multipart/form-data
      if (newAgentData.agentType === "rag") {
        const formData = new FormData();
        formData.append("name", newAgentData.name);
        formData.append("system_instruction", newAgentData.systemInstruction);
        formData.append("agent_type", newAgentData.agentType);
        formData.append("input_type", newAgentData.inputType);
        formData.append("output_type", newAgentData.outputType);
        formData.append("config", JSON.stringify(config));
        formData.append("file", ragDocumentFile!); // Add the PDF file

        const apiUrl = `http://127.0.0.1:8000/api/v1/agents/?enhance_prompt=${newAgentData.enhancePrompt ? 1 : 0}&current_user_id=${userId}`;

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${Cookies.get("access_token")}` // No Content-Type header for FormData
          },
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("RAG Agent Creation Error:", {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          });
          throw new Error(`Failed to create RAG agent: ${errorData.detail || JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        console.log("RAG Agent created successfully:", data);

        // Success handling
        await fetchAgents();
        toast({
          title: "RAG Agent Created",
          description: `Agent "${newAgentData.name}" has been created with document processing capabilities.`,
        });

        // Reset form
        setNewAgentData({
          name: "",
          description: "",
          inputType: "text",
          outputType: "text",
          systemInstruction: "",
          enhancePrompt: false,
          config: {},
          isPublic: false,
          agentType: ""
        });
        setRagDocumentFile(null);
        setSelectedApiKey("");
        setCustomApiKey("");
        setUseCustomApiKey(false);

        return data;
      } else {
        // **[JSON REQUEST]** - Non-RAG agents use JSON
        const agentData = {
          name: newAgentData.name,
          description: newAgentData.description,
          input_type: newAgentData.inputType,
          output_type: newAgentData.outputType,
          system_instruction: newAgentData.systemInstruction,
          config: config,
          is_public: newAgentData.isPublic,
          agent_type: newAgentData.agentType,
          enhance_prompt: newAgentData.enhancePrompt ? 1 : 0
        };
        
        console.log("Creating agent with data:", {
          ...agentData,
          config: agentData.config
        });
        
        const apiUrl = `http://127.0.0.1:8000/api/v1/agents/?enhance_prompt=${agentData.enhance_prompt}&current_user_id=${userId}`;

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Cookies.get("access_token")}`
          },
          body: JSON.stringify(agentData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("API Error Response:", {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          });
          throw new Error(`Failed to create agent: ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
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
        });
        setSelectedApiKey("");
        setCustomApiKey("");
        setUseCustomApiKey(false);

        return data;
      }
    } catch (error: any) {
      console.error("Agent creation error:", error);
      toast({
        variant: "destructive",
        title: "Agent Creation Failed",
        description: error.message || "An unexpected error occurred while creating the agent"
      });
      throw error;
    } finally {
      setIsCreatingAgent(false);
    }
  };

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

  const getFilteredAgents = (): { ownAgents: Agent[], otherAgents: Agent[] } => {
    const compatibleAgents = getCompatibleAgents()
    const currentUserId = Cookies.get("user_id")

    // Separate agents into own and other users' agents
    const ownAgents = compatibleAgents.filter(agent => agent.userId === currentUserId)
    const otherAgents = compatibleAgents.filter(agent => agent.userId !== currentUserId)

    // Apply search filter if there's a search query
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase()
      return {
        ownAgents: ownAgents.filter(agent =>
          agent.name.toLowerCase().includes(searchLower) ||
          agent.description.toLowerCase().includes(searchLower)
        ),
        otherAgents: otherAgents.filter(agent =>
          agent.name.toLowerCase().includes(searchLower) ||
          agent.description.toLowerCase().includes(searchLower)
        )
      }
    }

    return { ownAgents, otherAgents }
  }

  // Common glow effect styles for all tabs
  const TabGlowEffects = () => (
    <>
      {/* Primary outer glow - consistent across all tabs */}
      <div className="absolute inset-0 bg-purple-700/30 rounded-xl blur-2xl -z-10 animate-pulse-slow"></div>
      <div className="absolute inset-10 bg-indigo-500/20 rounded-full blur-3xl -z-10 animate-pulse-slow animation-delay-1000"></div>
    </>
  );

  // Inner card glow effects - consistent across all cards
  const CardGlowEffects = () => (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <div className="-top-32 -right-32 absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
      <div className="-bottom-40 -left-40 absolute w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
    </div>
  );

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

  // Add this function to fetch available translation languages
  const fetchTranslateLanguages = async () => {
    try {
      setIsLoadingLanguages(true);
      const res = await fetch('http://127.0.0.1:8000/api/v1/agents/languages/translate', {
        headers: {
          "Authorization": `Bearer ${Cookies.get("access_token")}`,
          "Content-Type": "application/json"
        }
      });

      if (!res.ok) throw new Error("Failed to fetch translation languages");
      
      const languagesData = await res.json();
      
      // Convert from object to array format for the dropdown
      const languagesArray = Object.entries(languagesData).map(([code, name]) => ({
        code,
        name: name as string
      }));
      
      setTranslateLanguages(languagesArray);
    } catch (err) {
      console.error("Error fetching translation languages:", err);
      setTranslateLanguages([]);
    } finally {
      setIsLoadingLanguages(false);
    }
  };

  // **[NEW FUNCTION]** - Fetch available TTS voices from backend only
  const fetchTtsVoices = async () => {
    try {
      setIsLoadingTtsVoices(true);
      
      const res = await fetch('http://127.0.0.1:8000/api/v1/agents/voices/tts', {
        headers: {
          "Authorization": `Bearer ${Cookies.get("access_token")}`,
          "Content-Type": "application/json"
        }
      });

      if (!res.ok) {
        throw new Error(`Backend error: ${res.status} - ${res.statusText}`);
      }
      
      const voicesData = await res.json();
      
      // Transform the voices data to match our interface
      const voicesArray = voicesData.map((voice: any) => ({
        code: voice.ShortName || voice.code || voice.name,
        name: voice.DisplayName || voice.name || voice.ShortName,
        gender: voice.Gender || voice.gender || 'Unknown',
        locale: voice.Locale || voice.locale || voice.code
      }));
      
      setTtsVoices(voicesArray);
      
      if (voicesArray.length === 0) {
        toast({
          variant: "destructive",
          title: "No TTS Voices Available",
          description: "Backend returned empty voice list. Please check the TTS service configuration.",
        });
      }
      
    } catch (err) {
      console.error("Error fetching TTS voices:", err);
      setTtsVoices([]); // Empty array instead of fallback
      
      toast({
        variant: "destructive",
        title: "TTS Voices Unavailable",
        description: "Could not load voice options from backend. Please ensure the TTS service is running and try again.",
      });
    } finally {
      setIsLoadingTtsVoices(false);
    }
  };

  // **[NEW FUNCTION]** - Test TTS configuration
  const testTtsConfiguration = async () => {
    try {
      setIsTestingTts(true);
      
      const config = {
        voice: newAgentData.config.voice || "en-US",
        rate: newAgentData.config.rate || "+0%",
        volume: newAgentData.config.volume || "+0%",
        pitch: newAgentData.config.pitch || "+0Hz"
      };

      console.log("Testing TTS with config:", config);
      console.log("Test text:", testText);
      console.log("Request payload:", JSON.stringify({
        text: testText,
        config: config
      }, null, 2));

      const response = await fetch(`http://127.0.0.1:8000/api/v1/agents/test-tts?current_user_id=${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Cookies.get("access_token")}`
        },
        body: JSON.stringify({
          text: testText,
          config: config
        })
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        // Handle different error types
        if (response.status === 404) {
          throw new Error("TTS test endpoint not available yet. The configuration will be saved and used when the agent is created.");
        } else if (response.status === 500) {
          throw new Error("TTS service temporarily unavailable. Please try again later.");
        } else {
          const errorData = await response.text().catch(() => "Unknown error");
          throw new Error(`TTS test failed: ${errorData}`);
        }
      }

      // Check content type
      const contentType = response.headers.get('content-type');
      console.log("Content-Type:", contentType);
      
      // Handle JSON response (test confirmation)
      if (contentType && contentType.includes('application/json')) {
        const jsonResponse = await response.json();
        console.log("JSON Response:", jsonResponse);
        
        if (jsonResponse.success) {
          // Check for voice mismatch
          const requestedVoice = config.voice;
          const usedVoice = jsonResponse.voice_used;
          const voiceMatched = usedVoice && (
            usedVoice === requestedVoice ||
            usedVoice.includes(requestedVoice) ||
            requestedVoice.includes(usedVoice)
          );

          console.log("Voice used:", jsonResponse.voice_used);
          console.log("Voice info:", jsonResponse.voice_info);
          console.log("Text length:", jsonResponse.text_length);
          console.log("Voice match check:", {
            requested: requestedVoice,
            used: usedVoice,
            matched: voiceMatched
          });

          if (!voiceMatched) {
            toast({
              variant: "destructive", 
              title: "Voice Mismatch Warning",
              description: `⚠️ Requested: ${requestedVoice}, but backend used: ${usedVoice}. Check backend voice mapping!`,
            });
          } else {
            toast({
              title: "TTS Configuration Valid",
              description: `✅ Test successful! Voice: ${usedVoice}. Audio generation confirmed.`,
            });
          }
          
          return; // Exit successfully but without audio
        } else {
          throw new Error(jsonResponse.message || "TTS test failed");
        }
      }
      
      // Handle audio file response
      if (!contentType || (!contentType.includes('audio') && !contentType.includes('octet-stream'))) {
        console.warn("Unexpected content type:", contentType);
        // Try to read as text to see what we got
        const textResponse = await response.text();
        console.log("Response body (as text):", textResponse);
        throw new Error(`Expected audio file or JSON, but got: ${contentType}. Response: ${textResponse.substring(0, 200)}`);
      }

      // Get the audio blob
      const audioBlob = await response.blob();
      console.log("Audio blob size:", audioBlob.size, "bytes");
      console.log("Audio blob type:", audioBlob.type);
      
      if (audioBlob.size === 0) {
        throw new Error("Received empty audio file from server");
      }

      // Clean up previous audio URL
      if (testAudioUrl) {
        URL.revokeObjectURL(testAudioUrl);
      }

      // Create new audio URL
      const audioUrl = URL.createObjectURL(audioBlob);
      console.log("Created audio URL:", audioUrl);
      setTestAudioUrl(audioUrl);

      toast({
        title: "TTS Test Successful",
        description: `Audio generated successfully (${(audioBlob.size / 1024).toFixed(1)} KB). You can now play it.`,
      });

    } catch (error) {
      console.error("Error testing TTS:", error);
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : "Failed to test TTS configuration";
      
      toast({
        variant: "destructive",
        title: "TTS Test Failed",
        description: errorMessage,
      });
      
      // If it's just a test endpoint issue, show info toast
      if (errorMessage.includes("not available yet")) {
        setTimeout(() => {
          toast({
            title: "Configuration Saved",
            description: "Your TTS settings will be applied when the agent is created, even though testing is not available.",
          });
        }, 2000);
      }
    } finally {
      setIsTestingTts(false);
    }
  };

  // Add this useEffect to call fetchTranslateLanguages when agent type is set to google_translate
  useEffect(() => {
    if (newAgentData.agentType === "google_translate") {
      fetchTranslateLanguages();
    }
  }, [newAgentData.agentType]);

  // **[NEW USEEFFECT]** - Fetch TTS voices when agent type is set to edge_tts
  useEffect(() => {
    if (newAgentData.agentType === "edge_tts") {
      fetchTtsVoices();
    }
  }, [newAgentData.agentType]);

  // React Flow states and refs
  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowNodeData>([
    {
      id: 'input-node',
      type: 'input',
      position: { x: 250, y: 5 },
      data: {
        inputType: serviceData.inputType,
        icon: <MessageSquare className="h-4 w-4 text-purple-300" />
      }
    },
    {
      id: 'output-node',
      type: 'output',
      position: { x: 250, y: 400 },
      data: {
        outputType: serviceData.outputType,
        icon: <MessageSquare className="h-4 w-4 text-blue-300" />
      }
    }
  ]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  // Node types for React Flow
  const nodeTypes = useMemo(() => ({
    input: InputNode,
    output: OutputNode,
    agent: AgentNode
  }), []);

  // Helper to mark the last agent node
  function markLastAgentNode(nodes: any[]) {
    // Find all agent nodes (exclude input/output)
    const agentNodes = nodes.filter(n => n.type === 'agent');
    if (agentNodes.length === 0) return nodes;
    // Find the one with the largest y position (lowest on canvas)
    const lastAgentNodeId = agentNodes.reduce((maxId, node) => {
      if (!maxId) return node.id;
      const maxNode = agentNodes.find(n => n.id === maxId);
      return (node.position.y > maxNode.position.y) ? node.id : maxId;
    }, null);
    // Set isLast: true for the last agent node, false for others
    return nodes.map(node => {
      if (node.type === 'agent') {
        return {
          ...node,
          data: {
            ...node.data,
            isLast: node.id === lastAgentNodeId
          }
        };
      }
      return node;
    });
  }

  // Add agent node to workflow (renamed to avoid conflict)
  const addAgentNodeToFlow = (agentId: string) => {
    const agent = availableAgents.find(a => a.id === agentId);
    if (!agent) return;
    const workflowNodes = nodes.filter(node => node.id !== 'input-node' && node.id !== 'output-node' && node.type === 'agent');
    const newNodeId = `agent-${Date.now()}`;
    const stepCount = workflowNodes.length + 1;
    const totalHeight = 400;
    const stepSize = totalHeight / (stepCount + 1);
    const updatedNodes = nodes.map(node => {
      if (node.id === 'input-node') {
        return { ...node, position: { x: 250, y: 5 } };
      } else if (node.id === 'output-node') {
        return { ...node, position: { x: 250, y: 5 + totalHeight } };
      } else if (node.type === 'agent') {
        const index = workflowNodes.findIndex(n => n.id === node.id);
        return { ...node, position: { x: 250, y: 5 + stepSize * (index + 1) } };
      }
      return node;
    });
    const Icon = agent.icon || MessageSquare;
    const newNode = {
      id: newNodeId,
      type: 'agent',
      position: { x: 250, y: 5 + stepSize * stepCount },
      data: {
        inputType: agent.inputType,
        outputType: agent.outputType,
        icon: <Icon className="h-4 w-4 text-white" />, // Render as element
        label: agent.name,
        onDelete: () => removeAgentNode(newNodeId)
      }
    };
    // Mark last agent node
    const allNodes = markLastAgentNode([...updatedNodes, newNode]);
    setNodes(allNodes);
    setTimeout(() => {
      updateWorkflowConnections(allNodes);
    }, 10);
    setSelectedAgent(null);
  };

  // Remove agent node
  const removeAgentNode = (nodeId: string) => {
    const filtered = nodes.filter(node => node.id !== nodeId);
    const allNodes = markLastAgentNode(filtered);
    setNodes(allNodes);
    setTimeout(() => {
      updateWorkflowConnections(allNodes);
    }, 10);
  };

  // Update connections
  const updateWorkflowConnections = (currentNodes: any[]) => {
    const sortedNodes = [...currentNodes].sort((a, b) => {
      if (a.id === 'input-node') return -1;
      if (b.id === 'input-node') return 1;
      if (a.id === 'output-node') return 1;
      if (b.id === 'output-node') return -1;
      return a.position.y - b.position.y;
    });
    const newEdges: any[] = [];
    for (let i = 0; i < sortedNodes.length - 1; i++) {
      newEdges.push({
        id: `e-${sortedNodes[i].id}-${sortedNodes[i + 1].id}`,
        source: sortedNodes[i].id,
        target: sortedNodes[i + 1].id,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#7c3aed', strokeWidth: 2 }
      });
    }
    setEdges(newEdges);
  };

  // Rearrange nodes after drag
  const onNodeDragStop = () => {
    const allNodes = markLastAgentNode(nodes);
    setNodes(allNodes);
    updateWorkflowConnections(allNodes);
  };

  // Open agent selection
  const handleAddAgent = () => {
    setSelectedAgent('select');
  };

  // --- REACT FLOW NODES SYNCED TO WORKFLOW ---
  useEffect(() => {
    // Always show input and output nodes
    const baseX = 40;
    const stepX = 250;
    const nodesArr = [];
    // Input node
    nodesArr.push({
      id: 'input-node',
      type: 'input',
      position: { x: baseX, y: 250 },
      data: {
        inputType: serviceData.inputType,
        icon: <MessageSquare className="h-4 w-4 text-purple-300" />
      }
    });
    // Agent nodes (from workflow)
    workflow.forEach((step, idx) => {
      const agent = availableAgents.find(a => a.id === step.agentId);
      if (!agent) return;
      const Icon = agent.icon || MessageSquare;
      nodesArr.push({
        id: step.id,
        type: 'agent',
        position: { x: baseX + stepX * (idx + 1), y: 250 },
        data: {
          inputType: agent.inputType,
          outputType: agent.outputType,
          icon: <Icon className="h-4 w-4 text-white" />, // Render as element
          label: agent.name,
          description: agent.description,
          color: agent.color,
          isLast: idx === workflow.length - 1,
          onDelete: () => removeWorkflowStep(step.id)
        }
      });
    });
    // Output node
    nodesArr.push({
      id: 'output-node',
      type: 'output',
      position: { x: baseX + stepX * (workflow.length + 1), y: 250 },
      data: {
        outputType: serviceData.outputType,
        icon: <MessageSquare className="h-4 w-4 text-blue-300" />
      }
    });
    setNodes(nodesArr);
    // Edges: connect all in order
    const edgeArr = [];
    for (let i = 0; i < nodesArr.length - 1; i++) {
      edgeArr.push({
        id: `e-${nodesArr[i].id}-${nodesArr[i + 1].id}`,
        source: nodesArr[i].id,
        target: nodesArr[i + 1].id,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#7c3aed', strokeWidth: 2 }
      });
    }
    setEdges(edgeArr);
  }, [workflow, availableAgents, serviceData.inputType, serviceData.outputType]);

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
            <TabsContent value="details" className="space-y-6 relative">
              {/* Purple glow effect - outer glow */}
              <TabGlowEffects />

              <Card className="bg-black/60 backdrop-blur-md border border-purple-900/40 p-6 rounded-xl shadow-xl relative overflow-hidden">
                {/* Inner subtle glow effects */}
                <CardGlowEffects />
                <div className="space-y-4 relative z-10">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-white font-medium">
                      Service Title
                    </Label>
                    <Input
                      id="title"
                      value={serviceData.title}
                      onChange={(e) => handleChange("title", e.target.value)}
                      placeholder="E.g., Custom Image Generator"
                      className="bg-black/50 border-purple-900/50 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-white font-medium">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={serviceData.description}
                      onChange={(e) => handleChange("description", e.target.value)}
                      placeholder="Describe what your service does..."
                      className="bg-black/50 border-purple-900/50 text-white min-h-[80px] focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="icon" className="text-white font-medium">
                        Icon
                      </Label>
                      <Select value={serviceData.icon} onValueChange={(value) => handleChange("icon", value)}>
                        <SelectTrigger id="icon" className="bg-black/50 border-purple-900/50 text-white">
                          <SelectValue placeholder="Select an icon" />
                        </SelectTrigger>
                        <SelectContent>
                          <div className="bg-black/90 border-purple-900/50 text-white">
                            {iconOptions.map((icon) => (
                              <SelectItem key={icon.value} value={icon.value} className="flex items-center hover:bg-purple-900/20">
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="placeholder" className="text-white font-medium">
                      Input Placeholder
                    </Label>
                    <Input
                      id="placeholder"
                      value={serviceData.placeholder}
                      onChange={(e) => handleChange("placeholder", e.target.value)}
                      placeholder="E.g., Enter your prompt here..."
                      className="bg-black/50 border-purple-900/50 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="buttonText" className="text-white font-medium">
                      Button Text
                    </Label>
                    <Input
                      id="buttonText"
                      value={serviceData.buttonText}
                      onChange={(e) => handleChange("buttonText", e.target.value)}
                      placeholder="E.g., Generate"
                      className="bg-black/50 border-purple-900/50 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
                    <Button
                      variant="outline"
                      onClick={() => router.push("/apps")}
                      className="border-purple-700/40 text-white hover:bg-purple-900/30 transition-all duration-300 hover:scale-105 rounded-lg px-5 py-2 flex items-center w-full sm:w-auto"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Dashboard
                    </Button>

                    <Button
                      onClick={() => setActiveTab("workflow")}
                      className="bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg px-5 py-2 shadow-lg transition-all duration-300 hover:shadow-purple-500/40 hover:scale-105 hover:from-purple-700 hover:to-purple-900 flex items-center w-full sm:w-auto"
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

              <Card className="bg-black/60 backdrop-blur-md border border-purple-900/40 p-6 rounded-xl shadow-xl relative overflow-hidden">
                {/* Inner subtle glow effects */}
                <CardGlowEffects />
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-white">Workflow Builder</h3>
                    <Badge variant="outline" className="bg-purple-900/20">
                      {workflow.length} {workflow.length === 1 ? "Step" : "Steps"}
                    </Badge>
                  </div>

                  {availableAgents.length === 0 && !isLoading && (
                    <div className="bg-red-900/20 border border-purple-900/30 rounded-md p-4 mb-4">
                      <p className="text-white text-sm">
                        No agents are available. First you need to create agents to use in your workflow.
                      </p>
                    </div>
                  )}

                  {/* Workflow Canvas (React Flow) */}
                  <div className="bg-black/40 rounded-lg border border-purple-900/30 p-4 relative" style={{ height: '500px' }}>
                    {/* React Flow 2D canvas */}
                    {/* --- BEGIN REACT FLOW CANVAS --- */}
                    <ReactFlowProvider>
                      <div style={{ width: '100%', height: '100%' }}>
                        <ReactFlow
                          nodes={nodes}
                          edges={edges}
                          onNodesChange={onNodesChange}
                          onEdgesChange={onEdgesChange}
                          onNodeDragStop={onNodeDragStop}
                          onInit={setReactFlowInstance}
                          nodeTypes={nodeTypes}
                          fitView
                          snapToGrid
                          snapGrid={[20, 20]}
                          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
                          minZoom={0.5}
                          maxZoom={1.5}
                          connectionLineType={ConnectionLineType.SmoothStep}
                          connectionLineStyle={{ stroke: '#7c3aed', strokeWidth: 2 }}
                        >
                          <Background color="#6366f1" gap={20} size={1} />
                          <Controls className="bg-gray-900/70 border border-gray-800 rounded-md" />
                          {/* Add Building Block Button */}
                          <Panel position="top-center" className="mt-2">
                            <Button
                              variant="outline"
                              className="bg-black/40 border-purple-700/50 text-purple-400 hover:text-purple-300 hover:border-purple-500/50"
                              onClick={handleAddAgent}
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
                                  Add Building Block
                                </>
                              )}
                            </Button>
                          </Panel>
                        </ReactFlow>
                      </div>
                    </ReactFlowProvider>
                    {/* --- END REACT FLOW CANVAS --- */}

                    {/* Agent Selection Panel */}
                    {selectedAgent && (
                      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-10 p-4 overflow-y-auto">
                        <div className="bg-gray-900/70 border border-purple-900/30 rounded-md p-4 max-w-3xl mx-auto">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-white">Select Agent</h3>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-gray-400 hover:text-white"
                              onClick={() => setSelectedAgent(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="space-y-4">
                            {/* Search and Filter */}
                            <div className="flex flex-col space-y-3">
                              {/* Search input */}
                              <div className="relative w-full">
                                <div className="flex items-center bg-black/40 border border-purple-900/30 rounded-md pr-1">
                                  <Input
                                    type="text"
                                    placeholder="Search agents..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-9 text-sm border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-white w-full pl-9"
                                  />
                                  <Search className="h-4 w-4 text-gray-400 absolute left-3" />
                                  {searchQuery && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 p-0 flex-shrink-0"
                                      onClick={() => setSearchQuery("")}
                                    >
                                      <X className="h-3 w-3 text-gray-400" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                              {/* Filter controls */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <Select
                                  value={filterTypes.inputType}
                                  onValueChange={handleInputTypeChange}
                                >
                                  <SelectTrigger
                                    id="inputType"
                                    className="bg-black/40 border-purple-900/30 text-white h-9 text-sm"
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
                                    className="bg-black/40 border-purple-900/30 text-white h-9 text-sm"
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
                            {/* Agent List */}
                            <div className="w-full">
                              {isLoading ? (
                                <div className="flex items-center justify-center p-6">
                                  <Loader2 className="h-6 w-6 animate-spin mr-2 text-purple-400" />
                                  <span className="text-gray-400">Loading available agents...</span>
                                </div>
                              ) : (
                                <div className="space-y-6 w-full">
                                  {/* User's Own Agents */}
                                  <div>
                                    <h5 className="text-sm font-medium text-gray-400 mb-3">My Agents</h5>
                                    {getFilteredAgents().ownAgents.length > 0 ? (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {getFilteredAgents().ownAgents.map((agent) => (
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
                                              <div className="ml-2 flex-1 min-w-0">
                                                <h5 className="text-white text-sm font-medium truncate">{agent.name}</h5>
                                                <div className="flex mt-1 space-x-1">
                                                  <Badge variant="outline" className="bg-purple-900/20 text-[10px] px-1 py-0 h-4">
                                                    {agent.inputType} → {agent.outputType}
                                                  </Badge>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-gray-500 text-sm italic">
                                        {searchQuery ? `No agents found named "${searchQuery}" in your collection.` : "No agents found in your collection."}
                                      </p>
                                    )}
                                  </div>
                                  {/* Other Users' Agents */}
                                  <div>
                                    <h5 className="text-sm font-medium text-gray-400 mb-3">Other Agents</h5>
                                    {getFilteredAgents().otherAgents.length > 0 ? (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {getFilteredAgents().otherAgents.map((agent) => (
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
                                              <div className="ml-2 flex-1 min-w-0">
                                                <h5 className="text-white text-sm font-medium truncate">{agent.name}</h5>
                                                <div className="flex mt-1 space-x-1">
                                                  <Badge variant="outline" className="bg-purple-900/20 text-[10px] px-1 py-0 h-4">
                                                    {agent.inputType} → {agent.outputType}
                                                  </Badge>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-gray-500 text-sm italic">
                                        {searchQuery ? `No other agents found named "${searchQuery}".` : "No other agents found."}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  

                   {/* Create Agent Dialog */}
                    <Dialog open={isAgentDialogOpen} onOpenChange={setIsAgentDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-gradient-to-r from-purple-600 to-purple-800 text-white hover:opacity-90 transition-all duration-300 hover:shadow-purple-500/30">
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Agent
                      </Button>
                    </DialogTrigger>

                    <DialogContent
                      className="bg-black/80 backdrop-blur-md border border-purple-700/50 text-white w-[95vw] sm:w-[90vw] md:w-[80vw] lg:w-[70vw] xl:w-[60vw] max-w-3xl shadow-xl relative rounded-xl z-50 overflow-y-auto max-h-[90vh]"
                      style={{
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      position: "fixed",
                      }}
                    >
                      {/* Glow effects, placed inside and behind content */}
                      <div className="pointer-events-none absolute inset-0 z-0">
                      <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl" />
                      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
                      </div>
                      <DialogHeader className="relative z-10">
                      <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Create New Agent</DialogTitle>
                      <p className="text-gray-400 text-sm mt-1">Configure a new AI agent for your workflow</p>
                      </DialogHeader>

                     
                      {/* Agent Type Selection */}
                      <div className="space-y-2">
                        <Label htmlFor="agentType" className="text-white font-medium">
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
                        <SelectTrigger id="agentType" className="bg-black/50 border-purple-900/40 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all">
                          <SelectValue placeholder="Select agent type" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px] overflow-y-auto">
                          <div className="bg-black/90 border-purple-900/40 text-white">
                          {isLoadingAgentTypes ? (
                            <div className="p-2 text-center text-sm text-gray-400">Loading...</div>
                          ) : agentTypes.length > 0 ? (
                            agentTypes.map((type) => (
                            <SelectItem key={type.type} value={type.type} className="hover:bg-purple-900/20">
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                        <Label htmlFor="agentName" className="text-white font-medium">Agent Name</Label>
                        <Input
                          id="agentName"
                          value={newAgentData.name}
                          onChange={(e) => setNewAgentData({ ...newAgentData, name: e.target.value })}
                          placeholder="My Custom Agent"
                          className="bg-black/50 border-purple-900/40 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                        />
                        </div>

                        <div className="space-y-2">
                        <Label htmlFor="agentDescription" className="text-white font-medium">Description</Label>
                        <Input
                          id="agentDescription"
                          value={newAgentData.description}
                          onChange={(e) => setNewAgentData({ ...newAgentData, description: e.target.value })}
                          placeholder="What does this agent do?"
                          className="bg-black/50 border-purple-900/40 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                        />
                        </div>
                      </div>

                      {/* Replace input/output type dropdowns with text display */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                        <Label className="text-white font-medium">Input Type</Label>
                        <div className="p-2 bg-black/50 border border-purple-900/40 rounded-md">
                          <p className="text-white text-sm">
                          {newAgentData.inputType || "Will be set based on agent type"}
                          </p>
                        </div>
                        </div>

                        <div className="space-y-2">
                        <Label className="text-white font-medium">Output Type</Label>
                        <div className="p-2 bg-black/50 border border-purple-900/40 rounded-md">
                          <p className="text-white text-sm">
                          {newAgentData.outputType || "Will be set based on agent type"}
                          </p>
                        </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                        <Label htmlFor="systemInstruction" className="text-white font-medium">System Instruction</Label>
                        {newAgentData.enhancePrompt && (
                          <Badge className="bg-purple-600/30 border-purple-500 text-purple-200 text-xs px-2 py-0.5">
                          Enhanced
                          </Badge>
                        )}
                        </div>
                        <Textarea
                        id="systemInstruction"
                        value={newAgentData.systemInstruction}
                        onChange={(e) => setNewAgentData({ ...newAgentData, systemInstruction: e.target.value })}
                        placeholder="Instructions for the agent..."
                        className={`bg-black/50 border-purple-900/40 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all ${newAgentData.enhancePrompt ? 'min-h-[200px]' : 'min-h-[80px]'}`}
                        />
                        <p className="text-gray-400 text-xs">Provide instructions to guide the agent's behavior</p>
                      </div>

                      {/* Agent type specific fields */}
                      {newAgentData.agentType === "gemini" && (
                        <div className="space-y-2 bg-black/40 p-4 rounded-lg border border-purple-900/30">
                        <Label htmlFor="model" className="text-white font-medium">Model</Label>
                        <Select
                          value={newAgentData.config.model || ""}
                          onValueChange={(value) =>
                          setNewAgentData({
                            ...newAgentData,
                            config: { ...newAgentData.config, model: value }
                          })
                          }
                        >
                          <SelectTrigger className="bg-black/50 border-purple-900/40 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all">
                          <SelectValue placeholder="Select model" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px] overflow-y-auto">
                          <div className="bg-black/90 border-purple-900/40 text-white">
                            <SelectItem value="gemini-pro" className="hover:bg-purple-900/20">Gemini Pro</SelectItem>
                            <SelectItem value="gemini-pro-vision" className="hover:bg-purple-900/20">Gemini Pro Vision</SelectItem>
                          </div>
                          </SelectContent>
                        </Select>
                        </div>
                      )}                        {newAgentData.agentType === "google_translate" && (
                        <div className="bg-black/40 p-4 rounded-lg border border-purple-900/30">
                        <h4 className="text-sm font-medium text-purple-200 mb-3">Translation Settings</h4>
                        <div className="space-y-2">
                          <Label htmlFor="targetLanguage" className="text-white font-medium">Target Language <span className="text-red-500">*</span></Label>
                          <Select
                          value={newAgentData.config.target_language || ""}
                          onValueChange={(value) =>
                            setNewAgentData({
                            ...newAgentData,
                            config: { ...newAgentData.config, target_language: value }
                            })
                          }
                          >
                          <SelectTrigger className="bg-black/50 border-purple-900/40 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all">
                            <SelectValue placeholder="Select target language" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px] overflow-y-auto">
                            <div className="bg-black/90 border-purple-900/40 text-white">
                            {isLoadingLanguages ? (
                              <div className="p-2 text-center text-sm text-gray-400">Loading languages...</div>
                            ) : translateLanguages.length > 0 ? (
                              translateLanguages.map((language) => (
                              <SelectItem key={language.code} value={language.code} className="hover:bg-purple-900/20">
                                {language.name}
                              </SelectItem>
                              ))
                            ) : (
                              <div className="p-2 text-center text-sm text-gray-400">No languages available</div>
                            )}
                            </div>
                          </SelectContent>
                          </Select>
                          {(newAgentData.agentType === "google_translate" && !newAgentData.config.target_language) && (
                          <p className="text-xs text-red-500">Please select a target language</p>
                          )}
                        </div>
                        </div>
                      )}

                      {newAgentData.agentType === "edge_tts" && (
                        <div className="bg-black/40 p-4 rounded-lg border border-purple-900/30">
                          <h4 className="text-sm font-medium text-purple-200 mb-4 flex items-center">
                            <Volume2 className="h-4 w-4 mr-2" />
                            Text to Speech Configuration
                          </h4>
                          
                          {/* Voice Selection */}
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="voice" className="text-white font-medium">Voice Language</Label>
                              <Select
                                value={newAgentData.config.voice || ""}
                                onValueChange={(value) =>
                                  setNewAgentData({
                                    ...newAgentData,
                                    config: { ...newAgentData.config, voice: value }
                                  })
                                }
                              >
                                <SelectTrigger className="bg-black/50 border-purple-900/40 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all">
                                  <SelectValue placeholder="Select voice language" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px] overflow-y-auto">
                                  <div className="bg-black/90 border-purple-900/40 text-white">
                                    {isLoadingTtsVoices ? (
                                      <div className="p-2 text-center text-sm text-gray-400">Loading voices...</div>
                                    ) : ttsVoices.length > 0 ? (
                                      ttsVoices.map((voice) => (
                                        <SelectItem key={voice.code} value={voice.code} className="hover:bg-purple-900/20">
                                          <div className="flex items-center justify-between w-full">
                                            <span>{voice.name}</span>
                                            <Badge variant="outline" className="ml-2 text-xs">
                                              {voice.gender}
                                            </Badge>
                                          </div>
                                        </SelectItem>
                                      ))
                                    ) : (
                                      <div className="p-2 text-center text-sm text-gray-400">
                                        <div className="mb-2">No voices available</div>
                                        <Button
                                          onClick={fetchTtsVoices}
                                          size="sm"
                                          variant="outline"
                                          className="text-xs border-purple-700/40 text-purple-300 hover:bg-purple-900/20"
                                        >
                                          Retry Loading Voices
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </SelectContent>
                              </Select>
                              
                              {/* Show warning if no voices loaded */}
                              {!isLoadingTtsVoices && ttsVoices.length === 0 && (
                                <div className="bg-yellow-900/20 border border-yellow-800/30 rounded-md p-2">
                                  <p className="text-yellow-300 text-xs">
                                    ⚠️ Could not load voices from backend. Please ensure the TTS service is running.
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Rate Slider */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Label className="text-white font-medium">Speech Rate</Label>
                                <span className="text-purple-300 text-sm font-mono">
                                  {newAgentData.config.rate || "+0%"}
                                </span>
                              </div>
                              <Slider
                                value={[parseInt((newAgentData.config.rate || "+0%").replace(/[+%]/g, ""))]}
                                onValueChange={(value) =>
                                  setNewAgentData({
                                    ...newAgentData,
                                    config: { 
                                      ...newAgentData.config, 
                                      rate: value[0] >= 0 ? `+${value[0]}%` : `${value[0]}%`
                                    }
                                  })
                                }
                                max={50}
                                min={-50}
                                step={5}
                                className="w-full"
                              />
                              <div className="flex justify-between text-xs text-gray-400">
                                <span>Very Slow (-50%)</span>
                                <span>Normal (0%)</span>
                                <span>Very Fast (+50%)</span>
                              </div>
                            </div>

                            {/* Volume Slider */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Label className="text-white font-medium">Volume</Label>
                                <span className="text-purple-300 text-sm font-mono">
                                  {newAgentData.config.volume || "+0%"}
                                </span>
                              </div>
                              <Slider
                                value={[parseInt((newAgentData.config.volume || "+0%").replace(/[+%]/g, ""))]}
                                onValueChange={(value) =>
                                  setNewAgentData({
                                    ...newAgentData,
                                    config: { 
                                      ...newAgentData.config, 
                                      volume: value[0] >= 0 ? `+${value[0]}%` : `${value[0]}%`
                                    }
                                  })
                                }
                                max={100}
                                min={-100}
                                step={10}
                                className="w-full"
                              />
                              <div className="flex justify-between text-xs text-gray-400">
                                <span>Silent (-100%)</span>
                                <span>Normal (0%)</span>
                                <span>Loud (+100%)</span>
                              </div>
                            </div>

                            {/* Pitch Slider */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Label className="text-white font-medium">Pitch</Label>
                                <span className="text-purple-300 text-sm font-mono">
                                  {newAgentData.config.pitch || "+0Hz"}
                                </span>
                              </div>
                              <Slider
                                value={[parseInt((newAgentData.config.pitch || "+0Hz").replace(/[+Hz]/g, ""))]}
                                onValueChange={(value) =>
                                  setNewAgentData({
                                    ...newAgentData,
                                    config: { 
                                      ...newAgentData.config, 
                                      pitch: value[0] >= 0 ? `+${value[0]}Hz` : `${value[0]}Hz`
                                    }
                                  })
                                }
                                max={50}
                                min={-50}
                                step={5}
                                className="w-full"
                              />
                              <div className="flex justify-between text-xs text-gray-400">
                                <span>Lower (-50Hz)</span>
                                <span>Normal (0Hz)</span>
                                <span>Higher (+50Hz)</span>
                              </div>
                            </div>

                            {/* Test Section */}
                            <div className="mt-6 p-4 bg-black/30 rounded-lg border border-purple-900/20">
                              <h5 className="text-sm font-medium text-purple-200 mb-3">Test Configuration</h5>
                              <div className="space-y-3">
                                <div className="space-y-2">
                                  <Label className="text-white text-sm">Test Text</Label>
                                  <Textarea
                                    value={testText}
                                    onChange={(e) => setTestText(e.target.value)}
                                    placeholder="Enter text to test the voice configuration..."
                                    className="bg-black/50 border-purple-900/40 text-white text-sm min-h-[60px] focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                                  />
                                </div>
                                
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <Button
                                    onClick={testTtsConfiguration}
                                    disabled={isTestingTts || !testText.trim() || !newAgentData.config.voice}
                                    className="bg-gradient-to-r from-purple-600 to-purple-800 text-white hover:opacity-90 transition-all duration-300 flex items-center"
                                    size="sm"
                                  >
                                    {isTestingTts ? (
                                      <>
                                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                        Testing...
                                      </>
                                    ) : (
                                      <>
                                        <Play className="h-3 w-3 mr-2" />
                                        Test Voice
                                      </>
                                    )}
                                  </Button>
                                  
                                  {testAudioUrl && (
                                    <div className="flex-1 space-y-2">
                                      <audio 
                                        controls 
                                        className="w-full h-8"
                                        key={testAudioUrl}
                                        onError={(e) => {
                                          console.error("Audio playback error:", e);
                                          toast({
                                            variant: "destructive",
                                            title: "Audio Playback Error",
                                            description: "Could not play the audio file. Check browser console for details.",
                                          });
                                        }}
                                        onLoadStart={() => console.log("Audio loading started")}
                                        onCanPlay={() => console.log("Audio can play")}
                                        onLoadedData={() => console.log("Audio data loaded")}
                                      >
                                        <source src={testAudioUrl} type="audio/mpeg" />
                                        <source src={testAudioUrl} type="audio/wav" />
                                        <source src={testAudioUrl} type="audio/ogg" />
                                        <source src={testAudioUrl} type="audio/mp4" />
                                        Your browser does not support the audio element.
                                      </audio>
                                      
                                      {/* Debug info */}
                                      <div className="text-xs text-gray-500">
                                        Audio URL: {testAudioUrl.substring(0, 50)}...
                                      </div>
                                      
                                      {/* Download link as fallback */}
                                      <a 
                                        href={testAudioUrl} 
                                        download="tts-test.mp3"
                                        className="text-xs text-purple-400 hover:text-purple-300 underline"
                                      >
                                        Download audio file
                                      </a>
                                    </div>
                                  )}
                                </div>
                                
                                {!newAgentData.config.voice && (
                                  <p className="text-xs text-red-400">Please select a voice to test</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2 bg-black/40 p-4 rounded-lg border border-purple-900/30">
                                                <div className="space-y-2 bg-black/40 p-4 rounded-lg border border-purple-900/30">
                          <div className="flex items-center justify-between">
                          
                            <div>
                              <Label className="text-white font-medium">
                               Enhance System Prompt
                              </Label>
                           
                            </div>
                            
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                if (!newAgentData.systemInstruction) {
                                  toast({
                                    variant: "destructive",
                                    title: "System instruction is empty",
                                    description: "Please add a system instruction first"
                                  });
                                  return;
                                }

                                // Show loading toast
                                const loadingToast = toast({
                                  title: "Enhancing system prompt",
                                  description: "Please wait...",
                                });                                try {
                                  const response = await fetch(`http://127.0.0.1:8000/api/v1/agents/enhance_system_prompt?current_user_id=${userId}`, {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                      Authorization: `Bearer ${Cookies.get("access_token")}`,
                                    },
                                    body: JSON.stringify({
                                      system_prompt: newAgentData.systemInstruction,
                                      name: newAgentData.name || "empty",
                                  description: newAgentData.description || "empty",
                                  input_type: newAgentData.inputType || "empty", 
                                  output_type: newAgentData.outputType || "empty",
                                  agent_type: newAgentData.agentType || "empty"
                                    }),
                                  });if (!response.ok) {
                                    const errorData = await response.json().catch(() => null);
                                    throw new Error(errorData?.detail || "Failed to enhance system prompt");
                                  }

                                  const result = await response.json();
                                  
                                  // Update the system instruction with the enhanced version with typing animation
                                  const enhancedPrompt = result.enhanced_prompt;
                                  const typingSpeed = Math.max(10, Math.floor(3000 / enhancedPrompt.length)); // Calculate speed to complete in ~3 seconds

                                  let currentText = '';
                                  let charIndex = 0;

                                  // Clear the system instruction first
                                  setNewAgentData({
                                    ...newAgentData,
                                    systemInstruction: '',
                                    enhancePrompt: true
                                  });

                                  // Create typing animation using interval
                                  const typingInterval = setInterval(() => {
                                    if (charIndex < enhancedPrompt.length) {
                                      currentText += enhancedPrompt.charAt(charIndex);
                                      setNewAgentData(prev => ({
                                        ...prev,
                                        systemInstruction: currentText
                                      }));
                                      charIndex++;
                                    } else {
                                      clearInterval(typingInterval);
                                    }
                                  }, typingSpeed);

                                  // Clean up interval if component unmounts
                                  return () => clearInterval(typingInterval);

                                  // Dismiss loading toast and show success
                                  loadingToast.dismiss();
                                  toast({
                                    title: "System prompt enhanced",
                                    description: "Your system instruction has been improved"
                                  });                                } catch (error) {
                                  console.error("Error enhancing system prompt:", error);
                                  
                                  // Dismiss loading toast and show error
                                  loadingToast.dismiss();
                                  toast({
                                    variant: "destructive",
                                    title: "Enhancement failed",
                                    description: error instanceof Error ? error.message : "Failed to enhance system prompt. Please try again."
                                  });
                                }                              }}
                              className="bg-gradient-to-r from-purple-600 to-purple-800 text-white border-0 hover:opacity-90"
                            >
                              <Wand2 className="h-3.5 w-3.5 mr-1" />  Enhance
                            </Button>
                          </div>
                          <p className="text-gray-400 text-xs">Automatically improve system prompt using AI</p>
                        </div>

                        <div className="flex justify-end pt-4">
                          <Button
                            onClick={async () => {
                              setIsCreatingAgent(true);
                              try {
                                const result = await createAgent();
                                if (result) {
                                  setIsAgentDialogOpen(false);
                                }
                              } catch (error) {
                                console.error("Agent creation error:", error);
                              } finally {
                                setIsCreatingAgent(false);
                              }
                            }}                            className="bg-gradient-to-r from-purple-600 to-purple-800 text-white hover:opacity-90 transition-all duration-300 hover:shadow-purple-500/30 hover:scale-105 w-full sm:w-auto"
                            disabled={
                              isCreatingAgent || 
                              !newAgentData.name || 
                              !newAgentData.agentType ||
                              (newAgentData.agentType === "google_translate" && !newAgentData.config.target_language) ||
                              (newAgentData.agentType === "rag" && !ragDocumentFile)
                            }
                          >
                            {isCreatingAgent ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            {!newAgentData.name ? (
                              "Enter agent name"
                            ) : !newAgentData.agentType ? (
                              "Select agent type"
                            ) : newAgentData.agentType === "google_translate" && !newAgentData.config.target_language ? (
                              "Select target language"
                            ) : newAgentData.agentType === "rag" && !ragDocumentFile ? (
                              "Upload RAG document"
                            ) : (
                              "Create Agent"
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* RAG Agent Configuration */}
                      {newAgentData.agentType === "rag" && (
                        <div className="bg-black/40 p-4 rounded-lg border border-purple-900/30">
                          <h4 className="text-sm font-medium text-purple-200 mb-3 flex items-center">
                            <FileText className="h-4 w-4 mr-2" />
                            RAG Document Configuration
                          </h4>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="ragDocument" className="text-white font-medium">
                                Document Upload <span className="text-red-500">*</span>
                              </Label>
                              <div className="border-2 border-dashed border-purple-900/50 rounded-lg p-6 text-center hover:border-purple-500/50 transition-colors cursor-pointer">
                                {!ragDocumentFile && (
                                  <>
                                    <FileText className="h-8 w-8 mx-auto text-purple-400 mb-2" />
                                    <p className="text-gray-400 text-sm">Drag and drop a PDF document here, or click to select</p>
                                    <p className="text-gray-500 text-xs mt-1">Only PDF files are supported for RAG agents</p>
                                  </>
                                )}
                                
                                {ragDocumentFile && (
                                  <div className="flex flex-col items-center">
                                    <div className="bg-black/30 rounded-lg p-3 w-full max-w-[300px] mx-auto mb-2">
                                      <div className="flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-purple-400 flex-shrink-0" />
                                        <p className="text-purple-200 text-sm font-medium truncate">{ragDocumentFile.name}</p>
                                      </div>
                                      <p className="text-gray-400 text-xs mt-1">{(ragDocumentFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-xs border-purple-900/30 text-white"
                                      onClick={() => setRagDocumentFile(null)}
                                    >
                                      Change Document
                                    </Button>
                                  </div>
                                )}
                                
                                <input
                                  type="file"
                                  accept=".pdf"
                                  className="hidden"
                                  id="rag-document-upload"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      if (file.type === "application/pdf") {
                                        setRagDocumentFile(file);
                                      } else {
                                        toast({
                                          variant: "destructive",
                                          title: "Invalid file type",
                                          description: "Only PDF files are supported for RAG agents"
                                        });
                                      }
                                    }
                                  }}
                                />
                                {!ragDocumentFile && (
                                  <Button
                                    onClick={() => document.getElementById("rag-document-upload")?.click()}
                                    variant="outline"
                                    className="mt-4 border-purple-900/30 text-white"
                                  >
                                    Select PDF Document
                                  </Button>
                                )}
                              </div>
                              {newAgentData.agentType === "rag" && !ragDocumentFile && (
                                <p className="text-xs text-red-500">A PDF document is required for RAG agents</p>
                              )}
                            </div>
                            
                            <div className="bg-blue-950/30 border border-blue-800/30 rounded-lg p-3">
                              <h5 className="text-xs font-semibold text-blue-200 mb-2">How RAG Works</h5>
                              <p className="text-xs text-blue-300/80 leading-relaxed">
                                This document will be processed and split into chunks for semantic search. 
                                When users query this agent, relevant sections will be retrieved and used to generate accurate responses.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("details")}
                      className="border-purple-700/40 text-white hover:bg-purple-900/30 transition-all duration-300 hover:scale-105 rounded-lg px-5 py-2 flex items-center">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Details
                    </Button>

                    <Button
                      onClick={() => setActiveTab("preview")}
                      className="bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg px-5 py-2 shadow-lg transition-all duration-300 hover:shadow-purple-500/40 hover:scale-105 hover:from-purple-700 hover:to-purple-900 flex items-center"
                    >
                      Preview
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="space-y-6 relative">
              {/* Enhanced purple glow effect - larger and more vibrant */}
              <div className="absolute inset-0 bg-purple-700/30 rounded-xl blur-2xl -z-10 animate-pulse-slow"></div>
              <div className="absolute inset-10 bg-indigo-500/20 rounded-full blur-3xl -z-10 animate-pulse-slow animation-delay-1000"></div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Preview Section */}
                <div className="lg:col-span-2">
                  <Card className="bg-black/60 backdrop-blur-md border border-purple-700/50 p-6 rounded-xl shadow-xl relative overflow-hidden">
                    {/* Inner glow effects - more prominent */}
                    <div className="absolute -top-32 -right-32 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>

                    <div className="space-y-6 relative z-10">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Service Preview</h3>
                        <Badge variant="outline" className="bg-purple-900/40 border-purple-500/50 text-purple-100 px-3 py-1 rounded-full shadow-sm">
                          {orderedWorkflow.length} {orderedWorkflow.length === 1 ? "Step" : "Steps"}
                        </Badge>
                      </div>

                      {/* Service Card Preview */}
                      <div className="bg-black/60 backdrop-blur-md rounded-xl border border-purple-700/40 p-6 shadow-lg">
                        <div
                          className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 bg-gradient-to-br ${serviceData.color} shadow-lg`}
                        >
                          <SelectedIcon className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">
                          {serviceData.title || "Service Title"}
                        </h3>
                        <p className="text-gray-300 text-sm">
                          {serviceData.description || "Service description will appear here..."}
                        </p>
                        <div className="mt-4 text-xs font-medium text-purple-300 flex items-center">
                          <span>{serviceData.buttonText || "Generate"}</span>
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </div>
                      </div>

                      {/* Service Interface Preview */}
                      <div className="bg-black/60 backdrop-blur-md rounded-xl border border-purple-700/40 p-6 shadow-lg">
                        <h3 className="text-lg font-semibold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-4">Service Interface</h3>

                        <div className="space-y-4">
                          {/* Input Preview */}
                          <div className="space-y-2">
                            <Label className="text-white font-medium">
                              {serviceData.inputType === "text" ? "Your Prompt" : "Input"}
                            </Label>

                            {serviceData.inputType === "text" && (
                              <Textarea
                                placeholder={serviceData.placeholder || "Enter your text here..."}
                                className="bg-black/60 border-purple-700/40 text-white min-h-[100px] focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                                disabled
                              />
                            )}

                            {serviceData.inputType === "image" && (
                              <div className="border-2 border-dashed border-purple-700/50 rounded-lg p-6 text-center hover:border-purple-500/70 transition-all">
                                <div className="bg-purple-900/30 rounded-full p-3 mx-auto w-16 h-16 flex items-center justify-center mb-3">
                                  <ImageIcon className="h-8 w-8 text-purple-300" />
                                </div>
                                <p className="text-gray-300 text-sm">Drag and drop an image here, or click to select</p>
                              </div>
                            )}

                            {serviceData.inputType === "video" && (
                              <div className="border-2 border-dashed border-purple-700/50 rounded-lg p-6 text-center hover:border-purple-500/70 transition-all">
                                <div className="bg-purple-900/30 rounded-full p-3 mx-auto w-16 h-16 flex items-center justify-center mb-3">
                                  <Video className="h-8 w-8 text-purple-300" />
                                </div>
                                <p className="text-gray-300 text-sm">Drag and drop a video here, or click to select</p>
                              </div>
                            )}

                            {serviceData.inputType === "document" && (
                              <div className="border-2 border-dashed border-purple-700/50 rounded-lg p-6 text-center hover:border-purple-500/70 transition-all">
                                <div className="bg-purple-900/30 rounded-full p-3 mx-auto w-16 h-16 flex items-center justify-center mb-3">
                                  <FileText className="h-8 w-8 text-purple-300" />
                                </div>
                                <p className="text-gray-300 text-sm">
                                  Drag and drop a document here, or click to select
                                </p>
                              </div>
                            )}

                            {serviceData.inputType === "audio" && (
                              <div className="border-2 border-dashed border-purple-700/50 rounded-lg p-6 text-center hover:border-purple-500/70 transition-all">
                                <div className="bg-purple-900/30 rounded-full p-3 mx-auto w-16 h-16 flex items-center justify-center mb-3">
                                  <Headphones className="h-8 w-8 text-purple-300" />
                                </div>
                                <p className="text-gray-300 text-sm">
                                  Drag and drop an audio file here, or click to select
                                </p>
                              </div>
                            )}
                          </div>

                          <Button
                            className={`bg-gradient-to-r ${serviceData.color} text-white shadow-lg transition-all duration-300 hover:shadow-purple-500/30 hover:scale-105 rounded-lg`}
                            disabled
                          >
                            {serviceData.buttonText || "Generate"}
                          </Button>

                          {/* Output Preview */}
                          <div className="mt-6 pt-6 border-t border-purple-700/40">
                            <h4 className="text-white font-medium mb-3 flex items-center">
                              <span className="bg-purple-900/40 p-1 rounded-md mr-2">
                                <ArrowRight className="h-4 w-4 text-purple-300" />
                              </span>
                              Output Preview
                            </h4>

                            {serviceData.outputType === "text" && (
                              <div className="bg-black/60 backdrop-blur-md rounded-xl border border-purple-700/40 p-4 shadow-lg">
                                <p className="text-gray-500 italic">Text output will appear here...</p>
                              </div>
                            )}

                            {serviceData.outputType === "image" && (
                              <div className="bg-black/60 backdrop-blur-md rounded-xl border border-purple-700/40 p-4 shadow-lg flex items-center justify-center">
                                <div className="w-full h-48 bg-gray-900/50 rounded-lg flex items-center justify-center">
                                  <ImageIcon className="h-10 w-10 text-gray-700" />
                                </div>
                              </div>
                            )}

                            {serviceData.outputType === "sound" && (
                              <div className="bg-black/60 backdrop-blur-md rounded-xl border border-purple-700/40 p-4 shadow-lg">
                                <div className="w-full h-12 bg-gray-900/50 rounded-lg flex items-center justify-center">
                                  <Headphones className="h-6 w-6 text-gray-700 mr-2" />
                                  <div className="w-3/4 h-1 bg-gray-800 rounded-full">
                                    <div className="w-1/3 h-full bg-purple-700/40 rounded-full"></div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {serviceData.outputType === "video" && (
                              <div className="bg-black/60 backdrop-blur-md rounded-xl border border-purple-700/40 p-4 shadow-lg">
                                <div className="w-full h-48 bg-gray-900/50 rounded-lg flex items-center justify-center">
                                  <Video className="h-10 w-10 text-gray-700" />
                                </div>
                              </div>
                            )}

                            {serviceData.outputType === "text-audio" && (
                              <div className="space-y-4">
                                <div className="bg-black/60 backdrop-blur-md rounded-xl border border-purple-700/40 p-4 shadow-lg">
                                  <p className="text-gray-500 italic">Text output will appear here...</p>
                                </div>
                                <div className="bg-black/60 backdrop-blur-md rounded-xl border border-purple-700/40 p-4 shadow-lg">
                                  <div className="w-full h-12 bg-gray-900/50 rounded-lg flex items-center justify-center">
                                    <Headphones className="h-6 w-6 text-gray-700 mr-2" />
                                    <div className="w-3/4 h-1 bg-gray-800 rounded-full">
                                      <div className="w-1/3 h-full bg-purple-700/40 rounded-full"></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {serviceData.outputType === "text-video" && (
                              <div className="space-y-4">
                                <div className="bg-black/60 backdrop-blur-md rounded-xl border border-purple-700/40 p-4 shadow-lg">
                                  <div className="w-full h-48 bg-gray-900/50 rounded-lg flex items-center justify-center">
                                    <Video className="h-10 w-10 text-gray-700" />
                                  </div>
                                </div>
                                <div className="bg-black/60 backdrop-blur-md rounded-xl border border-purple-700/40 p-4 shadow-lg">
                                  <p className="text-gray-500 italic">Text output will appear here...</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
                        <Button
                          variant="outline"
                          onClick={() => setActiveTab("workflow")}
                          className="border-purple-700/40 text-white hover:bg-purple-900/30 transition-all duration-300 hover:scale-105 rounded-lg px-5 py-2 flex items-center w-full sm:w-auto"
                        >
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Back to Workflow
                        </Button>

                        <Button
                          onClick={handleSubmit}
                          disabled={isLoading || !serviceData.title || orderedWorkflow.length === 0}
                          className={`bg-gradient-to-r ${serviceData.color} text-white rounded-lg px-5 py-2 shadow-lg transition-all duration-300 hover:shadow-purple-500/40 hover:scale-105 flex items-center w-full sm:w-auto`}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Deploy Service
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
                    <Card className="bg-black/60 backdrop-blur-md border border-purple-700/50 p-6 rounded-xl shadow-xl relative overflow-hidden">
                      {/* Inner glow effect */}
                      <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl"></div>

                      <div className="relative z-10">
                        <h3 className="text-lg font-semibold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-4">Service Summary</h3>

                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-purple-200">Service Details</h4>
                            <ul className="mt-2 space-y-3">
                              <li className="flex justify-between items-center bg-black/30 rounded-lg p-2 ">
                                <span className="text-gray-400 text-sm">Name:</span>
                                <span className="text-white text-sm font-medium">{serviceData.title || "Untitled"}</span>
                              </li>
                              <li className="flex justify-between items-center bg-black/30 rounded-lg p-2 ">
                                <span className="text-gray-400 text-sm">Input Type:</span>
                                <span className="text-white text-sm font-medium">
                                  {inputTypes.find((t) => t.value === serviceData.inputType)?.label || "Text Input"}
                                </span>
                              </li>
                              <li className="flex justify-between items-center bg-black/30 rounded-lg p-2 ">
                                <span className="text-gray-400 text-sm">Output Type:</span>
                                <span className="text-white text-sm font-medium">
                                  {outputTypes.find((t) => t.value === serviceData.outputType)?.label || "Text Output"}
                                </span>
                              </li>
                              <li className="flex justify-between items-center bg-black/30 rounded-lg p-2 ">
                                <span className="text-gray-400 text-sm">Visibility:</span>
                                <div className="flex items-center gap-2">
                                  <Switch 
                                    id="visibility-toggle"
                                    checked={serviceData.isPublic}
                                    onCheckedChange={(value) => handleChange("isPublic", value)}
                                    className="data-[state=checked]:bg-green-600"
                                  />
                                  <Badge className={`${serviceData.isPublic ? "bg-green-900/30 text-green-300" : "bg-blue-900/30 text-blue-300"} border-0`}>
                                    {serviceData.isPublic ? "Public" : "Private"}
                                  </Badge>
                                </div>
                              </li>
                            </ul>
                          </div>

                          <div className="pt-4 border-t border-purple-700/40">
                            <h4 className="text-sm font-medium text-purple-200">Workflow Steps</h4>
                            {orderedWorkflow.length === 0 ? (
                              <div className="mt-3 bg-red-900/20 border border-red-900/30 rounded-lg p-3 text-gray-300 text-sm italic flex items-center">
                                <AlertCircle className="h-4 w-4 text-red-400 mr-2" />
                                No workflow steps added yet.
                              </div>
                            ) : (
                              <ul className="mt-3 space-y-2">
                                {orderedWorkflow.map((step, index) => {
                                  const agent = availableAgents.find((a) => a.id === step.agentId)
                                  if (!agent) return null

                                  return (
                                    <li key={step.id} className="flex items-center bg-purple-900/20 rounded-lg p-2 border-l-2 border-purple-500">
                                      <span className="w-6 h-6 rounded-full bg-purple-700/50 text-white text-xs flex items-center justify-center mr-2 shadow-md">
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
                      </div>
                    </Card>

                    <Card className="bg-black/60 backdrop-blur-md border border-purple-700/50 p-6 rounded-xl shadow-xl relative overflow-hidden">
                      {/* Inner glow effect */}
                      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl"></div>

                      <div className="relative z-10">
                        <h3 className="text-lg font-semibold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-4">Deployment Info</h3>
                        <p className="text-gray-300 text-sm">
                          When you deploy this service, it will be available in your dashboard and can be accessed via its
                          unique ID.
                        </p>

                        <div className="mt-4 pt-4 border-t border-purple-700/40">
                          <h4 className="text-sm font-medium text-purple-200">Visibility Settings</h4>
                          <div className="mt-3 bg-black/30 rounded-lg p-3">
                            <p className="text-gray-300 text-sm mb-2">
                              Toggle the visibility switch to make your service public or private:
                            </p>
                            <ul className="space-y-2 text-sm">
                              <li className="flex items-start">
                                <div className="w-4 h-4 rounded-full bg-green-700/50 text-white text-xs flex items-center justify-center mr-2 flex-shrink-0 shadow-md mt-0.5"></div>
                                <span className="text-green-300">Public: Other users can discover and use your service</span>
                              </li>
                              <li className="flex items-start">
                                <div className="w-4 h-4 rounded-full bg-blue-700/50 text-white text-xs flex items-center justify-center mr-2 flex-shrink-0 shadow-md mt-0.5"></div>
                                <span className="text-blue-300">Private: Only you can access this service</span>
                              </li>
                            </ul>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-purple-700/40">
                          <h4 className="text-sm font-medium text-purple-200">Next Steps</h4>
                          <ul className="mt-3 space-y-3">
                            <li className="flex items-start bg-black/30 rounded-lg p-3">
                              <div className="w-6 h-6 rounded-full bg-purple-700/50 text-white text-xs flex items-center justify-center mr-2 flex-shrink-0 shadow-md">1</div>
                              <span className="text-gray-300 text-sm">Deploy your service to make it available in your dashboard</span>
                            </li>
                            <li className="flex items-start bg-black/30 rounded-lg p-3">
                              <div className="w-6 h-6 rounded-full bg-purple-700/50 text-white text-xs flex items-center justify-center mr-2 flex-shrink-0 shadow-md">2</div>
                              <span className="text-gray-300 text-sm">Access your service via the dashboard or direct URL</span>
                            </li>
                            <li className="flex items-start bg-black/30 rounded-lg p-3">
                              <div className="w-6 h-6 rounded-full bg-purple-700/50 text-white text-xs flex items-center justify-center mr-2 flex-shrink-0 shadow-md">3</div>
                              <span className="text-gray-300 text-sm">Share with others if you've made it public</span>
                            </li>
                          </ul>
                        </div>
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

