import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// This is an API route, so we need to export HTTP method handlers
export async function POST() {
  // Clear the session cookie
  cookies().delete("session")

  return NextResponse.json({ success: true })
}

// Add a GET handler to handle direct navigation to this route
export async function GET() {
  // Clear the session cookie
  cookies().delete("session")

  // Return a response that redirects to the login page
  return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"))
}
