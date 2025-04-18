import { neon } from "@neondatabase/serverless"

// Create a SQL client with the connection string
export const sql = neon(process.env.DATABASE_URL!)

// Helper function to execute SQL queries
export async function query(sql: string, params: any[] = []) {
  try {
    return await sql(sql, params)
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}
