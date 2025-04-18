import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getAuth, signInWithEmailAndPassword, updatePassword } from "firebase/auth"
import { getUser } from "@/lib/user-service"

export async function POST(request: NextRequest, { params }: { params: { uid: string } }) {
  try {
    const session = await requireAuth()

    // Users can only change their own password
    if (session.id !== params.uid) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 })
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Current password and new password are required" },
        { status: 400 },
      )
    }

    // Get user data
    const user = await getUser(params.uid)

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Verify current password by attempting to sign in
    const auth = getAuth()
    try {
      await signInWithEmailAndPassword(auth, user.email, currentPassword)
    } catch (error) {
      return NextResponse.json({ success: false, message: "Current password is incorrect" }, { status: 400 })
    }

    // Update password
    if (auth.currentUser) {
      await updatePassword(auth.currentUser, newPassword)
    } else {
      return NextResponse.json({ success: false, message: "User not authenticated" }, { status: 401 })
    }

    return NextResponse.json({ success: true, message: "Password updated successfully" })
  } catch (error) {
    console.error("Error changing password:", error)
    return NextResponse.json({ success: false, message: "An error occurred while changing password" }, { status: 500 })
  }
}
