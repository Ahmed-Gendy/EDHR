import { type NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { deactivateUser } from "@/lib/user-service"

export async function POST(request: NextRequest, { params }: { params: { uid: string } }) {
  try {
    const session = await requireRole(["ADMIN", "SUPERADMIN"])

    // Prevent deactivating yourself
    if (session.id === params.uid) {
      return NextResponse.json({ success: false, message: "Cannot deactivate your own account" }, { status: 400 })
    }

    const success = await deactivateUser(params.uid)

    if (!success) {
      return NextResponse.json({ success: false, message: "Failed to deactivate user" }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: "User deactivated successfully" })
  } catch (error) {
    console.error("Error deactivating user:", error)
    return NextResponse.json({ success: false, message: "An error occurred while deactivating user" }, { status: 500 })
  }
}
