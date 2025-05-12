"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserNav } from "@/components/user-nav"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function NavBar() {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, isLoading, signOut, userId } = useAuth()
  const [open, setOpen] = useState(false)
  const [renderState, setRenderState] = useState({
    showUserNav: false,
    checkCount: 0
  })

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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md border-b border-purple-900/30">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 my-2">
          <div className="flex items-center gap-4 md:gap-16">
            <Link href="/" className="flex items-center">
              <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-white" />
              </div>
              <span className="ml-3 text-white font-semibold">AI Super App</span>
            </Link>

            {/* Menü sadece giriş yapılınca */}
            {isAuthenticated && navItems.length > 0 && (
              <div className="hidden md:flex items-center space-x-8">
                {navItems.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-white",
                      pathname === item.href ? "text-white" : "text-gray-400",
                    )}
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {renderState.showUserNav || isAuthenticated ? (
              <UserNav key={userId || 'guest'} />
            ) : (
              <></>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
