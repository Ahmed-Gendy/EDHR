import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { sendPasswordReset, getUser } from "@/lib/user-service"

export async function POST(request: NextRequest, { params }: { params: { uid: string } }) {
  try {
    // Only admins can reset passwords for other users
    await requireRole(["ADMIN", "SUPERADMIN"])

    const user = await getUser(params.uid)

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    const success = await sendPasswordReset(user.email)

    if (!success) {
      return NextResponse.json({ success: false, message: "Failed to send password reset email" }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: "Password reset email sent successfully" })
  } catch (error) {
    console.error("Error sending password reset:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred while sending password reset" },
      { status: 500 },
    )
  }
}
