"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardFallback } from "@/components/dashboard-fallback"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Dashboard error:", error)

    // If the error is a redirect, navigate to the login page
    if (error.message === "NEXT_REDIRECT" || error.message.includes("Redirect")) {
      router.push("/login")
    }
  }, [error, router])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Dashboard Charts</h2>
        <button onClick={reset} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
          Try again
        </button>
      </div>
      <DashboardFallback />
    </div>
  )
}
