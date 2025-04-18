import { type NextRequest, NextResponse } from "next/server"
import { ref, get } from "firebase/database"
import { database } from "@/lib/firebase"

export async function GET(request: NextRequest) {
  try {
    // Try to access the database root to check connectivity
    const rootRef = ref(database)
    await get(rootRef)

    return NextResponse.json({
      status: "ok",
      message: "Database connection successful",
    })
  } catch (error) {
    console.error("Database health check failed:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Database connection failed",
      },
      { status: 500 },
    )
  }
}
