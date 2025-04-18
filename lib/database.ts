import { ref, set, get, push, update, remove, query, orderByChild, equalTo, onValue } from "firebase/database"
import { database } from "./firebase"

// Generic function to create a new record
export async function createRecord(path: string, data: any) {
  try {
    const newRef = push(ref(database, path))
    await set(newRef, {
      ...data,
      id: newRef.key,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    return { success: true, id: newRef.key }
  } catch (error) {
    console.error(`Error creating record at ${path}:`, error)
    return { success: false, error }
  }
}

// Generic function to update a record
export async function updateRecord(path: string, id: string, data: any) {
  try {
    const recordRef = ref(database, `${path}/${id}`)
    await update(recordRef, {
      ...data,
      updatedAt: Date.now(),
    })
    return { success: true }
  } catch (error) {
    console.error(`Error updating record at ${path}/${id}:`, error)
    return { success: false, error }
  }
}

// Generic function to get a record by ID
export async function getRecord(path: string, id: string) {
  try {
    const recordRef = ref(database, `${path}/${id}`)
    const snapshot = await get(recordRef)
    if (snapshot.exists()) {
      return { success: true, data: snapshot.val() }
    }
    return { success: false, error: "Record not found" }
  } catch (error) {
    console.error(`Error getting record at ${path}/${id}:`, error)
    return { success: false, error }
  }
}

// Generic function to get all records
export async function getAllRecords(path: string) {
  try {
    const recordsRef = ref(database, path)
    const snapshot = await get(recordsRef)
    if (snapshot.exists()) {
      const records: any[] = []
      snapshot.forEach((childSnapshot) => {
        records.push(childSnapshot.val())
      })
      return { success: true, data: records }
    }
    return { success: true, data: [] }
  } catch (error) {
    console.error(`Error getting all records at ${path}:`, error)
    return { success: false, error }
  }
}

// Generic function to delete a record
export async function deleteRecord(path: string, id: string) {
  try {
    const recordRef = ref(database, `${path}/${id}`)
    await remove(recordRef)
    return { success: true }
  } catch (error) {
    console.error(`Error deleting record at ${path}/${id}:`, error)
    return { success: false, error }
  }
}

// Generic function to query records by a field
export async function queryRecordsByField(path: string, field: string, value: any) {
  try {
    const recordsRef = ref(database, path)
    const recordQuery = query(recordsRef, orderByChild(field), equalTo(value))
    const snapshot = await get(recordQuery)

    if (snapshot.exists()) {
      const records: any[] = []
      snapshot.forEach((childSnapshot) => {
        records.push(childSnapshot.val())
      })
      return { success: true, data: records }
    }
    return { success: true, data: [] }
  } catch (error) {
    console.error(`Error querying records at ${path} by ${field}:`, error)
    return { success: false, error }
  }
}

// Function to listen for real-time updates
export function subscribeToRecords(path: string, callback: (data: any[]) => void) {
  const recordsRef = ref(database, path)
  const unsubscribe = onValue(recordsRef, (snapshot) => {
    const records: any[] = []
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        records.push(childSnapshot.val())
      })
    }
    callback(records)
  })

  return unsubscribe
}
