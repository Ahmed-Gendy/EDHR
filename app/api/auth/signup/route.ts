import { type NextRequest, NextResponse } from "next/server"
import { createUserWithRole } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, password, department, position } = await request.json()

    // Check if required fields are provided
    if (!firstName || !lastName || !email || !password || !department || !position) {
      return NextResponse.json({ success: false, message: "All fields are required" }, { status: 400 })
    }

    // Create user with employee data
    const result = await createUserWithRole(email, password, "ADMIN", {
      firstName,
      lastName,
      email,
      department,
      position,
    })

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
    })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ success: false, message: "An error occurred during signup" }, { status: 500 })
  }
}
