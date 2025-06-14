"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserNav } from "@/components/user-nav"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

interface NavBarProps {
  hideOnRoutes?: string[]
}

export function NavBar({ hideOnRoutes = [] }: NavBarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, isLoading, signOut, userId } = useAuth()
  const [open, setOpen] = useState(false)
  const [renderState, setRenderState] = useState({
    showUserNav: false,
    checkCount: 0
  })

  // Hide navbar on specific routes
  const shouldHideNavbar = hideOnRoutes.some(route => pathname === route || pathname.startsWith(route))
  
  if (shouldHideNavbar) {
    return null
  }

  // Güvenilir bir isAuthenticated kontrolü ekleyin
  useEffect(() => {
    if (isAuthenticated && !renderState.showUserNav) {
      setRenderState(prev => ({ 
        showUserNav: true, 
        checkCount: prev.checkCount 
      }))
    } else if (!isAuthenticated && renderState.showUserNav) {
      // Oturum kapatıldığında UserNav'ı gizleyin
      setRenderState(prev => ({ 
        showUserNav: false, 
        checkCount: prev.checkCount 
      }))
    }
  }, [isAuthenticated, renderState.showUserNav])

  // İlk yüklemede isAuthenticated değerinin stabilize olması için ek kontrol
  useEffect(() => {
    // Maksimum 3 kontrol ile sınırlayın
    if (!renderState.showUserNav && isAuthenticated && renderState.checkCount < 3) {
      const timer = setTimeout(() => {
        setRenderState(prev => ({ 
          showUserNav: isAuthenticated, 
          checkCount: prev.checkCount + 1 
        }))
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, renderState])

  // Empty navigation items array - removed My Apps, API Keys, and Settings
  const navItems: { title: string; href: string }[] = []

  return (
    <nav className="fixed top-2 left-2 right-2 z-50">
      <div className="max-w-6xl mx-auto bg-black/5 backdrop-blur border border-white/10 rounded-2xl shadow-2xl shadow-purple-500/10">
        <div className="px-6">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center gap-4 md:gap-12">
              <Link href="/" className="flex items-center group">
                <div className="relative">
                <div className="w-10 h-10 rounded-2xl  flex items-center justify-center shadow-sm cursor-pointer" onClick={() => router.push("/")}>
                    <img src="../logo.png" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl blur-md opacity-50 -z-10" />
                </div>
                <span className="ml-3 text-white font-semibold text-sm bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">DeepFlux</span>
              </Link>

              {/* Menü sadece giriş yapılınca */}
              {isAuthenticated && navItems.length > 0 && (
                <div className="hidden md:flex items-center space-x-6">
                  {navItems.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      className={cn(
                        "text-xs font-medium transition-all duration-300 hover:text-white px-3 py-1.5 rounded-xl hover:bg-white/10",
                        pathname === item.href ? "text-white bg-white/10" : "text-gray-400",
                      )}
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {renderState.showUserNav || isAuthenticated ? (
                <UserNav key={userId || 'guest'} />
              ) : (
                <>
                  {/* Show login/register buttons for non-authenticated users on documentation page */}
                  {pathname.includes('/documentation') && (
                    <div className="flex items-center gap-2">
                      <Link href="/auth/login">
                        <Button variant="ghost" className="text-gray-300 hover:text-white h-8 px-4 text-xs rounded-xl hover:bg-white/10 transition-all duration-300">
                          Login
                        </Button>
                      </Link>
                      <Link href="/auth/register">
                        <Button variant="outline" className="border-purple-500/30 bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-white hover:from-purple-500/30 hover:to-blue-500/30 transition-all duration-300 h-8 px-4 text-xs rounded-xl shadow-lg shadow-purple-500/20">
                          Register
                        </Button>
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
