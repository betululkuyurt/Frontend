# Service Workflow Builder Documentation

## Overview

The Service Workflow Builder is a powerful tool that allows you to create custom AI services by combining different AI agents into a workflow. With this tool, you can design complex, multi-step AI processes without writing any code.

## Getting Started

### Accessing the Service Workflow Builder

1. Navigate to the Apps section in the main menu
2. Click on "Create New Service" or "Create Custom AI Service" button
3. You'll be taken to the Service Workflow Builder interface

## The Interface

The Service Workflow Builder is divided into three main tabs:

1. **Service Details** - Define basic information about your service
2. **Workflow** - Design the workflow by adding and connecting agents
3. **Preview** - Preview your service and deploy it

### Service Details Tab

In this tab, you'll define the basic information about your service:

- **Title** - Give your service a name (required)
- **Description** - Describe what your service does
- **Placeholder** - The placeholder text that will appear in the input field
- **Button Text** - The text that will appear on the submit button

### Workflow Builder Tab

This is where you design the actual workflow for your service:

#### Adding Agents

1. Click the "Create New Agent" button to add a new agent to your workflow
2. Fill in the required details:
   - **Agent Name** - A unique name for your agent
   - **Agent Type** - Select from various AI agent types (OpenAI, Claude, Gemini, etc.)
   - **Description** - A brief description of what this agent does
   - **System Instruction** - Instructions for the agent (for LLM agents)

#### Agent Types

You can choose from various agent types:

- **Text Generation Agents**:
  - OpenAI - Powered by GPT models
  - Gemini - Google's multimodal AI model
  - Claude - Anthropic's AI assistant

- **Specialized Agents**:
  - Google Translate - For language translation
  - Edge TTS - For text-to-speech conversion
  - RAG (Retrieval Augmented Generation) - For using document knowledge

## Detailed Agent Types Reference

### 1. Text Generation Agents

#### Gemini Agent
- **Type**: `gemini`
- **Input**: Text
- **Output**: Text
- **API Key Required**: Yes (Gemini API key)
- **Description**: Uses Google's Gemini AI model for text generation, conversation, and analysis.

#### OpenAI Agent
- **Type**: `openai`
- **Input**: Text
- **Output**: Text
- **API Key Required**: Yes (OpenAI API key)
- **Description**: Leverages OpenAI's GPT models for text generation and completion tasks.

#### Claude Agent
- **Type**: `claude`
- **Input**: Text
- **Output**: Text
- **API Key Required**: Yes (Claude API key)
- **Description**: Uses Anthropic's Claude AI model for text generation and analysis.

#### Custom Endpoint LLM Agent
- **Type**: `custom_endpoint_llm`
- **Input**: Text
- **Output**: Text
- **API Key Required**: Yes
- **Description**: Connects to custom LLM endpoints for text generation tasks.

### 2. Text-to-Speech (TTS) Agents

#### Edge TTS Agent
- **Type**: `edge_tts`
- **Input**: Text
- **Output**: Audio (MP3)
- **API Key Required**: No
- **Description**: Uses Microsoft Edge's text-to-speech service with multiple voice options.
- **Features**:
  - Multiple languages and voices
  - Adjustable rate, volume, and pitch
  - High-quality audio output

#### Bark TTS Agent
- **Type**: `bark_tts`
- **Input**: Text
- **Output**: Audio (WAV)
- **API Key Required**: No
- **Description**: Uses Suno's Bark model for realistic text-to-speech with emotion and tone.
- **Features**:
  - Natural-sounding voices
  - Emotion and tone control
  - Multiple voice presets

### 3. Speech-to-Text Agent

#### Transcribe Agent
- **Type**: `transcribe`
- **Input**: Audio/Video files
- **Output**: Text
- **API Key Required**: No
- **Description**: Transcribes audio and video files to text using WhisperX.
- **Features**:
  - Multiple language support
  - Timestamp inclusion option
  - High accuracy transcription

### 4. Image Generation Agent

#### Gemini Text-to-Image Agent
- **Type**: `dalle`
- **Input**: Text prompt
- **Output**: Image
- **API Key Required**: Yes (Gemini API key)
- **Description**: Generates images from text prompts using Google's Gemini model.

### 5. Translation Agent

#### Google Translate Agent
- **Type**: `google_translate`
- **Input**: Text
- **Output**: Translated text
- **API Key Required**: No
- **Description**: Translates text between multiple languages using Google Translate.

### 6. Document Processing Agent

#### Document Parser Agent
- **Type**: `document_parser`
- **Input**: Documents
- **Output**: Text
- **API Key Required**: No
- **Description**: Extracts and processes text from various document formats.

### 7. Research Agent

#### Internet Research Agent
- **Type**: `internet_research`
- **Input**: Text query
- **Output**: Research results
- **API Key Required**: No
- **Description**: Performs internet research and returns structured information.

### 8. RAG (Retrieval-Augmented Generation) Agent

#### RAG Agent
- **Type**: `rag`
- **Input**: Text query + PDF document
- **Output**: Text answers based on document
- **API Key Required**: Yes (Gemini API key for embeddings)
- **Description**: Answers questions based on uploaded PDF documents using vector search and LLM generation.
- **Features**:
  - PDF document ingestion
  - Vector-based similarity search
  - Context-aware responses

#### Building Your Workflow

1. After creating agents, they will appear as nodes in the workflow canvas
2. Connect agents by dragging from one node's output to another node's input
3. Arrange the workflow in the order you want the processing to happen
4. You must connect your workflow from the input node to the output node

### Preview Tab

In this tab, you can:

- View a preview of how your service will appear to users
- See a summary of your service details and workflow steps
- Deploy your service when you're satisfied with it

## Best Practices

1. **Start Simple** - Begin with a simple workflow and gradually add complexity
2. **Test Each Step** - Ensure each agent works as expected before connecting it to others
3. **Descriptive Names** - Use clear, descriptive names for your agents to understand your workflow
4. **System Instructions** - For LLM agents, provide clear instructions about their role in the workflow
5. **Check Input/Output Types** - Ensure that connected agents have compatible input/output types

## Common Workflows

### Text-to-Text Pipeline

1. Input (Text) → OpenAI/Claude/Gemini → Output (Text)
   - Good for: Q&A, content generation, summarization

### Translation Service

1. Input (Text) → Google Translate → Output (Text)
   - Good for: Language translation services

### Text-to-Speech Service

1. Input (Text) → Edge TTS → Output (Audio)
   - Good for: Converting text to spoken audio

### Document Q&A Service

1. Input (Text) → RAG Agent → LLM Agent → Output (Text)
   - Good for: Answering questions based on document content

## Deployment

After designing your service:

1. Review all details in the Preview tab
2. Click the "Deploy Service" button
3. Your service will be available in your dashboard
4. You can make your service public or private using the visibility settings

## Troubleshooting

- **Connection Issues**: Ensure your agents' input/output types are compatible
- **Deployment Failures**: Check that all required fields are filled in
- **Performance Issues**: Complex workflows with many agents may have longer processing times

## Next Steps

After deploying your service:

1. Access it from your dashboard
2. Share it with others if you've made it public
3. Monitor its usage and performance
4. Iterate and improve based on feedback

---

For further assistance, contact support or refer to the platform's general documentation.
