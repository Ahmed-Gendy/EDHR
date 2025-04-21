"use client"

import { auth, database } from "./firebase"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type UserCredential,
} from "firebase/auth"
import { ref, get, set, update, serverTimestamp } from "firebase/database"
import { redirect } from "next/navigation"

// Client-side authentication functions
export async function login(email: string, password: string) {
  try {
    const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Get user data from Realtime Database
    const userRef = ref(database, `users/${user.uid}`)
    const snapshot = await get(userRef)

    if (!snapshot.exists()) {
      await firebaseSignOut(auth)
      return { success: false, message: "User data not found" }
    }

    const userData = snapshot.val()

    // Check if user is active
    if (userData.status === "inactive") {
      await firebaseSignOut(auth)
      return { success: false, message: "Your account has been deactivated. Please contact an administrator." }
    }

    // Update last login time
    await update(userRef, {
      lastLogin: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    // Set session data in localStorage
    const session = {
      id: user.uid,
      email: user.email,
      role: userData.role,
      displayName: userData.displayName,
    }

    localStorage.setItem("session", JSON.stringify(session))

    return { success: true, user: session }
  } catch (error: any) {
    console.error("Login error:", error)
    return {
      success: false,
      message:
        error.code === "auth/invalid-credential" ||
        error.code === "auth/invalid-email" ||
        error.code === "auth/wrong-password"
          ? "Invalid email or password"
          : "An error occurred during login",
    }
  }
}

// Update the logout function to properly call the API endpoint
export async function logout() {
  try {
    // Call the logout API endpoint
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })

    // Check if the request was successful
    if (!response.ok) {
      throw new Error("Logout request failed")
    }

    // Clear local storage
    localStorage.removeItem("session")

    return { success: true }
  } catch (error) {
    console.error("Logout error:", error)
    return { success: false, message: "An error occurred during logout" }
  }
}

export async function createUserWithRole(email: string, password: string, role: string, employeeData: any) {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Create employee data in Realtime Database
    const employeeRef = ref(database, `employees/${user.uid}`)
    await set(employeeRef, {
      ...employeeData,
      status: "ACTIVE",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    // Create user data in Realtime Database
    const userRef = ref(database, `users/${user.uid}`)
    await set(userRef, {
      uid: user.uid,
      email,
      displayName: `${employeeData.firstName} ${employeeData.lastName}`,
      role,
      department: employeeData.department || null,
      position: employeeData.position || null,
      photoURL: null,
      phoneNumber: employeeData.phoneNumber || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: "active",
    })

    return { success: true, userId: user.uid }
  } catch (error: any) {
    console.error("Create user error:", error)
    return {
      success: false,
      message:
        error.code === "auth/email-already-in-use" ? "Email already in use" : "An error occurred during user creation",
    }
  }
}

// Client-side authentication helpers
export function getSession() {
  if (typeof window === "undefined") return null

  try {
    const session = localStorage.getItem("session")
    return session ? JSON.parse(session) : null
  } catch (error) {
    console.error("Error getting session:", error)
    return null
  }
}

export async function requireAuth() {
  const session = getSession()

  if (!session) {
    redirect("/login")
  }

  return session
}

export async function requireRole(roles: string[]) {
  const session = getSession()

  if (!session) {
    redirect("/login")
  }

  if (!roles.includes(session.role)) {
    redirect("/unauthorized")
  }

  return session
}
