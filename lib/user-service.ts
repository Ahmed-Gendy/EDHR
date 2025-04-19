import {
  createUserWithEmailAndPassword,
  updateProfile,
  deleteUser as firebaseDeleteUser,
  updateEmail as firebaseUpdateEmail,
  updatePassword as firebaseUpdatePassword,
  type User as FirebaseUser,
  sendPasswordResetEmail,
} from "firebase/auth"
import { ref, set, get, remove, update } from "firebase/database"
import { auth, database } from "./firebase"

export interface User {
  uid: string
  email: string
  displayName?: string
  role: string
  department?: string
  position?: string
  photoURL?: string
  phoneNumber?: string
  createdAt: number
  updatedAt: number
  status: "active" | "inactive" | "pending"
}

export async function createUser(userData: {
  email: string
  password: string
  displayName?: string
  role: string
  department?: string
  position?: string
}) {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password)
    const user = userCredential.user

    // Update profile if displayName is provided
    if (userData.displayName) {
      await updateProfile(user, { displayName: userData.displayName })
    }

    // Create user data in Realtime Database
    const userRef = ref(database, `users/${user.uid}`)
    await set(userRef, {
      uid: user.uid,
      email: userData.email,
      displayName: userData.displayName || null,
      role: userData.role,
      department: userData.department || null,
      position: userData.position || null,
      photoURL: user.photoURL || null,
      phoneNumber: user.phoneNumber || null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: "active",
    })

    return { success: true, uid: user.uid }
  } catch (error: any) {
    console.error("Error creating user:", error)

    // Check for specific Firebase auth errors
    if (error.code === "auth/email-already-in-use") {
      return {
        success: false,
        error: "This email address is already in use. Please use a different email.",
      }
    }

    return {
      success: false,
      error: error.message || "Failed to create user",
    }
  }
}

export async function getUser(uid: string): Promise<User | null> {
  try {
    const userRef = ref(database, `users/${uid}`)
    const snapshot = await get(userRef)

    if (snapshot.exists()) {
      return snapshot.val() as User
    }
    return null
  } catch (error) {
    console.error("Error getting user:", error)
    return null
  }
}

export async function getAllUsers(): Promise<User[]> {
  try {
    const usersRef = ref(database, "users")
    const snapshot = await get(usersRef)

    if (snapshot.exists()) {
      const users: User[] = []
      snapshot.forEach((childSnapshot) => {
        users.push(childSnapshot.val() as User)
      })
      return users
    }
    return []
  } catch (error) {
    console.error("Error getting all users:", error)
    return []
  }
}

export async function updateUser(uid: string, userData: Partial<User>): Promise<boolean> {
  try {
    const userRef = ref(database, `users/${uid}`)
    await update(userRef, {
      ...userData,
      updatedAt: Date.now(),
    })
    return true
  } catch (error) {
    console.error("Error updating user:", error)
    return false
  }
}

export async function updateUserEmail(user: FirebaseUser, newEmail: string): Promise<boolean> {
  try {
    await firebaseUpdateEmail(user, newEmail)
    const userRef = ref(database, `users/${user.uid}`)
    await update(userRef, {
      email: newEmail,
      updatedAt: Date.now(),
    })
    return true
  } catch (error) {
    console.error("Error updating user email:", error)
    return false
  }
}

export async function updateUserPassword(user: FirebaseUser, newPassword: string): Promise<boolean> {
  try {
    await firebaseUpdatePassword(user, newPassword)
    return true
  } catch (error) {
    console.error("Error updating user password:", error)
    return false
  }
}

export async function deleteUser(uid: string): Promise<boolean> {
  try {
    // Get the Firebase Auth user
    const currentUser = auth.currentUser
    if (!currentUser || currentUser.uid !== uid) {
      throw new Error("Cannot delete other users")
    }

    // Delete from Firebase Auth
    await firebaseDeleteUser(currentUser)

    // Delete from Realtime Database
    const userRef = ref(database, `users/${uid}`)
    await remove(userRef)

    return true
  } catch (error) {
    console.error("Error deleting user:", error)
    return false
  }
}

export async function deactivateUser(uid: string): Promise<boolean> {
  try {
    const userRef = ref(database, `users/${uid}`)
    await update(userRef, {
      status: "inactive",
      updatedAt: Date.now(),
    })
    return true
  } catch (error) {
    console.error("Error deactivating user:", error)
    return false
  }
}

export async function activateUser(uid: string): Promise<boolean> {
  try {
    const userRef = ref(database, `users/${uid}`)
    await update(userRef, {
      status: "active",
      updatedAt: Date.now(),
    })
    return true
  } catch (error) {
    console.error("Error activating user:", error)
    return false
  }
}

export async function sendPasswordReset(email: string): Promise<boolean> {
  try {
    await sendPasswordResetEmail(auth, email)
    return true
  } catch (error) {
    console.error("Error sending password reset:", error)
    return false
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    // Instead of using query with orderByChild which requires an index,
    // we'll fetch all users and filter them in memory
    const usersRef = ref(database, "users")
    const snapshot = await get(usersRef)

    if (snapshot.exists()) {
      let matchingUser: User | null = null

      snapshot.forEach((childSnapshot) => {
        const userData = childSnapshot.val() as User
        if (userData.email === email) {
          matchingUser = userData
        }
      })

      return matchingUser
    }
    return null
  } catch (error) {
    console.error("Error getting user by email:", error)
    return null
  }
}

export async function getUsersByRole(role: string): Promise<User[]> {
  try {
    // Similarly, fetch all users and filter by role in memory
    const usersRef = ref(database, "users")
    const snapshot = await get(usersRef)

    if (snapshot.exists()) {
      const users: User[] = []

      snapshot.forEach((childSnapshot) => {
        const userData = childSnapshot.val() as User
        if (userData.role === role) {
          users.push(userData)
        }
      })

      return users
    }
    return []
  } catch (error) {
    console.error("Error getting users by role:", error)
    return []
  }
}
