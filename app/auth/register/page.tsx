"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/icons"
import { Checkbox } from "@/components/ui/checkbox"
import Cookies from "js-cookie"
import { setAuthTokens } from "@/lib/auth"

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault()
    setError(null)

    // Form validation
    if (!name || !email || !password) {
      setError("All fields are required")
      return
    }

    if (!agreedTerms) {
      setError("You must agree to the terms and conditions")
      return
    }

    setIsLoading(true)

    try {
      // Call the registration endpoint
      const response = await fetch("http://127.0.0.1:8000/api/v1/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: name,
          email: email,
          password: password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || "Registration failed")
      }

      // Registration successful
      console.log("Registration successful:", data)

      // Store user data
      Cookies.set("user_id", data.user.id.toString(), { secure: true, sameSite: "Strict" })
      Cookies.set("user_email", email, { secure: true, sameSite: "Strict" })
      setAuthTokens(data.access_token, data.token_type)

      // Redirect to login page
      router.push("/apps")
    } catch (error: any) {
      console.error("Registration error:", error)
      setError(error.message || "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md bg-black/60 backdrop-blur-xl border border-purple-700/40 shadow-2xl relative">
        {/* Card Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 rounded-lg blur-xl -z-10" />
        
        <CardHeader className="space-y-6 text-center pb-8">
          <div className="flex items-center justify-center mb-6">
           <div className="relative">
                <div className="w-20 h-20 rounded-2xl  flex items-center justify-center shadow-sm p-2 cursor-pointer" onClick={() => router.push("/")}>
                <img src="../logo.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl blur-md opacity-50 -z-10" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              Create Account
            </CardTitle>
            <CardDescription className="text-gray-400 text-base">
              Enter your information to get started
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 px-8 pb-8">
          {error && (
            <div className="p-4 bg-red-900/30 border border-red-700/50 rounded-lg text-red-200 text-sm backdrop-blur-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-red-500 flex-shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white font-medium">
                  Full Name
                </Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  className="h-12 bg-black/40 border-purple-700/40 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="h-12 bg-black/40 border-purple-700/40 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-12 bg-black/40 border-purple-700/40 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  required
                />
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms"
                className="mt-1 border-purple-700/40 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                checked={agreedTerms}
                onCheckedChange={(checked) => setAgreedTerms(checked === true)}
              />
              <label
                htmlFor="terms"
                className="text-sm text-gray-300 leading-relaxed cursor-pointer"
              >
                I agree to the{" "}
                <Link href="/terms" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <Button 
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-purple-500/30 transition-all duration-300 transform hover:scale-[1.02]" 
              disabled={isLoading || !agreedTerms} 
              type="submit"
            >
              {isLoading && <Icons.spinner className="mr-2 h-5 w-5 animate-spin" />}
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="text-center pb-8 px-8">
          <div className="text-gray-400">
            Already have an account?{" "}
            <Link 
              href="/auth/login" 
              className="text-purple-400 hover:text-purple-300 font-semibold transition-colors hover:underline"
            >
              Sign in here
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

