"use client"

/**
 * AI Suite Landing Page
 * 
 * Bu bileşen, uygulamanın ana giriş sayfasını oluşturur ve giriş yapmamış kullanıcılara
 * platformun özelliklerini tanıtır.
 * 
 * Özellikler:
 * - Kullanıcı durumuna göre yönlendirme (giriş yapmış kullanıcıları apps sayfasına yönlendirir)
 * - İkna edici başlık ve açıklama metni
 * - Kayıt olma ve giriş yapma butonları
 * - Öne çıkan AI araçlarının gösterimi
 * - Görsel olarak çekici tasarım ve gradient arka plan
 * - Sorunsuz kullanıcı deneyimi için responsive tasarım
 * - Sihirli kaydırma animasyonu ile kişi illüstrasyonu ve parçacıklar
 */
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import MagicalScrollAnimation from "@/components/MagicalScrollAnimation"
import {
  BookOpen,
  Video,
  MessageSquare,
  ArrowRight,
  Users,
  Share2,
  GitBranch,
  Cpu,
  FileText,
  Mic,
  Voicemail,
  ImageIcon,
  Workflow,
  Puzzle,
  Zap,
  Layers,
  CheckCircle,
  BarChart3,
  Settings2,
  Lightbulb,
  Rocket,
} from "lucide-react"

export default function Home() {
  
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.push('/apps');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-[#070707] text-gray-300">Loading...</div>;
  }
  if (!isAuthenticated) {
   return (
      <div className="relative min-h-screen overflow-hidden bg-[#070707] text-gray-300">
        {/* Magical Scroll Animation - Fixed overlay */}
        <MagicalScrollAnimation />
        
        {/* Navbar - Similar to Scout OS */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-md border-b border-gray-800/50">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-1">
              <div className="h-8 w-8 bg-purple-600 rounded-md flex items-center justify-center">
                <Cpu className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">MyGen-AI Suite</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-sm text-gray-300 hover:text-purple-400 transition-colors">Features</a>
              <a href="#why-us" className="text-sm text-gray-300 hover:text-purple-400 transition-colors">Why Choose Us</a>
            </div>            <Link href="/auth/login">
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-4 py-2 rounded-md">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Background with grid pattern - Scout OS style */}
        <div className="absolute inset-0 overflow-hidden -z-10">
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(67,56,202,0.15),transparent_70%)]"></div>
          <div className="absolute inset-0" style={{ 
            backgroundImage: 'linear-gradient(rgba(13, 12, 34, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(13, 12, 34, 0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}></div>
          
          {/* Gradient orbs/lights similar to Scout OS */}
          <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-br from-purple-600/10 via-indigo-600/10 to-transparent blur-[120px] opacity-60"></div>
          <div className="absolute bottom-0 left-0 w-[50vw] h-[40vw] rounded-full bg-gradient-to-tr from-blue-900/10 via-purple-800/10 to-transparent blur-[120px] opacity-60"></div>
          
          {/* Bottom gradient line - similar to Scout OS footer gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/40 to-transparent"></div>
        </div>

        {/* Content with Scout OS style layout */}
        <div className="relative z-10 pt-24">
          {/* Hero Section - Scout OS style with centered content and code mockup */}
          <section className="py-20 md:py-32">
            <div className="container mx-auto px-4 text-center max-w-5xl">
              <div className="inline-flex items-center bg-gray-800/30 border border-gray-700/50 rounded-full px-3 py-1 mb-6">
                <span className="bg-green-500 h-2 w-2 rounded-full mr-2"></span>
                <span className="text-xs font-medium text-gray-300">Beta Version</span>
              </div>
              
              {/* Enhanced backdrop gradients behind the heading */}
              <div className="relative">
                <div className="absolute -top-20 -left-[30%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-tr from-purple-700/15 to-indigo-600/10 blur-[80px]"></div>
                <div className="absolute -top-10 -right-[20%] w-[35vw] h-[35vw] rounded-full bg-gradient-to-bl from-purple-600/20 to-violet-800/10 blur-[100px]"></div>
                <div className="absolute top-40 left-[10%] w-[20vw] h-[20vw] rounded-full bg-gradient-to-r from-fuchsia-600/15 to-purple-700/10 blur-[70px]"></div>
                <h1 className="relative text-3xl md:text-5xl lg:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-300 to-white">
                  The All-In-One <span className="text-purple-500">AI Suite</span> for Everyone
                </h1>
              </div>
              
              <p className="relative text-md md:text-lg text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed z-10">
                Build, connect, and deploy AI building blocks across multiple models with a unified workflow. 
                Create powerful solutions with text, voice, and vision capabilities without limits.
              </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 relative z-10">
                <Link href="/auth/register">
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm px-6 py-3 rounded-md">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800 font-medium text-sm px-6 py-3 rounded-md">
                    Explore Features <Lightbulb className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              
              {/* Code/UI mockup frame with enhanced backdrop gradients */}
              <div className="relative">
                {/* Additional gradient backdrops for the mockup */}
                <div className="absolute -bottom-20 -left-[10%] w-[30vw] h-[30vw] rounded-full bg-gradient-to-tr from-indigo-700/20 to-purple-600/15 blur-[90px]"></div>
                <div className="absolute -bottom-10 right-[5%] w-[25vw] h-[25vw] rounded-full bg-gradient-to-tl from-violet-600/15 to-purple-800/10 blur-[70px]"></div>
                <div className="absolute top-[30%] right-[20%] w-[15vw] h-[15vw] rounded-full bg-gradient-to-bl from-purple-500/20 to-fuchsia-700/10 blur-[60px]"></div>
                
                <div className="relative mx-auto max-w-4xl rounded-lg overflow-hidden border border-gray-800/50 shadow-2xl">
                  <div className="bg-gray-900/90 border-b border-gray-800 p-2 flex items-center">
                    <div className="flex space-x-1.5 mr-4">
                      <div className="h-3 w-3 rounded-full bg-red-500"></div>
                      <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="text-xs text-gray-400 flex-1 text-center">AI Workflow Builder</div>
                  </div>
                    <div className="aspect-video w-full bg-gradient-to-b from-gray-900 to-black p-4 flex items-center justify-center relative overflow-hidden">
                    {/* Interior gradients for depth inside the mockup */}
                    <div className="absolute -top-10 -left-10 w-[20vw] h-[20vw] rounded-full bg-purple-800/10 blur-[50px]"></div>
                    <div className="absolute bottom-0 right-0 w-[25vw] h-[25vw] rounded-full bg-indigo-700/10 blur-[60px]"></div>
                    
                    <div className="relative w-full h-full z-10">
                      <video 
                      src="/videos/landing_video.mp4"
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover rounded-md"
                      >
                      Your browser does not support the video tag.
                      </video>
                      
                      {/* Custom progress bar */}
                      <div className="absolute bottom-2 left-0 right-0 mx-auto w-[90%] h-1 bg-gray-800/60 rounded-full overflow-hidden">
                      <div className="progress-bar h-full w-full bg-gradient-to-r from-purple-500 to-indigo-500 origin-left"></div>
                      </div>
                      
                      {/* Add CSS for progress bar animation */}
                      <style jsx>{`
                      @keyframes progress {
                        0% { transform: scaleX(0); }
                        100% { transform: scaleX(1); }
                      }
                      .progress-bar {
                        animation: progress linear;
                        animation-duration: 40s;
                        animation-iteration-count: infinite;
                      }
                      `}</style>
                    </div>
                    </div>
                </div>
              </div>
              
              {/* Logos/Partners section - like Scout OS */}
              <div className="mt-16">
                <p className="text-xs text-gray-500 mb-4">TRUSTED BY INNOVATIVE TEAMS</p>
                <div className="flex flex-wrap justify-center gap-8 opacity-50">
                  {["Company 1", "Company 2", "Company 3", "Company 4"].map(company => (
                    <div key={company} className="text-gray-400 text-sm font-semibold">{company}</div>
                  ))}
                </div>
              </div>
            </div>
          </section>
          
          {/* Key Value Propositions Section */}
          <section className="py-12 bg-black/20" id="features">
            <div className="container mx-auto px-12">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">The Only Limit is Your Imagination</h2>
              
              {/* Visual building blocks grid with subtle gradient animations */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {[
                  { icon: <Cpu className="h-6 w-6 text-purple-400" />, title: "Custom AI Agents", description: "Build with Gemini, OpenAI, and more models.", color: "from-purple-600/20 to-purple-800/10" },
                  { icon: <FileText className="h-6 w-6 text-blue-400" />, title: "RAG Solutions", description: "Create Retrieval Augmented Generation with document grounding.", color: "from-blue-600/20 to-indigo-800/10" },
                  { icon: <Voicemail className="h-6 w-6 text-green-400" />, title: "Text-to-Speech", description: "Develop TTS apps with Edge TTS, Bark TTS.", color: "from-emerald-600/20 to-green-800/10" },
                  { icon: <Mic className="h-6 w-6 text-yellow-400" />, title: "Speech-to-Text", description: "Implement precise speech-to-text transcription.", color: "from-amber-600/20 to-yellow-800/10" },
                  { icon: <ImageIcon className="h-6 w-6 text-pink-400" />, title: "Image Generation", description: "Generate stunning images from text prompts.", color: "from-pink-600/20 to-rose-800/10" },
                  { icon: <Workflow className="h-6 w-6 text-violet-400" />, title: "Multi-Agent Workflows", description: "Design complex tasks with interconnected AI agents.", color: "from-violet-600/20 to-purple-800/10" },
                  { icon: <Puzzle className="h-6 w-6 text-cyan-400" />, title: "No-Code Connections", description: "Connect agents innovatively without writing code.", color: "from-cyan-600/20 to-blue-800/10" },
                  { icon: <Zap className="h-6 w-6 text-orange-400" />, title: "Instant Deployments", description: "Go from concept to production in minutes.", color: "from-orange-600/20 to-red-800/10" }
                ].map((item, index) => (
                  <div 
                    key={item.title} 
                    className="group aspect-square relative overflow-hidden rounded-lg border border-gray-800 bg-gray-900/40 backdrop-blur-sm hover:border-gray-700 transition-all duration-300"
                    style={{ 
                      animationDelay: `${index * 70}ms`,
                      animation: "fadeIn 0.8s ease-out forwards"
                    }}
                  >
                    {/* Building block content container */}
                    <div className="absolute inset-0 p-4 flex flex-col h-full z-10">
                      {/* Icon in square "connector" */}
                      <div className="w-10 h-10 rounded-md border border-gray-700 bg-gray-800/80 backdrop-filter backdrop-blur-sm flex items-center justify-center shadow-md mb-3 group-hover:border-gray-600 transition-colors">
                        {item.icon}
                      </div>
                      
                      {/* Title and description */}
                      <h3 className="text-sm font-semibold mb-1 text-white tracking-tight">{item.title}</h3>
                      <p className="text-xs text-gray-400 leading-relaxed mt-1 line-clamp-3">{item.description}</p>
                      
                      {/* "Connect" indicator at bottom */}
                      <div className="mt-auto pt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-xs text-gray-500 flex items-center">
                        <div className="w-2 h-2 rounded-full bg-gray-600 mr-2"></div>
                        Connect
                      </div>
                    </div>
                    
                    {/* Gradient backdrop */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-40 group-hover:opacity-60 transition-opacity duration-300`}></div>
                    
                    {/* Building block "connectors" */}
                    <div className="absolute top-1/2 right-0 w-1.5 h-1.5 rounded-full bg-gray-600 transform translate-x-1/2 -translate-y-1/2 z-10 group-hover:bg-gray-400 transition-colors"></div>
                    <div className="absolute left-1/2 bottom-0 w-1.5 h-1.5 rounded-full bg-gray-600 transform -translate-x-1/2 translate-y-1/2 z-10 group-hover:bg-gray-400 transition-colors"></div>
                  </div>
                ))}
              </div>
              
              {/* Component connection animation */}
              <div className="mt-10 text-center">
                <p className="text-sm text-gray-400">
                  Connect components to build powerful AI workflows
                </p>
                <div className="mt-4 h-1 max-w-sm mx-auto bg-gradient-to-r from-transparent via-purple-500/40 to-transparent"></div>
              </div>
            </div>
          </section>

          {/* Collaborative Features Section */}
          <section className="py-12 bg-black/20">
            <div className="container mx-auto px-6">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">Collaborate and Scale</h2>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                {[

                  { icon: <Users className="h-8 w-8 text-purple-500 mx-auto mb-3" />, title: "Team Workspaces", description: "Organize projects and collaborate seamlessly with your team." },
                  { icon: <Share2 className="h-8 w-8 text-purple-500 mx-auto mb-3" />, title: "Shared Agents & Workflows", description: "Share and reuse AI components to accelerate development." },
                  { icon: <GitBranch className="h-8 w-8 text-purple-500 mx-auto mb-3" />, title: "Version Control", description: "Track changes and manage versions of your AI solutions effectively." },
                ].map(item => (
                  <div key={item.title} className="p-5 bg-gray-900/30 rounded-lg">
                    {item.icon}
                    <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-400">{item.description}</p>
                  </div>
                ))}

              </div>
            </div>
          </section>

        

          {/* Features Comparison Table (Placeholder) */}
          <section className="py-12 bg-black/20 backdrop-blur-sm" id="why-us">
            <div className="container mx-auto px-6">
              <h2 className="text-xl md:text-2xl font-bold text-center mb-8 text-gray-200">Why MyGen-AI Suite?</h2>
              <div className="overflow-x-auto max-w-3xl mx-auto rounded-lg border border-gray-800/50 shadow-xl">
                <table className="w-full min-w-max text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-700 bg-gray-900/50">
                      <th className="p-3 text-purple-400 font-medium">Feature</th>
                      <th className="p-3 text-purple-400 font-medium">MyGen-AI Suite</th>
                      <th className="p-3 text-gray-500 font-medium">Isolated AI Tools</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { feature: "Unified Platform", us: "All-in-one solution", them: "Multiple, disjointed tools" },
                      { feature: "Model Flexibility", us: "Wide range (OpenAI, Gemini, etc.)", them: "Often model-specific" },
                      { feature: "Workflow Creation", us: "Visual & No-Code", them: "Requires coding / complex integration" },
                      { feature: "Collaboration", us: "Public workflows", them: "Everything is private" },
                    ].map(row => (
                      <tr key={row.feature} className="border-b border-gray-800/50 hover:bg-gray-800/40 transition-colors duration-200">
                        <td className="p-3 font-medium text-gray-300 text-xs">{row.feature}</td>
                        <td className="p-3 text-green-500 text-xs"><CheckCircle className="inline h-3 w-3 mr-1" />{row.us}</td>
                        <td className="p-3 text-red-400 text-xs">{row.them}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* How It Works Section */}
          <section className="py-12">
            <div className="container mx-auto px-4 max-w-5xl">
              <h2 className="text-xl md:text-2xl font-bold text-center mb-8 text-gray-200">Get Started in Minutes</h2>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                {[
                  { 
                    icon: <Settings2 className="h-7 w-7 text-purple-400 mx-auto mb-2 transform transition-transform hover:rotate-90 duration-500" />, 
                    step: "1. Configure", 
                    description: "Choose your AI models and set up data sources." 
                  },
                  { 
                    icon: <Layers className="h-7 w-7 text-purple-400 mx-auto mb-2 transition-all duration-500 hover:translate-y-[-2px]" />, 
                    step: "2. Build", 
                    description: "Visually design your AI agents and workflows." 
                  },
                  { 
                    icon: <Rocket className="h-7 w-7 text-purple-400 mx-auto mb-2 transition-all duration-500 hover:translate-y-[-4px]" />, 
                    step: "3. Deploy & Innovate", 
                    description: "Launch your AI solutions and iterate with ease." 
                  },
                ].map((item, index) => (
                  <div 
                    key={item.step} 
                    className="p-4 bg-gray-900/40 backdrop-blur-sm rounded-md border border-gray-800/50 shadow-lg hover:shadow-purple-900/10 hover:border-purple-900/20 transition-all duration-300 transform hover:-translate-y-1"
                    style={{ 
                      animationDelay: `${index * 150}ms`,
                      animation: "fadeInUp 0.8s ease-out forwards"
                    }}
                  >
                    <div className="p-2 bg-gray-800/50 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 shadow-inner shadow-black/50">
                      {item.icon}
                    </div>
                    <h3 className="text-sm font-semibold mb-1 text-purple-300">{item.step}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
          
          {/* Final CTA Section */}
          <section className="py-16 bg-gradient-to-r from-purple-700/80 via-purple-800/90 to-black">
            <div className="container mx-auto px-6 text-center">
             
              <p className="text-lg text-purple-200 mb-6 max-w-xl mx-auto">
                Join MyGen-AI Suite today and start building anything you can imagine.
                Your imagination is the only boundary.
              </p>              <Link href="/auth/register">
                <Button size="lg" variant="outline" className="border-purple-300 text-purple-300 hover:bg-purple-300 hover:text-black text-md px-6 py-3 rounded-md">
                  Sign Up for Free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </section>

          {/* Footer */}
          <footer className="py-6 bg-black text-center text-gray-500 text-xs">
            <div className="container mx-auto px-6">
              <p>&copy; {new Date().getFullYear()} MyGeneretive-AI. All rights reserved.</p>
              <p className="mt-1">Contact: info@mygeneretive-ai.com (Placeholder)</p>
              {/* Add social media links or other footer content here */}
            </div>
          </footer>
        </div>
      </div>
    );
  }
 
}

