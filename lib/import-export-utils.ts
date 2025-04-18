import { parseCSV, objectsToCSV, createTemplateCSV, downloadStringAsFile } from "./csv-utils"

/**
 * Parse an Excel file (now CSV) and return the data as an array of objects
 */
export async function parseExcelFile<T>(file: File): Promise<T[]> {
  try {
    const text = await file.text()
    return parseCSV(text) as T[]
  } catch (error) {
    console.error("Error parsing file:", error)
    throw new Error("Failed to parse file. Please make sure it's a valid CSV file.")
  }
}

/**
 * Download a template file for data import
 */
export function downloadTemplate(headers: string[], fileName: string): void {
  const templateContent = createTemplateCSV(headers)
  downloadStringAsFile(templateContent, fileName)
}

/**
 * Export data to Excel (now CSV)
 */
export function exportToExcel(data: Record<string, any>[], fileName: string): void {
  const csvContent = objectsToCSV(data)
  downloadStringAsFile(csvContent, fileName)
}

/**
 * Validate imported data
 */
export function validateData(
  data: any[],
  requiredFields: string[],
): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Check if data is empty
  if (!data || data.length === 0) {
    errors.push("No data found in the imported file")
    return { valid: false, errors }
  }

  // Check for required fields
  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    for (let j = 0; j < requiredFields.length; j++) {
      const field = requiredFields[j]
      if (row[field] === undefined || row[field] === null || row[field] === "") {
        errors.push(`Row ${i + 1}: Missing required field "${field}"`)
      }
    }
  }

  return { valid: errors.length === 0, errors }
}
