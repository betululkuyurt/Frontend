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
 */
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import {
  BookOpen,
  Video,
  MessageSquare,
  ArrowRight,
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
    return <div>Loading...</div>;
  }
  if (!isAuthenticated) {
    return (
     
      <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black">
       

        {/* Hero Section */}
        <main className="pt-32 pb-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">Your All-in-One AI Suite</h1>
              <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                Access powerful AI tools for content creation, translation, research, and more. All in one place,
                designed for everyone.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-purple-600 hover:bg-purple-700" asChild>
                  <Link href="/auth/register">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="bg-black/30 border-purple-900/30" asChild>
                  <Link href="/auth/login">Sign In</Link>
                </Button>
              </div>
            </div>

            {/* Feature Preview */}
            <div className="mt-24">
              <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
                Discover Our AI-Powered Tools
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-purple-900/30 p-6">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mb-4">
                    <Video className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Video Translation</h3>
                  <p className="text-gray-400">
                    Translate spoken language in videos in real-time with advanced AI technology.
                  </p>
                </div>
                <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-purple-900/30 p-6">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-600 to-purple-600 flex items-center justify-center mb-4">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Story Generation</h3>
                  <p className="text-gray-400">
                    Create unique stories and content with AI-powered creative writing tools.
                  </p>
                </div>
                <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-purple-900/30 p-6">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center mb-4">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">AI Research</h3>
                  <p className="text-gray-400">
                    Conduct comprehensive research with AI-assisted analysis and summaries.
                  </p>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="mt-24 text-center">
              <div className="bg-black/40 backdrop-blur-sm rounded-xl border border-purple-900/30 p-8 max-w-3xl mx-auto">
                <h2 className="text-2xl font-bold text-white mb-4">Ready to Get Started?</h2>
                <p className="text-gray-400 mb-6">
                  Join thousands of users who are already creating amazing content with our AI tools.
                </p>
                <Button size="lg" className="bg-purple-600 hover:bg-purple-700" asChild>
                  <Link href="/auth/register">Create Free Account</Link>
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }
 
}

