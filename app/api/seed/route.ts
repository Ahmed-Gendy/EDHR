import { type NextRequest, NextResponse } from "next/server"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { ref, set, get, serverTimestamp } from "firebase/database"
import { auth, database } from "@/lib/firebase"

export async function GET(request: NextRequest) {
  try {
    // Check if any users exist in the database
    const usersRef = ref(database, "users")
    let snapshot

    try {
      snapshot = await get(usersRef)
    } catch (error) {
      console.error("Error accessing database:", error)
      return NextResponse.json(
        {
          success: false,
          message: "Could not access the database. Please check your Firebase configuration.",
        },
        { status: 500 },
      )
    }

    if (snapshot.exists()) {
      return NextResponse.json({ success: true, message: "Database already seeded" })
    }

    // Create default admin user
    const email = "admin@edecs.com"
    const password = "Admin@123"

    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Create department
    const departmentId = "administration"
    const departmentRef = ref(database, `departments/${departmentId}`)
    await set(departmentRef, {
      name: "Administration",
      description: "Administration Department",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    // Create position
    const positionId = "hr-manager"
    const positionRef = ref(database, `positions/${positionId}`)
    await set(positionRef, {
      title: "HR Manager",
      departmentId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    // Create employee
    const employeeRef = ref(database, `employees/${user.uid}`)
    await set(employeeRef, {
      firstName: "Admin",
      lastName: "User",
      email,
      hireDate: new Date().toISOString().split("T")[0],
      positionId,
      status: "ACTIVE",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    // Create user
    const userRef = ref(database, `users/${user.uid}`)
    await set(userRef, {
      uid: user.uid,
      email,
      displayName: "Admin User",
      role: "ADMIN",
      department: departmentId,
      position: positionId,
      photoURL: null,
      phoneNumber: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: "active",
    })

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
      credentials: {
        email,
        password,
      },
    })
  } catch (error: any) {
    console.error("Error seeding database:", error)

    // Handle Firebase auth errors specifically
    if (error.code && error.code.startsWith("auth/")) {
      return NextResponse.json(
        {
          success: false,
          message: `Authentication error: ${error.message}`,
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { success: false, message: "An error occurred while seeding the database" },
      { status: 500 },
    )
  }
}
