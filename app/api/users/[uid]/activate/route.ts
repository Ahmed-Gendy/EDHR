import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { activateUser } from "@/lib/user-service"

export async function POST(request: NextRequest, { params }: { params: { uid: string } }) {
  try {
    // Only admins can activate users
    await requireRole(["ADMIN", "SUPERADMIN"])

    const success = await activateUser(params.uid)

    if (!success) {
      return NextResponse.json({ success: false, message: "Failed to activate user" }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: "User activated successfully" })
  } catch (error) {
    console.error("Error activating user:", error)
    return NextResponse.json({ success: false, message: "An error occurred while activating user" }, { status: 500 })
  }
}
