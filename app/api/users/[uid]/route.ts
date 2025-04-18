import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getUser, updateUser, deleteUser } from "@/lib/user-service"

export async function GET(request: NextRequest, { params }: { params: { uid: string } }) {
  try {
    const session = await requireAuth()

    // Users can view their own profile, admins can view any profile
    if (session.id !== params.uid && !["ADMIN", "SUPERADMIN"].includes(session.role)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 })
    }

    const user = await getUser(params.uid)

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ success: false, message: "An error occurred while fetching user" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { uid: string } }) {
  try {
    const session = await requireAuth()

    // Users can update their own profile, admins can update any profile
    if (session.id !== params.uid && !["ADMIN", "SUPERADMIN"].includes(session.role)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 })
    }

    const userData = await request.json()

    // Regular users can't change their role
    if (
      session.id === params.uid &&
      userData.role &&
      userData.role !== session.role &&
      !["ADMIN", "SUPERADMIN"].includes(session.role)
    ) {
      return NextResponse.json({ success: false, message: "Cannot change your own role" }, { status: 403 })
    }

    const success = await updateUser(params.uid, userData)

    if (!success) {
      return NextResponse.json({ success: false, message: "Failed to update user" }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: "User updated successfully" })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ success: false, message: "An error occurred while updating user" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { uid: string } }) {
  try {
    const session = await requireAuth()

    // Only admins can delete users, and they can't delete themselves
    if (!["ADMIN", "SUPERADMIN"].includes(session.role) || session.id === params.uid) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 })
    }

    const success = await deleteUser(params.uid)

    if (!success) {
      return NextResponse.json({ success: false, message: "Failed to delete user" }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ success: false, message: "An error occurred while deleting user" }, { status: 500 })
  }
}
