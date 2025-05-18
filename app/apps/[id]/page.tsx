"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { ArrowRight, ArrowLeft, Loader2, ChevronRight, Check, Info, RefreshCw, Copy, FileText, Image, Video, Headphones, MessageSquare, Key, AlertTriangle } from "lucide-react"
import { NavBar } from "@/components/nav-bar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"

// Define necessary interfaces
interface Agent {
  id: number;
  name: string;
  description: string;
  type: string;
  input_type: string;
  output_type: string;
  requires_api_key: boolean;
  provider?: string;
}

interface WorkflowNode {
  agent_id: number;
  next: string | null;
  agent_type?: string;
}

interface Workflow {
  nodes: Record<string, WorkflowNode>;
}

interface ApiKey {
  id: string;
  name: string;
  provider: string;
  last_used?: string;
}

interface ServiceDetails {
  id: number;
  name: string;
  description: string;
  input_type: string;
  output_type: string;
  placeholder?: string;
  button_text: string;
  workflow: Workflow;
  color: string;
  icon: string;
  is_public: boolean;
}

export default function MiniServicePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingService, setIsLoadingService] = useState(true);
  const [serviceDetails, setServiceDetails] = useState<ServiceDetails | null>(null);
  const [agentTypes, setAgentTypes] = useState<Record<string, Agent>>({});
  const [isLoadingAgentTypes, setIsLoadingAgentTypes] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoadingApiKeys, setIsLoadingApiKeys] = useState(false);
  const [selectedApiKeys, setSelectedApiKeys] = useState<Record<number, string>>({});
  const [orderedWorkflow, setOrderedWorkflow] = useState<Array<{id: string, agent: Agent}>>([]);
  
  const userId = Cookies.get("user_id") || "current-user";

  useEffect(() => {
    // Fetch service details
    const fetchServiceDetails = async () => {
      try {
        setIsLoadingService(true);
        const response = await fetch(`http://127.0.0.1:8000/api/v1/mini-services/${params.id}?current_user_id=${userId}`, {
          headers: {
            Authorization: `Bearer ${Cookies.get("access_token")}`
          }
        });

        if (!response.ok) throw new Error("Failed to fetch service details");
        const data = await response.json();
        setServiceDetails(data);
        
        // Process workflow to determine the order of agents
        processWorkflow(data.workflow);
      } catch (error) {
        console.error("Error fetching service details:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load service details."
        });
      } finally {
        setIsLoadingService(false);
      }
    };

    // Fetch agent types (which includes info about required API keys)
    const fetchAgentTypes = async () => {
      try {
        setIsLoadingAgentTypes(true);
        const response = await fetch(`http://127.0.0.1:8000/api/v1/agents/types?current_user_id=${userId}`, {
          headers: {
            Authorization: `Bearer ${Cookies.get("access_token")}`,
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) throw new Error("Failed to fetch agent types");
        const types = await response.json();
        
        // Convert to a lookup object by type name
        const typesMap: Record<string, Agent> = {};
        types.forEach((type: Agent) => {
          typesMap[type.type] = type;
        });
        
        setAgentTypes(typesMap);
      } catch (error) {
        console.error("Error fetching agent types:", error);
      } finally {
        setIsLoadingAgentTypes(false);
      }
    };

    // Fetch available API keys
    const fetchApiKeys = async () => {
      try {
        setIsLoadingApiKeys(true);
        const response = await fetch(`http://127.0.0.1:8000/api/v1/api-keys?current_user_id=${userId}`, {
          headers: {
            Authorization: `Bearer ${Cookies.get("access_token")}`,
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) throw new Error("Failed to fetch API keys");
        const data = await response.json();
        
        // Format the API keys
        const formattedKeys = data.map((key: any) => ({
          id: key.id.toString(),
          name: `${key.provider.charAt(0).toUpperCase() + key.provider.slice(1)} Key`,
          provider: key.provider,
          last_used: key.last_used || "Never"
        }));
        
        setApiKeys(formattedKeys);
      } catch (error) {
        console.error("Error fetching API keys:", error);
      } finally {
        setIsLoadingApiKeys(false);
      }
    };

    fetchServiceDetails();
    fetchAgentTypes();
    fetchApiKeys();
  }, [params.id, userId, toast]);

  // Process workflow to determine the correct order of agents
  const processWorkflow = (workflow: Workflow) => {
    if (!workflow || !workflow.nodes) return;

    const nodes = workflow.nodes;
    const nodeIds = Object.keys(nodes);
    
    // Find the first node (the one that no other node points to)
    const allNextIds = Object.values(nodes).map(node => node.next).filter(Boolean) as string[];
    const firstNodeId = nodeIds.find(id => !allNextIds.includes(id));
    
    if (!firstNodeId) return;
    
    const ordered: Array<{id: string, agent: Agent}> = [];
    let currentId = firstNodeId;
    
    // Create the ordered array by following the "next" pointers
    while (currentId) {
      const currentNode = nodes[currentId];
      if (!currentNode) break;
      
      ordered.push({
        id: currentId,
        agent: {
          id: currentNode.agent_id,
          name: "", // Will be filled in when we get agent details
          description: "",
          type: currentNode.agent_type || "",
          input_type: "",
          output_type: "",
          requires_api_key: false
        }
      });
      
      currentId = currentNode.next || "";
    }
    
    setOrderedWorkflow(ordered);
    
    // Fetch details for each agent in the workflow
    ordered.forEach(item => {
      fetchAgentDetails(item.agent.id.toString());
    });
  };

  // Fetch details for a specific agent
  const fetchAgentDetails = async (agentId: string) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/v1/agents/${agentId}?current_user_id=${userId}`, {
        headers: {
          Authorization: `Bearer ${Cookies.get("access_token")}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) throw new Error(`Failed to fetch agent ${agentId} details`);
      const data = await response.json();
      
      // Update the ordered workflow with agent details
      setOrderedWorkflow(prev => 
        prev.map(item => 
          item.agent.id.toString() === agentId 
            ? {
                ...item, 
                agent: {
                  ...item.agent,
                  name: data.name,
                  description: data.description || "",
                  type: data.agent_type || "",
                  input_type: data.input_type || "",
                  output_type: data.output_type || "",
                  requires_api_key: agentTypes[data.agent_type]?.requires_api_key || false,
                  provider: getProviderForAgentType(data.agent_type)
                }
              } 
            : item
        )
      );
    } catch (error) {
      console.error(`Error fetching agent ${agentId} details:`, error);
    }
  };

  // Get the provider name for an agent type
  const getProviderForAgentType = (type: string): string => {
    switch (type) {
      case "openai":
      case "openai_assistant":
      case "gpt_vision":
        return "openai";
      case "gemini":
        return "google";
      case "claude":
        return "anthropic";
      default:
        return "";
    }
  };

  // Get available API keys for a specific provider
  const getKeysForProvider = (provider: string): ApiKey[] => {
    return apiKeys.filter(key => key.provider === provider);
  };

  // Handle API key selection change
  const handleApiKeyChange = (agentId: number, keyId: string) => {
    setSelectedApiKeys(prev => ({
      ...prev,
      [agentId]: keyId
    }));
  };

  // Check if all required API keys are selected
  const areAllRequiredKeysSelected = (): boolean => {
    const agentsRequiringKeys = orderedWorkflow
      .filter(item => item.agent.requires_api_key)
      .map(item => item.agent.id);
    
    if (agentsRequiringKeys.length === 0) return true;
    
    return agentsRequiringKeys.every(agentId => selectedApiKeys[agentId]);
  };

  // Get the input type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "text":
        return <MessageSquare className="h-4 w-4" />;
      case "image":
        return <Image className="h-4 w-4" />;
      case "video":
        return <Video className="h-4 w-4" />;
      case "document":
        return <FileText className="h-4 w-4" />;
      case "sound":
        return <Headphones className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  // Handle the run action
  const handleRun = async () => {
    if (!serviceDetails) return;
    
    setIsLoading(true);
    setOutputText("");
    
    try {
      // Prepare the API keys object for the request
      const apiKeysForRequest: Record<string, string> = {};
      
      // Get actual API key values from API keys collection
      Object.entries(selectedApiKeys).forEach(([agentId, keyId]) => {
        const apiKey = apiKeys.find(key => key.id === keyId);
        if (apiKey) {
          apiKeysForRequest[agentId] = keyId;
        }
      });
      
      const response = await fetch(`http://127.0.0.1:8000/api/v1/mini-services/${params.id}/run?current_user_id=${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Cookies.get("access_token")}`
        },
        body: JSON.stringify({
          input: inputText,
          api_keys: apiKeysForRequest
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to run service");
      }

      const data = await response.json();
      setOutputText(data.output || "No output received");
    } catch (error: any) {
      console.error("Error running service:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An error occurred while running the service."
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingService) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black">
        <NavBar />
        <div className="pt-24 pb-16 px-4">
          <div className="max-w-6xl mx-auto flex items-center justify-center h-[60vh]">
            <div className="flex flex-col items-center">
              <Loader2 className="h-12 w-12 text-purple-500 animate-spin mb-4" />
              <p className="text-white text-xl">Loading service details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!serviceDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black">
        <NavBar />
        <div className="pt-24 pb-16 px-4">
          <div className="max-w-6xl mx-auto flex items-center justify-center h-[60vh]">
            <div className="flex flex-col items-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-white text-xl">Service not found or access denied</p>
              <Button onClick={() => router.push("/apps")} className="mt-4">
                Return to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get the correct icon component
  const ServiceIcon = (() => {
    switch (serviceDetails.icon) {
      case "MessageSquare": return MessageSquare;
      case "FileText": return FileText;
      case "Image": return Image;
      case "Video": return Video;
      case "Headphones": return Headphones;
      default: return MessageSquare;
    }
  })();

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black">
      <NavBar />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 flex items-center">
            <Button
              variant="outline"
              size="sm"
              className="mr-4 border-purple-700/40 text-white hover:bg-purple-900/30"
              onClick={() => router.push("/apps")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-white">{serviceDetails.name}</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Service description */}
              <Card className="bg-black/60 backdrop-blur-md border border-purple-900/40 p-6 rounded-xl shadow-xl">
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br ${serviceDetails.color}`}>
                    <ServiceIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-2">{serviceDetails.name}</h2>
                    <p className="text-gray-300">{serviceDetails.description}</p>
                    
                    <div className="flex space-x-2 mt-3">
                      <Badge variant="outline" className="bg-purple-900/20 flex items-center space-x-1">
                        {getTypeIcon(serviceDetails.input_type)}
                        <span>Input: {serviceDetails.input_type}</span>
                      </Badge>
                      <Badge variant="outline" className="bg-purple-900/20 flex items-center space-x-1">
                        {getTypeIcon(serviceDetails.output_type)}
                        <span>Output: {serviceDetails.output_type}</span>
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Input and Output tabs */}
              <Card className="bg-black/60 backdrop-blur-md border border-purple-900/40 p-6 rounded-xl shadow-xl">
                <Tabs defaultValue="input" className="space-y-4">
                  <TabsList className="bg-gray-800/50 border border-purple-900/30">
                    <TabsTrigger value="input" className="data-[state=active]:bg-purple-900/40">Input</TabsTrigger>
                    <TabsTrigger value="output" className="data-[state=active]:bg-purple-900/40">Output</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="input" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="input" className="text-white">Input</Label>
                      <Textarea
                        id="input"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={serviceDetails.placeholder || "Enter your input here..."}
                        className="bg-black/50 border-purple-900/50 text-white min-h-[200px] focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                    
                    {/* API Key selection dropdowns */}
                    {orderedWorkflow.some(item => item.agent.requires_api_key) && (
                      <div className="space-y-4 bg-black/40 p-4 rounded-lg border border-purple-900/30">
                        <div className="flex items-center">
                          <Key className="h-5 w-5 text-purple-400 mr-2" />
                          <h3 className="text-white font-medium">Required API Keys</h3>
                        </div>
                        
                        <div className="space-y-3">
                          {orderedWorkflow
                            .filter(item => item.agent.requires_api_key)
                            .map((item) => {
                              const providerKeys = getKeysForProvider(item.agent.provider || "");
                              
                              return (
                                <div key={`key-select-${item.agent.id}`} className="space-y-2">
                                  <Label className="text-gray-300 text-sm">
                                    Select API Key for {item.agent.name}
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Info className="h-3.5 w-3.5 text-gray-400 inline-block ml-1 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p className="text-xs max-w-xs">This building block requires a {item.agent.provider} API key</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </Label>
                                  
                                  <Select
                                    value={selectedApiKeys[item.agent.id] || ""}
                                    onValueChange={(value) => handleApiKeyChange(item.agent.id, value)}
                                  >
                                    <SelectTrigger className="w-full bg-black/50 border-purple-900/40 text-white">
                                      <SelectValue placeholder={`Select ${item.agent.provider} API Key`} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <div className="bg-black/90 border-purple-900/40 text-white">
                                        {providerKeys.length > 0 ? (
                                          providerKeys.map((key) => (
                                            <SelectItem key={key.id} value={key.id}>
                                              {key.name}
                                            </SelectItem>
                                          ))
                                        ) : (
                                          <div className="px-2 py-1 text-sm text-gray-400">
                                            No {item.agent.provider} API keys found
                                          </div>
                                        )}
                                      </div>
                                    </SelectContent>
                                  </Select>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      onClick={handleRun}
                      disabled={isLoading || !inputText || !areAllRequiredKeysSelected()}
                      className={`bg-gradient-to-r ${serviceDetails.color} text-white rounded-lg px-5 py-2 shadow-lg transition-all duration-300 hover:shadow-purple-500/40 w-full`}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          {serviceDetails.button_text || "Run"}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                    
                    {orderedWorkflow.some(item => item.agent.requires_api_key) && !areAllRequiredKeysSelected() && (
                      <p className="text-amber-400 text-sm flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Please select all required API keys to run this service
                      </p>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="output" className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="output" className="text-white">Output</Label>
                        {outputText && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs text-gray-400 hover:text-white"
                            onClick={() => {
                              navigator.clipboard.writeText(outputText);
                              toast({
                                title: "Copied to clipboard",
                                description: "The output has been copied to your clipboard.",
                              });
                            }}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                        )}
                      </div>
                      
                      <div className="bg-black/50 border border-purple-900/50 rounded-md p-4 min-h-[200px] text-white whitespace-pre-wrap">
                        {outputText ? (
                          outputText
                        ) : isLoading ? (
                          <div className="flex justify-center items-center h-full">
                            <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
                          </div>
                        ) : (
                          <p className="text-gray-500 italic">Run the service to see output here</p>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </Card>
            </div>

            {/* Right sidebar for workflow visualization */}
            <div className="space-y-6">
              {/* Workflow visualization */}
              <Card className="bg-black/60 backdrop-blur-md border border-purple-900/40 p-6 rounded-xl shadow-xl">
                <h3 className="text-white font-medium mb-4">Service Architecture</h3>
                
                <div className="space-y-4">
                  {orderedWorkflow.length > 0 ? (
                    <div className="space-y-6">
                      {orderedWorkflow.map((item, index) => (
                        <div key={`workflow-${item.id}`} className="relative">
                          {/* Connector line */}
                          {index > 0 && (
                            <div className="absolute left-4 -top-6 w-0.5 h-6 bg-purple-500/50"></div>
                          )}
                          
                          <div className="bg-gray-900/50 rounded-lg border border-purple-900/30 p-4">
                            <div className="flex items-start">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center flex-shrink-0">
                                {index + 1}
                              </div>
                              
                              <div className="ml-3 flex-grow">
                                <div className="flex justify-between items-start">
                                  <h4 className="text-white font-medium">{item.agent.name || "Loading..."}</h4>
                                  <Badge variant="outline" className="bg-purple-900/10 text-xs">
                                    {item.agent.type || "..."}
                                  </Badge>
                                </div>
                                
                                <p className="text-gray-400 text-sm mt-1">{item.agent.description || "Loading description..."}</p>
                                
                                <div className="flex mt-2 space-x-2">
                                  <Badge variant="outline" className="bg-purple-900/10 text-xs flex items-center space-x-1">
                                    {getTypeIcon(item.agent.input_type)}
                                    <span>In: {item.agent.input_type || "..."}</span>
                                  </Badge>
                                  <Badge variant="outline" className="bg-purple-900/10 text-xs flex items-center space-x-1">
                                    {getTypeIcon(item.agent.output_type)}
                                    <span>Out: {item.agent.output_type || "..."}</span>
                                  </Badge>
                                </div>
                                
                                {item.agent.requires_api_key && (
                                  <div className="mt-2 flex items-center text-xs text-amber-400">
                                    <Key className="h-3 w-3 mr-1" />
                                    Requires {item.agent.provider} API key
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-400">Loading workflow...</p>
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mt-2 text-purple-400" />
                    </div>
                  )}
                </div>
              </Card>
              
              {/* Info card */}
              <Card className="bg-black/60 backdrop-blur-md border border-purple-900/40 p-6 rounded-xl shadow-xl">
                <h3 className="text-white font-medium mb-4">About this Service</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Visibility:</span>
                    <Badge className={serviceDetails.is_public ? "bg-green-900/30 text-green-300" : "bg-blue-900/30 text-blue-300"}>
                      {serviceDetails.is_public ? "Public" : "Private"}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Building Blocks:</span>
                    <span className="text-white">{orderedWorkflow.length}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Required API Keys:</span>
                    <span className="text-white">
                      {orderedWorkflow.filter(item => item.agent.requires_api_key).length}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
