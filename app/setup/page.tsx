"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function SetupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ message: string; credentials?: { email: string; password: string } } | null>(
    null,
  )

  async function seedDatabase() {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/seed")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to seed database")
      }

      setSuccess({
        message: data.message,
        credentials: data.credentials,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/40">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">EDECS HR System Setup</h1>
          <p className="text-gray-500">Initialize your HR system with default data</p>
        </div>

        <div className="space-y-4 mb-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-md">
              <p className="font-medium">Success!</p>
              <p>{success.message}</p>
              {success.credentials && (
                <div className="mt-2 p-2 bg-green-100 rounded">
                  <p className="font-medium">Admin Credentials:</p>
                  <p>Email: {success.credentials.email}</p>
                  <p>Password: {success.credentials.password}</p>
                </div>
              )}
            </div>
          )}

          <p>
            This page will initialize your HR system with default data, including an admin user, departments, and
            positions.
          </p>
          <p>Use this only if you're setting up the system for the first time.</p>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/login">Back to Login</Link>
          </Button>
          <Button onClick={seedDatabase} disabled={isLoading || !!success}>
            {isLoading ? "Setting up..." : "Initialize System"}
          </Button>
        </div>
      </div>
    </div>
  )
}
