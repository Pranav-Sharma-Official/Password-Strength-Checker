"use client"

import type React from "react"

import { useState } from "react"
import { Shield, Lock, AlertTriangle, Eye, EyeOff, Zap, Clock, Database } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"

// Common weak passwords
const COMMON_PASSWORDS = new Set(["password", "123456", "qwerty", "letmein", "admin", "welcome"])

export default function PasswordStrengthChecker() {
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{
    strength: string
    strengthClass: string
    entropy: number
    crackTime: string
    breachCount: number
    error?: string
  } | null>(null)

  // Function to check password randomness
  function calculateEntropy(password: string) {
    let charsetSize = 0

    if (/[a-z]/.test(password)) charsetSize += 26 // a-z
    if (/[A-Z]/.test(password)) charsetSize += 26 // A-Z
    if (/[0-9]/.test(password)) charsetSize += 10 // 0-9
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) charsetSize += 32 // Special characters

    const entropy = password.length * (Math.log(charsetSize) / Math.log(2))
    return charsetSize > 0 ? entropy : 0
  }

  // Function to estimate brute-force cracking time
  function estimateCrackTime(password: string) {
    const guessesPerSecond = 10 ** 9 // Assumption: 1 billion guesses/sec
    const entropy = calculateEntropy(password)
    const possibleCombinations = 2 ** entropy
    const crackTimeSeconds = possibleCombinations / guessesPerSecond
    return crackTimeSeconds
  }

  // Function to check common patterns
  function checkCommonPatterns(password: string) {
    const substitutions: Record<string, string> = {
      "0": "o",
      "1": "i",
      "3": "e",
      "4": "a",
      "5": "s",
      "7": "t",
    }

    let modifiedPassword = password.toLowerCase()
    for (const [value, key] of Object.entries(substitutions)) {
      modifiedPassword = modifiedPassword.replace(new RegExp(value, "g"), key)
    }

    return COMMON_PASSWORDS.has(modifiedPassword)
  }

  // Function to check if password is leaked (using Pwned Passwords API)
  async function checkBreach(password: string) {
    try {
      // Create SHA-1 hash of the password
      const encoder = new TextEncoder()
      const data = encoder.encode(password)
      const hashBuffer = await crypto.subtle.digest("SHA-1", data)

      // Convert the hash to a hex string
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase()

      const prefix = hashHex.substring(0, 5)
      const suffix = hashHex.substring(5)

      // Check the Pwned Passwords API
      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`)

      if (response.ok) {
        const text = await response.text()
        const lines = text.split("\n")

        for (const line of lines) {
          const [hash, count] = line.split(":")
          if (hash === suffix) {
            return Number.parseInt(count)
          }
        }
      }
      return 0
    } catch (error) {
      console.error("Error checking breach:", error)
      return 0
    }
  }

  // Function to format crack time in a human-readable way
  function formatCrackTime(seconds: number) {
    if (seconds < 60) return `${seconds.toFixed(2)} seconds`
    if (seconds < 3600) return `${(seconds / 60).toFixed(2)} minutes`
    if (seconds < 86400) return `${(seconds / 3600).toFixed(2)} hours`
    if (seconds < 31536000) return `${(seconds / 86400).toFixed(2)} days`
    return `${(seconds / 31536000).toFixed(2)} years`
  }

  // Main function to evaluate password strength
  async function evaluatePassword(password: string) {
    try {
      const entropy = calculateEntropy(password)
      const crackTime = estimateCrackTime(password)
      const breachCount = await checkBreach(password)

      let strength = "Very Weak"
      let strengthClass = "text-red-500"

      if (entropy > 40) {
        strength = "Strong"
        strengthClass = "text-green-500"
      } else if (entropy > 30) {
        strength = "Moderate"
        strengthClass = "text-yellow-500"
      } else if (entropy > 20) {
        strength = "Weak"
        strengthClass = "text-orange-500"
      }

      if (COMMON_PASSWORDS.has(password) || checkCommonPatterns(password)) {
        strength = "Very Weak"
        strengthClass = "text-red-500"
      }

      setResults({
        strength,
        strengthClass,
        entropy,
        crackTime: formatCrackTime(crackTime),
        breachCount,
      })

      return true
    } catch (error) {
      console.error("Error evaluating password:", error)
      setResults({
        strength: "",
        strengthClass: "",
        entropy: 0,
        crackTime: "",
        breachCount: 0,
        error: "An error occurred while evaluating the password.",
      })
      return false
    }
  }

  // Form submission handler
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!password) return

    setLoading(true)
    await evaluatePassword(password)
    setLoading(false)
  }

  // Calculate strength percentage for progress bar
  const getStrengthPercentage = () => {
    if (!results) return 0
    const entropy = results.entropy
    if (entropy > 80) return 100
    return Math.min(Math.round((entropy / 80) * 100), 100)
  }

  // Get progress bar color based on strength
  const getProgressColor = () => {
    if (!results) return "bg-gray-500"
    switch (results.strength) {
      case "Strong":
        return "bg-green-500"
      case "Moderate":
        return "bg-yellow-500"
      case "Weak":
        return "bg-orange-500"
      default:
        return "bg-red-500"
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-black text-white">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Shield className="h-16 w-16 text-cyan-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-cyan-400">Password Strength Analyzer</h1>
          <p className="text-gray-400">Evaluate your password security with advanced cryptographic analysis</p>
        </div>

        <Card className="border-cyan-800 bg-gray-900 shadow-lg shadow-cyan-900/20">
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Lock className="mr-2 h-4 w-4 text-cyan-400" />
                  <label htmlFor="password" className="text-sm font-medium text-gray-300">
                    Enter your password
                  </label>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white pr-10 focus:ring-cyan-500 focus:border-cyan-500"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !password}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                {loading ? (
                  <>
                    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></span>
                    Analyzing...
                  </>
                ) : (
                  "Analyze Password"
                )}
              </Button>
            </form>

            {results && !results.error && (
              <div className="mt-8 space-y-6 border-t border-gray-800 pt-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-400">Password Strength</span>
                    <span className={`text-sm font-medium ${results.strengthClass}`}>{results.strength}</span>
                  </div>
                  <Progress
                    value={getStrengthPercentage()}
                    className="h-2 bg-gray-700"
                    indicatorClassName={getProgressColor()}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-gray-800 p-3 rounded-md flex items-start">
                    <Zap className="h-5 w-5 text-cyan-400 mr-3 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-300">Entropy</h3>
                      <p className="text-sm text-gray-400">{results.entropy.toFixed(2)} bits</p>
                      <p className="text-xs text-gray-500 mt-1">Measures password randomness and unpredictability</p>
                    </div>
                  </div>

                  <div className="bg-gray-800 p-3 rounded-md flex items-start">
                    <Clock className="h-5 w-5 text-cyan-400 mr-3 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-300">Estimated Crack Time</h3>
                      <p className="text-sm text-gray-400">{results.crackTime}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Time needed for a brute force attack at 1B guesses/sec
                      </p>
                    </div>
                  </div>

                  {results.breachCount > 0 && (
                    <div className="bg-red-900/30 border border-red-800 p-3 rounded-md flex items-start">
                      <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-medium text-red-400">Data Breach Alert</h3>
                        <p className="text-sm text-gray-300">
                          This password has been found in {results.breachCount.toLocaleString()} data breaches!
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          This password is compromised and should not be used
                        </p>
                      </div>
                    </div>
                  )}

                  {results.breachCount === 0 && (
                    <div className="bg-green-900/30 border border-green-800 p-3 rounded-md flex items-start">
                      <Database className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-medium text-green-400">Breach Check</h3>
                        <p className="text-sm text-gray-300">No breaches found for this password</p>
                        <p className="text-xs text-gray-400 mt-1">
                          This password hasn't been found in known data breaches
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {results?.error && (
              <div className="mt-6 bg-red-900/30 border border-red-800 p-4 rounded-md">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                  <p className="text-sm text-red-400">{results.error}</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>All analysis is performed locally in your browser. Your password is never sent to our servers.</p>
        </div>
      </div>
    </main>
  )
}

