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
  const { isAuthenticated, isLoading, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  // Empty navigation items array - removed My Apps, API Keys, and Settings
  const navItems: { title: string; href: string }[] = []

  if (isLoading) {
    return (
      <nav className="fixed top-0 w-full h-14 px-4 border-b border-purple-900/30 shadow-sm bg-black/50 backdrop-blur-md flex items-center">
        {/* Loading placeholder */}
        <div className="animate-pulse w-full max-w-screen-2xl mx-auto flex items-center justify-between">
          <div className="h-8 w-24 bg-purple-900/30 rounded"></div>
          <div className="h-8 w-8 bg-purple-900/30 rounded-full"></div>
        </div>
      </nav>
    )
  }

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
            {isAuthenticated ? (
              //This div contains user navigation elements and is conditionally rendered based on authentication status.
              // If the user is authenticated, render the UserNav component for user-specific actions.
              <UserNav />
            ) : (
              // If the user is not authenticated, render nothing (empty fragment).
              <></>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
