"use client"

import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getDatabase } from "firebase/database"
import { getStorage } from "firebase/storage"
import { getFirestore } from "firebase/firestore"

// Hardcoded Firebase configuration
// This is a direct configuration to ensure it works without relying on environment variables
const firebaseConfig = {
  apiKey: "AIzaSyCkBPvfGG8e0-RVqBLpLfPWgbzwFMDLWM8",
  authDomain: "edeg-pusnessapp.firebaseapp.com",
  databaseURL: "https://edeg-pusnessapp-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "edeg-pusnessapp",
  storageBucket: "edeg-pusnessapp.appspot.com",
  messagingSenderId: "779022070336",
  appId: "1:779022070336:web:909ccd25e1f0678f2e25a5",
}

// Initialize Firebase
let app
let auth
let database
let storage
let firestore

try {
  // Initialize Firebase
  app = initializeApp(firebaseConfig)

  // Initialize Firebase services
  auth = getAuth(app)
  database = getDatabase(app)
  storage = getStorage(app)
  firestore = getFirestore(app)

  console.log("Firebase initialized successfully")
} catch (error) {
  console.error("Error initializing Firebase:", error)
}

export { app, auth, database, storage, firestore }
