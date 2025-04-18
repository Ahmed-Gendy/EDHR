import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { ref, get, update, serverTimestamp } from "firebase/database"
import { database } from "@/lib/firebase"

export async function POST(request: NextRequest) {
  try {
    const { uid } = await request.json()

    if (!uid) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 })
    }

    // Get user data from Realtime Database
    const userRef = ref(database, `users/${uid}`)
    const snapshot = await get(userRef)

    if (!snapshot.exists()) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 401 })
    }

    const userData = snapshot.val()

    // Check if user is active
    if (userData.status === "inactive") {
      return NextResponse.json({ success: false, message: "Your account has been deactivated" }, { status: 403 })
    }

    // Update last login time
    await update(userRef, {
      lastLogin: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    // Set session cookie
    const session = {
      id: userData.uid,
      email: userData.email,
      role: userData.role,
      displayName: userData.displayName,
    }

    cookies().set("session", JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    return NextResponse.json({ success: true, user: session })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ success: false, message: "An error occurred during login" }, { status: 500 })
  }
}
