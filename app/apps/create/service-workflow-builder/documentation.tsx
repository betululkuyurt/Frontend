"use client"

import React from "react"
import { NavBar } from "@/components/nav-bar"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  MessageSquare,
  FileText,
  ArrowLeft,
  Code,
  Info,
  Workflow,
  PenTool,
  Puzzle,
  Play,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Lightbulb,
  ChevronRight,
  Wand2,
  LogIn
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"

export default function ServiceWorkflowDocumentation() {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black">
      <NavBar />

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-purple-400" />
                <h1 className="text-3xl font-bold text-white mb-2">Service Workflow Builder Documentation</h1>
              </div>
              {isAuthenticated ? (
                <Link href="/apps/create/service-workflow-builder">
                  <Button variant="outline" className="border-purple-700/40 text-white hover:bg-purple-900/30 transition-all">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Builder
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/login">
                  <Button variant="outline" className="border-purple-700/40 text-white hover:bg-purple-900/30 transition-all">
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
            <p className="text-gray-400">A comprehensive guide to creating custom AI services</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Overview */}              <Card className="bg-black/60 backdrop-blur-md border border-purple-900/40 p-6 rounded-xl shadow-xl relative overflow-hidden" id="overview">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                    <Info className="h-5 w-5 mr-2 text-purple-400" />
                    Overview
                  </h2>                  <p className="text-gray-300 mb-4">
                    The Service Workflow Builder is a powerful tool that allows you to create custom AI services by combining different AI building blocks into a workflow. 
                    With this tool, you can design complex, multi-step AI processes without writing any code.
                  </p>
                  <div className="bg-purple-900/20 border border-purple-700/30 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-purple-300 mb-2 flex items-center">
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Key Benefits
                    </h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-300">
                      <li>Create custom AI services without coding</li>
                      <li>Combine multiple AI building blocks in a visual workflow</li>
                      <li>Connect different building block types (LLMs, translation, TTS, etc.)</li>
                      <li>Deploy services with a single click</li>
                      <li>Share your services with others</li>
                    </ul>
                  </div>
                </div>
              </Card>

              {/* Getting Started */}              <Card className="bg-black/60 backdrop-blur-md border border-purple-900/40 p-6 rounded-xl shadow-xl relative overflow-hidden" id="getting-started">
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                    <Play className="h-5 w-5 mr-2 text-purple-400" />
                    Getting Started
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="bg-black/40 rounded-lg p-4 border border-purple-900/30">
                      <h3 className="text-lg font-medium text-white mb-2">Accessing the Builder</h3>
                      <ol className="list-decimal list-inside space-y-2 text-gray-300 ml-2">
                        <li>Navigate to the Apps section in the main menu</li>
                        <li>Click on "Create New Service" or "Create Custom AI Service" button</li>
                        <li>You'll be taken to the Service Workflow Builder interface</li>
                      </ol>
                    </div>

                    <div className="bg-black/40 rounded-lg p-4 border border-purple-900/30">
                      <h3 className="text-lg font-medium text-white mb-2">Interface Overview</h3>
                      <p className="text-gray-300 mb-2">
                        The Service Workflow Builder is divided into three main tabs:
                      </p>
                      <div className="space-y-3 ml-2">
                        <div className="flex items-start">
                          <div className="w-6 h-6 rounded-full bg-purple-700/50 text-white text-xs flex items-center justify-center mr-2 flex-shrink-0">1</div>
                          <div>
                            <p className="text-white font-medium">Service Details</p>
                            <p className="text-gray-400 text-sm">Define basic information about your service</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <div className="w-6 h-6 rounded-full bg-purple-700/50 text-white text-xs flex items-center justify-center mr-2 flex-shrink-0">2</div>
                          <div>                            <p className="text-white font-medium">Workflow</p>
                            <p className="text-gray-400 text-sm">Design the workflow by adding and connecting building blocks</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <div className="w-6 h-6 rounded-full bg-purple-700/50 text-white text-xs flex items-center justify-center mr-2 flex-shrink-0">3</div>
                          <div>
                            <p className="text-white font-medium">Preview</p>
                            <p className="text-gray-400 text-sm">Preview your service and deploy it</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Detailed Guides */}              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem value="service-details" className="bg-black/60 backdrop-blur-md border border-purple-900/40 rounded-xl shadow-xl overflow-hidden" id="service-details">
                  <AccordionTrigger className="px-6 py-4 hover:bg-purple-900/20 text-white text-lg font-medium">
                    <div className="flex items-center">
                      <PenTool className="h-5 w-5 mr-2 text-purple-400" />
                      Service Details Tab
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 py-4 text-gray-300">
                    <p className="mb-4">In this tab, you'll define the basic information about your service:</p>
                    <ul className="space-y-3 mb-4">
                      <li className="flex items-start">
                        <ChevronRight className="h-5 w-5 mr-2 text-purple-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-white font-medium">Title</span>
                          <p className="text-gray-400 text-sm">Give your service a name (required)</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <ChevronRight className="h-5 w-5 mr-2 text-purple-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-white font-medium">Description</span>
                          <p className="text-gray-400 text-sm">Describe what your service does</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <ChevronRight className="h-5 w-5 mr-2 text-purple-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-white font-medium">Placeholder</span>
                          <p className="text-gray-400 text-sm">The placeholder text that will appear in the input field</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <ChevronRight className="h-5 w-5 mr-2 text-purple-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-white font-medium">Button Text</span>
                          <p className="text-gray-400 text-sm">The text that will appear on the submit button</p>
                        </div>
                      </li>
                    </ul>
                    <div className="bg-purple-900/20 border border-purple-700/30 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-2 flex items-center">
                        <Info className="h-4 w-4 mr-2 text-purple-400" />
                        Pro Tip
                      </h4>
                      <p className="text-gray-300 text-sm">
                        Choose a descriptive title and clear placeholder text to help users understand what your service does
                        and how to use it effectively.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>                <AccordionItem value="workflow-builder" className="bg-black/60 backdrop-blur-md border border-purple-900/40 rounded-xl shadow-xl overflow-hidden" id="workflow-builder">
                  <AccordionTrigger className="px-6 py-4 hover:bg-purple-900/20 text-white text-lg font-medium">
                    <div className="flex items-center">
                      <Workflow className="h-5 w-5 mr-2 text-purple-400" />
                      Workflow Builder Tab
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 py-4 text-gray-300">                    <p className="mb-4">This is where you design the actual workflow for your service:</p>
                    
                    <h4 className="text-white font-medium mb-2 mt-4">Adding Building Blocks</h4>
                    <ol className="list-decimal list-inside space-y-2 ml-2 mb-4">
                      <li>Click the "Create New Building Block" button to add a new building block to your workflow</li>
                      <li>Fill in the required details:
                        <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-gray-400">                        <li><span className="text-white">Building Block Name</span> - A unique name for your building block</li>
                          <li><span className="text-white">Building Block Type</span> - Select from various AI building block types</li>
                          <li><span className="text-white">Description</span> - A brief description of what this building block does</li>
                          <li><span className="text-white">System Instruction</span> - Instructions for the building block (for LLM building blocks)</li>
                          <li><span className="text-white">Enhance Prompt</span> - Option to improve your system instruction with AI (for custom building blocks)</li>
                        </ul>
                      </li>
                    </ol>                    <h4 className="text-white font-medium mb-2 mt-4">Building Block Types</h4>
                    <div className="space-y-3 mb-4">
                      <div>
                        <p className="text-white">Text Generation Building Blocks:</p>
                        <ul className="list-disc list-inside ml-6 text-gray-400">
                          <li>OpenAI - Powered by GPT models</li>
                          <li>Gemini - Google's multimodal AI model</li>
                          <li>Claude - Anthropic's AI assistant</li>
                        </ul>
                      </div>
                      <div>
                        <p className="text-white">Specialized Building Blocks:</p>
                        <ul className="list-disc list-inside ml-6 text-gray-400">
                          <li>Google Translate - For language translation</li>
                          <li>Edge TTS - For text-to-speech conversion</li>
                          <li>RAG - For using document knowledge</li>
                        </ul>
                      </div>
                    </div>

                    <h4 className="text-white font-medium mb-2 mt-4">Building Your Workflow</h4>
                    <ol className="list-decimal list-inside space-y-2 ml-2 mb-4">
                      <li>After creating building blocks, they will appear as nodes in the workflow canvas</li>
                      <li>Connect building blocks by dragging from one node's output to another node's input</li>
                      <li>Arrange the workflow in the order you want the processing to happen</li>
                      <li>You must connect your workflow from the input node to the output node</li>
                    </ol>                    <div className="bg-purple-900/20 border border-purple-700/30 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-2 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2 text-purple-400" />
                        Important Note
                      </h4>
                      <p className="text-gray-300 text-sm">
                        Make sure to check that the output type of one building block is compatible with the input type of the next building block in your workflow.
                        For example, if a building block outputs text, the next building block should accept text as input.
                      </p>
                    </div></AccordionContent>
              </AccordionItem>              <AccordionItem value="building-block-types" className="bg-black/60 backdrop-blur-md border border-purple-900/40 rounded-xl shadow-xl overflow-hidden" id="building-block-types">
                  <AccordionTrigger className="px-6 py-4 hover:bg-purple-900/20 text-white text-lg font-medium">
                    <div className="flex items-center">
                      <Puzzle className="h-5 w-5 mr-2 text-purple-400" />
                      Detailed Building Block Types Reference
                    </div>
                  </AccordionTrigger>
                <AccordionContent className="px-6 py-4 text-gray-300">
                  <div className="space-y-6">                    {/* Text Generation Building Blocks */}
                    <div>                  <h3 className="text-xl font-medium text-white mb-3">1. Text Generation Building Blocks</h3>
                      
                      <div className="space-y-4">
                        <div className="bg-black/40 rounded-lg p-4 border border-purple-900/30">
                          <h4 className="text-lg font-medium text-white mb-2">Gemini Building Block</h4>
                          <ul className="space-y-1 text-gray-300">
                            <li><span className="text-purple-300 font-medium">Type:</span> gemini</li>
                            <li><span className="text-purple-300 font-medium">Input:</span> Text</li>
                            <li><span className="text-purple-300 font-medium">Output:</span> Text</li>
                            <li><span className="text-purple-300 font-medium">API Key Required:</span> Yes (Gemini API key)</li>
                            <li><span className="text-purple-300 font-medium">Description:</span> Uses Google's Gemini AI model for text generation, conversation, and analysis.</li>
                          </ul>
                        </div>                        <div className="bg-black/40 rounded-lg p-4 border border-purple-900/30">
                          <h4 className="text-lg font-medium text-white mb-2">OpenAI Building Block</h4>
                          <ul className="space-y-1 text-gray-300">
                            <li><span className="text-purple-300 font-medium">Type:</span> openai</li>
                            <li><span className="text-purple-300 font-medium">Input:</span> Text</li>
                            <li><span className="text-purple-300 font-medium">Output:</span> Text</li>
                            <li><span className="text-purple-300 font-medium">API Key Required:</span> Yes (OpenAI API key)</li>
                            <li><span className="text-purple-300 font-medium">Description:</span> Leverages OpenAI's GPT models for text generation and completion tasks.</li>
                          </ul>
                        </div>

                        <div className="bg-black/40 rounded-lg p-4 border border-purple-900/30">
                          <h4 className="text-lg font-medium text-white mb-2">Claude Building Block</h4>
                          <ul className="space-y-1 text-gray-300">
                            <li><span className="text-purple-300 font-medium">Type:</span> claude</li>
                            <li><span className="text-purple-300 font-medium">Input:</span> Text</li>
                            <li><span className="text-purple-300 font-medium">Output:</span> Text</li>
                            <li><span className="text-purple-300 font-medium">API Key Required:</span> Yes (Claude API key)</li>
                            <li><span className="text-purple-300 font-medium">Description:</span> Uses Anthropic's Claude AI model for text generation and analysis.</li>
                          </ul>
                        </div>

                        <div className="bg-black/40 rounded-lg p-4 border border-purple-900/30">
                          <h4 className="text-lg font-medium text-white mb-2">Custom Endpoint LLM Building Block</h4>
                          <ul className="space-y-1 text-gray-300">
                            <li><span className="text-purple-300 font-medium">Type:</span> custom_endpoint_llm</li>
                            <li><span className="text-purple-300 font-medium">Input:</span> Text</li>
                            <li><span className="text-purple-300 font-medium">Output:</span> Text</li>
                            <li><span className="text-purple-300 font-medium">API Key Required:</span> Yes</li>
                            <li><span className="text-purple-300 font-medium">Description:</span> Connects to custom LLM endpoints for text generation tasks.</li>
                          </ul>
                        </div>
                      </div>
                    </div>                    {/* Text-to-Speech Building Blocks */}                    <div>
                      <h3 className="text-xl font-medium text-white mb-3">2. Text-to-Speech (TTS) Building Blocks</h3>
                      
                      <div className="space-y-4">
                        <div className="bg-black/40 rounded-lg p-4 border border-blue-900/30">
                          <h4 className="text-lg font-medium text-white mb-2">Edge TTS Building Block</h4>
                          <ul className="space-y-1 text-gray-300">
                            <li><span className="text-blue-300 font-medium">Type:</span> edge_tts</li>
                            <li><span className="text-blue-300 font-medium">Input:</span> Text</li>
                            <li><span className="text-blue-300 font-medium">Output:</span> Audio (MP3)</li>
                            <li><span className="text-blue-300 font-medium">API Key Required:</span> No</li>
                            <li><span className="text-blue-300 font-medium">Description:</span> Uses Microsoft Edge's text-to-speech service with multiple voice options.</li>
                            <li>
                              <span className="text-blue-300 font-medium">Features:</span>
                              <ul className="list-disc list-inside ml-4 mt-1">
                                <li>Multiple languages and voices</li>
                                <li>Adjustable rate, volume, and pitch</li>
                                <li>High-quality audio output</li>
                              </ul>
                            </li>
                          </ul>
                        </div>

                        <div className="bg-black/40 rounded-lg p-4 border border-blue-900/30">
                          <h4 className="text-lg font-medium text-white mb-2">Bark TTS Building Block</h4>
                          <ul className="space-y-1 text-gray-300">
                            <li><span className="text-blue-300 font-medium">Type:</span> bark_tts</li>
                            <li><span className="text-blue-300 font-medium">Input:</span> Text</li>
                            <li><span className="text-blue-300 font-medium">Output:</span> Audio (WAV)</li>
                            <li><span className="text-blue-300 font-medium">API Key Required:</span> No</li>
                            <li><span className="text-blue-300 font-medium">Description:</span> Uses Suno's Bark model for realistic text-to-speech with emotion and tone.</li>
                            <li>
                              <span className="text-blue-300 font-medium">Features:</span>
                              <ul className="list-disc list-inside ml-4 mt-1">
                                <li>Natural-sounding voices</li>
                                <li>Emotion and tone control</li>
                                <li>Multiple voice presets</li>
                              </ul>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>                    {/* Speech-to-Text Building Block */}
                    <div>
                      <h3 className="text-xl font-medium text-white mb-3">3. Speech-to-Text Building Block</h3>
                      
                      <div className="space-y-4">
                        <div className="bg-black/40 rounded-lg p-4 border border-green-900/30">
                          <h4 className="text-lg font-medium text-white mb-2">Transcribe Building Block</h4>
                          <ul className="space-y-1 text-gray-300">
                            <li><span className="text-green-300 font-medium">Type:</span> transcribe</li>
                            <li><span className="text-green-300 font-medium">Input:</span> Audio/Video files</li>
                            <li><span className="text-green-300 font-medium">Output:</span> Text</li>
                            <li><span className="text-green-300 font-medium">API Key Required:</span> No</li>
                            <li><span className="text-green-300 font-medium">Description:</span> Transcribes audio and video files to text using WhisperX.</li>
                            <li>
                              <span className="text-green-300 font-medium">Features:</span>
                              <ul className="list-disc list-inside ml-4 mt-1">
                                <li>Multiple language support</li>
                                <li>Timestamp inclusion option</li>
                                <li>High accuracy transcription</li>
                              </ul>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>                    {/* Image Generation Building Block */}
                    <div>
                      <h3 className="text-xl font-medium text-white mb-3">4. Image Generation Building Block</h3>
                      
                      <div className="space-y-4">
                        <div className="bg-black/40 rounded-lg p-4 border border-indigo-900/30">
                          <h4 className="text-lg font-medium text-white mb-2">Gemini Text-to-Image Building Block</h4>
                          <ul className="space-y-1 text-gray-300">
                            <li><span className="text-indigo-300 font-medium">Type:</span> dalle</li>
                            <li><span className="text-indigo-300 font-medium">Input:</span> Text prompt</li>
                            <li><span className="text-indigo-300 font-medium">Output:</span> Image</li>
                            <li><span className="text-indigo-300 font-medium">API Key Required:</span> Yes (Gemini API key)</li>
                            <li><span className="text-indigo-300 font-medium">Description:</span> Generates images from text prompts using Google's Gemini model.</li>
                          </ul>
                        </div>
                      </div>
                    </div>                    {/* Translation Building Block */}
                    <div>
                      <h3 className="text-xl font-medium text-white mb-3">5. Translation Building Block</h3>
                      
                      <div className="space-y-4">
                        <div className="bg-black/40 rounded-lg p-4 border border-cyan-900/30">
                          <h4 className="text-lg font-medium text-white mb-2">Google Translate Building Block</h4>
                          <ul className="space-y-1 text-gray-300">
                            <li><span className="text-cyan-300 font-medium">Type:</span> google_translate</li>
                            <li><span className="text-cyan-300 font-medium">Input:</span> Text</li>
                            <li><span className="text-cyan-300 font-medium">Output:</span> Translated text</li>
                            <li><span className="text-cyan-300 font-medium">API Key Required:</span> No</li>
                            <li><span className="text-cyan-300 font-medium">Description:</span> Translates text between multiple languages using Google Translate.</li>
                          </ul>
                        </div>
                      </div>
                    </div>                    {/* Document Processing Building Block */}
                    <div>
                      <h3 className="text-xl font-medium text-white mb-3">6. Document Processing Building Block</h3>
                      
                      <div className="space-y-4">
                        <div className="bg-black/40 rounded-lg p-4 border border-amber-900/30">
                          <h4 className="text-lg font-medium text-white mb-2">Document Parser Building Block</h4>
                          <ul className="space-y-1 text-gray-300">
                            <li><span className="text-amber-300 font-medium">Type:</span> document_parser</li>
                            <li><span className="text-amber-300 font-medium">Input:</span> Documents</li>
                            <li><span className="text-amber-300 font-medium">Output:</span> Text</li>
                            <li><span className="text-amber-300 font-medium">API Key Required:</span> No</li>
                            <li><span className="text-amber-300 font-medium">Description:</span> Extracts and processes text from various document formats.</li>
                          </ul>
                        </div>
                      </div>
                    </div>                    {/* Research Building Block */}
                    <div>
                      <h3 className="text-xl font-medium text-white mb-3">7. Research Building Block</h3>
                      
                      <div className="space-y-4">
                        <div className="bg-black/40 rounded-lg p-4 border border-rose-900/30">
                          <h4 className="text-lg font-medium text-white mb-2">Internet Research Building Block</h4>
                          <ul className="space-y-1 text-gray-300">
                            <li><span className="text-rose-300 font-medium">Type:</span> internet_research</li>
                            <li><span className="text-rose-300 font-medium">Input:</span> Text query</li>
                            <li><span className="text-rose-300 font-medium">Output:</span> Research results</li>
                            <li><span className="text-rose-300 font-medium">API Key Required:</span> No</li>
                            <li><span className="text-rose-300 font-medium">Description:</span> Performs internet research and returns structured information.</li>
                          </ul>
                        </div>
                      </div>
                    </div>                    {/* RAG Building Block */}
                    <div>
                      <h3 className="text-xl font-medium text-white mb-3">8. RAG (Retrieval-Augmented Generation) Building Block</h3>
                      
                      <div className="space-y-4">
                        <div className="bg-black/40 rounded-lg p-4 border border-emerald-900/30">
                          <h4 className="text-lg font-medium text-white mb-2">RAG Building Block</h4>
                          <ul className="space-y-1 text-gray-300">
                            <li><span className="text-emerald-300 font-medium">Type:</span> rag</li>
                            <li><span className="text-emerald-300 font-medium">Input:</span> Text query + PDF document</li>
                            <li><span className="text-emerald-300 font-medium">Output:</span> Text answers based on document</li>
                            <li><span className="text-emerald-300 font-medium">API Key Required:</span> Yes (Gemini API key for embeddings)</li>
                            <li><span className="text-emerald-300 font-medium">Description:</span> Answers questions based on uploaded PDF documents using vector search and LLM generation.</li>
                            <li>
                              <span className="text-emerald-300 font-medium">Features:</span>
                              <ul className="list-disc list-inside ml-4 mt-1">
                                <li>PDF document ingestion</li>
                                <li>Vector-based similarity search</li>
                                <li>Context-aware responses</li>
                              </ul>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>              <AccordionItem value="preview-tab" className="bg-black/60 backdrop-blur-md border border-purple-900/40 rounded-xl shadow-xl overflow-hidden" id="preview-tab">
                  <AccordionTrigger className="px-6 py-4 hover:bg-purple-900/20 text-white text-lg font-medium">
                    <div className="flex items-center">
                      <Play className="h-5 w-5 mr-2 text-purple-400" />
                      Preview Tab
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 py-4 text-gray-300">
                    <p className="mb-4">In this tab, you can:</p>
                    <ul className="list-disc list-inside space-y-2 ml-2 mb-4">
                      <li>View a preview of how your service will appear to users</li>
                      <li>See a summary of your service details and workflow steps</li>
                      <li>Deploy your service when you're satisfied with it</li>
                    </ul>
                    
                    <h4 className="text-white font-medium mb-2 mt-4">Sections in the Preview Tab</h4>
                    <div className="space-y-3 mb-4">
                      <div className="flex items-start">
                        <ChevronRight className="h-5 w-5 mr-2 text-purple-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-white font-medium">Service Preview</span>
                          <p className="text-gray-400 text-sm">Visual preview of how your service will look to users</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <ChevronRight className="h-5 w-5 mr-2 text-purple-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-white font-medium">Service Interface</span>
                          <p className="text-gray-400 text-sm">Preview of the input and output interfaces</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <ChevronRight className="h-5 w-5 mr-2 text-purple-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-white font-medium">Service Summary</span>
                          <p className="text-gray-400 text-sm">Overview of your service details and workflow steps</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <ChevronRight className="h-5 w-5 mr-2 text-purple-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-white font-medium">Deployment Info</span>
                          <p className="text-gray-400 text-sm">Information about deploying and sharing your service</p>
                        </div>
                      </div>
                    </div>                    <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-2 flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-green-400" />
                        Final Checklist
                      </h4>
                      <p className="text-gray-300 text-sm mb-2">Before deploying, ensure that:</p>
                      <ul className="list-disc list-inside space-y-1 text-gray-400 text-sm">
                        <li>Your service has a title</li>
                        <li>Your workflow has at least one building block</li>
                        <li>All building blocks are properly connected from input to output</li>
                        <li>You've tested the workflow to ensure it works as expected</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Best Practices */}              <Card className="bg-black/60 backdrop-blur-md border border-purple-900/40 p-6 rounded-xl shadow-xl relative overflow-hidden" id="best-practices">
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                    <CheckCircle2 className="h-5 w-5 mr-2 text-purple-400" />
                    Best Practices
                  </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-black/40 rounded-lg p-4 border border-purple-900/30">
                      <h3 className="text-lg font-medium text-white mb-2 flex items-center">
                        <ChevronRight className="h-5 w-5 mr-2 text-purple-400" />
                        Start Simple
                      </h3>
                      <p className="text-gray-300 text-sm">
                        Begin with a simple workflow and gradually add complexity as you become more familiar with the system.
                      </p>
                    </div>

                    <div className="bg-black/40 rounded-lg p-4 border border-purple-900/30">
                      <h3 className="text-lg font-medium text-white mb-2 flex items-center">
                        <ChevronRight className="h-5 w-5 mr-2 text-purple-400" />
                        Test Each Step
                      </h3>
                      <p className="text-gray-300 text-sm">
                        Ensure each building block works as expected before connecting it to others in your workflow.
                      </p>
                    </div>

                    <div className="bg-black/40 rounded-lg p-4 border border-purple-900/30">
                      <h3 className="text-lg font-medium text-white mb-2 flex items-center">
                        <ChevronRight className="h-5 w-5 mr-2 text-purple-400" />
                        Descriptive Names
                      </h3>
                      <p className="text-gray-300 text-sm">
                        Use clear, descriptive names for your building blocks to make your workflow easier to understand.
                      </p>
                    </div>

                    <div className="bg-black/40 rounded-lg p-4 border border-purple-900/30">
                      <h3 className="text-lg font-medium text-white mb-2 flex items-center">
                        <ChevronRight className="h-5 w-5 mr-2 text-purple-400" />
                        System Instructions
                      </h3>
                      <p className="text-gray-300 text-sm">
                        For LLM building blocks, provide clear instructions about their role in the workflow.
                      </p>
                    </div>

                    <div className="bg-black/40 rounded-lg p-4 border border-purple-900/30 md:col-span-2">
                      <h3 className="text-lg font-medium text-white mb-2 flex items-center">
                        <ChevronRight className="h-5 w-5 mr-2 text-purple-400" />
                        Check Input/Output Types
                      </h3>
                      <p className="text-gray-300 text-sm">
                        Ensure that connected building blocks have compatible input/output types to avoid errors in your workflow.
                      </p>
                    </div>
                  </div>                  <div className="bg-purple-900/20 border border-purple-700/30 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-white mb-2 flex items-center">
                      <Lightbulb className="h-5 w-5 mr-2 text-purple-400" />
                      Pro Tips
                    </h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-300 ml-2">
                      <li>Use the building block details popup to inspect configurations</li>
                      <li>Organize your workflow in a logical order from left to right</li>
                      <li>Consider visibility settings based on how you want to share your service</li>
                      <li>Use the workflow summary in the preview tab to verify all steps</li>
                    </ul>
                  </div>
                </div>
              </Card>

              {/* Common Workflows */}              <Card className="bg-black/60 backdrop-blur-md border border-purple-900/40 p-6 rounded-xl shadow-xl relative overflow-hidden" id="common-workflows">
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                    <Puzzle className="h-5 w-5 mr-2 text-purple-400" />
                    Common Workflows
                  </h2>                    <div className="space-y-4">
                      <div className="bg-black/40 rounded-lg p-4 border border-purple-900/30">
                        <h3 className="text-lg font-medium text-white mb-2">Text-to-Text Pipeline</h3>
                        <p className="text-gray-400 mb-2">Input (Text) → OpenAI/Claude/Gemini → Output (Text)</p>
                        <p className="text-gray-300 text-sm">
                          Good for: Q&A, content generation, summarization, and other text processing tasks.
                        </p>
                      </div>

                      <div className="bg-black/40 rounded-lg p-4 border border-purple-900/30">
                        <h3 className="text-lg font-medium text-white mb-2">Translation Service</h3>
                        <p className="text-gray-400 mb-2">Input (Text) → Google Translate → Output (Text)</p>
                        <p className="text-gray-300 text-sm">
                          Good for: Language translation services between different languages.
                        </p>
                      </div>

                      <div className="bg-black/40 rounded-lg p-4 border border-purple-900/30">
                        <h3 className="text-lg font-medium text-white mb-2">Text-to-Speech Service</h3>
                        <p className="text-gray-400 mb-2">Input (Text) → Edge TTS → Output (Audio)</p>
                        <p className="text-gray-300 text-sm">
                          Good for: Converting text to spoken audio in various voices and languages.
                        </p>
                      </div>

                      <div className="bg-black/40 rounded-lg p-4 border border-purple-900/30">
                        <h3 className="text-lg font-medium text-white mb-2">Document Q&A Service</h3>
                        <p className="text-gray-400 mb-2">Input (Text) → RAG Building Block → LLM Building Block → Output (Text)</p>
                        <p className="text-gray-300 text-sm">
                          Good for: Answering questions based on document content using retrieval augmented generation.
                        </p>
                      </div>
                  </div>
                </div>
              </Card>

              {/* Troubleshooting */}              <Card className="bg-black/60 backdrop-blur-md border border-purple-900/40 p-6 rounded-xl shadow-xl relative overflow-hidden" id="troubleshooting">
                <div className="relative z-10">
                  <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2 text-purple-400" />
                    Troubleshooting
                  </h2>
                    <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-red-900/50 text-white flex items-center justify-center mr-3 flex-shrink-0">
                        <AlertCircle className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium">Connection Issues</h3>
                        <p className="text-gray-300 text-sm">Ensure your building blocks' input/output types are compatible. For example, if one building block outputs image data, the next building block should be able to process image inputs.</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-red-900/50 text-white flex items-center justify-center mr-3 flex-shrink-0">
                        <AlertCircle className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium">Deployment Failures</h3>
                        <p className="text-gray-300 text-sm">Check that all required fields are filled in. Your service must have a title and at least one building block in the workflow connected from input to output.</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-red-900/50 text-white flex items-center justify-center mr-3 flex-shrink-0">
                        <AlertCircle className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium">Performance Issues</h3>
                        <p className="text-gray-300 text-sm">Complex workflows with many building blocks may have longer processing times. Consider simplifying your workflow or breaking it into separate services if performance is an issue.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Quick Links */}
                <Card className="bg-black/60 backdrop-blur-md border border-purple-900/40 p-6 rounded-xl shadow-xl">
                  <h3 className="text-lg font-semibold text-white mb-4">Quick Navigation</h3>                  <div className="space-y-2">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-gray-300 hover:text-white hover:bg-purple-900/30"
                      onClick={() => document.getElementById('overview')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                      <Info className="h-4 w-4 mr-2" />
                      Overview
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-gray-300 hover:text-white hover:bg-purple-900/30"
                      onClick={() => document.getElementById('getting-started')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Getting Started
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-gray-300 hover:text-white hover:bg-purple-900/30"
                      onClick={() => document.getElementById('service-details')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                      <PenTool className="h-4 w-4 mr-2" />
                      Service Details
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-gray-300 hover:text-white hover:bg-purple-900/30"
                      onClick={() => document.getElementById('workflow-builder')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                      <Workflow className="h-4 w-4 mr-2" />
                      Workflow Builder
                    </Button>                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-gray-300 hover:text-white hover:bg-purple-900/30"
                      onClick={() => document.getElementById('building-block-types')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                      <Puzzle className="h-4 w-4 mr-2" />
                      Building Block Types
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-gray-300 hover:text-white hover:bg-purple-900/30"
                      onClick={() => document.getElementById('preview-tab')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Preview Tab
                    </Button>                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-gray-300 hover:text-white hover:bg-purple-900/30"
                      onClick={() => document.getElementById('best-practices')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Best Practices
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-gray-300 hover:text-white hover:bg-purple-900/30"
                      onClick={() => document.getElementById('enhance-prompt')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                      <Wand2 className="h-4 w-4 mr-2" />
                      Enhance Prompt
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-gray-300 hover:text-white hover:bg-purple-900/30"
                      onClick={() => document.getElementById('common-workflows')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                      <Puzzle className="h-4 w-4 mr-2" />
                      Common Workflows
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-gray-300 hover:text-white hover:bg-purple-900/30"
                      onClick={() => document.getElementById('troubleshooting')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Troubleshooting
                    </Button>
                  </div>
                </Card>

                {/* Quick Tips */}
                <Card className="bg-black/60 backdrop-blur-md border border-purple-900/40 p-6 rounded-xl shadow-xl">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Lightbulb className="h-5 w-5 mr-2 text-yellow-400" />
                    Quick Tips
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4">
                      <p className="text-gray-300 text-sm">
                        <span className="text-yellow-400 font-medium">Design Tip:</span> Arrange your workflow from left to right to make it easier to understand.
                      </p>
                    </div>                    <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4">
                      <p className="text-gray-300 text-sm">
                        <span className="text-yellow-400 font-medium">LLM Building Blocks:</span> Use detailed system instructions to get better results from language models.
                      </p>
                    </div>
                    <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4">
                      <p className="text-gray-300 text-sm">
                        <span className="text-yellow-400 font-medium">Workflow Tip:</span> Test your workflow with simple inputs before deploying to ensure it works as expected.
                      </p>
                    </div>
                  </div>
                </Card>


                {/* Return to Builder */}
                <Card className="bg-gradient-to-br from-purple-900/80 to-indigo-900/80 backdrop-blur-md p-6 rounded-xl shadow-xl">
                  <h3 className="text-lg font-semibold text-white mb-2">Ready to Build?</h3>
                  <p className="text-gray-300 text-sm mb-4">
                    Return to the Service Workflow Builder to create your custom AI service.
                  </p>
                  <Link href="/apps/create/service-workflow-builder">
                    <Button className="w-full bg-white text-purple-900 hover:bg-gray-200">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Return to Builder
                    </Button>
                  </Link>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
