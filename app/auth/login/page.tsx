"use client"
import Cookies from "js-cookie"
import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/icons"
import { useRouter, useSearchParams } from "next/navigation"
import { setAuthTokens } from "@/lib/auth"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  async function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault()
    console.log("🚀 Login attempt started...")
    setError(null)

    if (!email || !password) {
      setError("Email and password are required")
      console.log("❌ Validation failed: Missing email or password")
      return
    }

    setIsLoading(true)
    console.log("📨 Sending login request...")
    try {
      const formData = new URLSearchParams()
      formData.append("username", email)
      formData.append("password", password)

      const response = await fetch("http://127.0.0.1:8000/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: formData.toString(),
        credentials: "include",
      })

      const data = await response.json()
      console.log("📥 Server response:", {
        status: response.status,
        ok: response.ok,
        data: data,
      })

      if (!response.ok) {
        throw new Error(data.detail || "Login failed")
      }

      console.log("✅ Login successful, setting tokens...")

      // Set tokens & store user session data
      setAuthTokens(data.access_token, data.refresh_token)
      Cookies.set("user_email", email, { secure: true, sameSite: "Strict" })
      Cookies.set("user_id", data.user.id, { secure: true, sameSite: "Strict" })

      // Log user ID for debugging
      console.log("✅ User authenticated successfully")
      console.log("👤 User ID:", data.user.id)
      console.log("📧 User Email:", email)

      // Force a small delay to ensure tokens are set before navigation
      setTimeout(() => {
        // Get return URL from query params or default to /apps
        const returnUrl = searchParams.get("from") || "/apps"
        console.log("🔄 Navigating to:", returnUrl)

        // Refresh the page to make sure middleware picks up the new auth state
        window.location.href = returnUrl

        // Alternative approach: use router.push but force a page refresh
        // router.push(returnUrl)
      }, 100)
    } catch (error: any) {
      console.error("Login failed:", error)
      setError(error.message || "Authentication failed")
    } finally {
      setIsLoading(false)
      console.log("🏁 Login process completed")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-black/40 backdrop-blur-sm border-purple-900/30">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
          <CardDescription className="text-center">
            Enter your email and password to sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 gap-6">
            <Button variant="outline" className="bg-black/30 border-purple-900/30">
              <Icons.gitHub className="mr-2 h-4 w-4" />
              Github
            </Button>
            <Button variant="outline" className="bg-black/30 border-purple-900/30">
              <Icons.google className="mr-2 h-4 w-4" />
              Google
            </Button>
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-purple-900/30" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background text-muted-foreground px-2">Or continue with</span>
            </div>
          </div>
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-md text-red-200 text-sm">{error}</div>
          )}
          <form onSubmit={onSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="bg-black/30 border-purple-900/30"
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/auth/reset-password" className="text-sm text-purple-400 hover:text-purple-300">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="bg-black/30 border-purple-900/30"
                  required
                />
              </div>
              <Button className="bg-purple-600 hover:bg-purple-700" disabled={isLoading} type="submit">
                {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="text-sm text-muted-foreground text-center">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="text-purple-400 hover:text-purple-300 font-medium">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

