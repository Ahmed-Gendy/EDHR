import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { createUser, getAllUsers } from "@/lib/user-service"

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()

    // Check if user has admin role
    if (!["ADMIN", "SUPERADMIN"].includes(session.role)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 })
    }

    const users = await getAllUsers()

    return NextResponse.json({ success: true, users })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ success: false, message: "An error occurred while fetching users" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()

    // Check if user has admin role
    if (!["ADMIN", "SUPERADMIN"].includes(session.role)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 })
    }

    const { email, password, displayName, role, department, position } = await request.json()

    // Validate required fields
    if (!email || !password || !role) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    const result = await createUser({
      email,
      password,
      displayName,
      role,
      department,
      position,
    })

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      userId: result.uid,
    })
  } catch (error: any) {
    console.error("Error creating user:", error)

    // Check for specific Firebase auth errors
    if (error.code === "auth/email-already-in-use") {
      return NextResponse.json(
        { success: false, message: "This email address is already in use. Please use a different email." },
        { status: 400 },
      )
    }

    return NextResponse.json({ success: false, message: "An error occurred while creating user" }, { status: 500 })
  }
}
