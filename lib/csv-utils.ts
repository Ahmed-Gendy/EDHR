/**
 * Parse CSV string into an array of objects
 * @param csvString The CSV string to parse
 * @returns Array of objects with headers as keys
 */
export function parseCSV(csvString: string): Record<string, any>[] {
  // Split the CSV string into lines
  const lines = csvString.split(/\r?\n/).filter((line) => line.trim() !== "")

  if (lines.length === 0) {
    return []
  }

  // Extract headers from the first line
  const headers = lines[0].split(",").map((header) => header.trim())

  // Parse data rows
  const result: Record<string, any>[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const values = line.split(",").map((value) => value.trim())

    // Skip empty lines
    if (values.length === 0 || (values.length === 1 && values[0] === "")) {
      continue
    }

    // Create object from headers and values
    const obj: Record<string, any> = {}

    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = j < values.length ? values[j] : ""
    }

    result.push(obj)
  }

  return result
}

/**
 * Convert array of objects to CSV string
 * @param objects Array of objects to convert
 * @returns CSV string
 */
export function objectsToCSV(objects: Record<string, any>[]): string {
  if (objects.length === 0) {
    return ""
  }

  // Get all unique headers
  const headers = Array.from(new Set(objects.flatMap((obj) => Object.keys(obj))))

  // Create header row
  let csv = headers.join(",") + "\n"

  // Add data rows
  for (const obj of objects) {
    const row = headers.map((header) => {
      const value = obj[header] !== undefined && obj[header] !== null ? obj[header] : ""
      // Escape commas and quotes
      if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    })

    csv += row.join(",") + "\n"
  }

  return csv
}

/**
 * Create a template CSV with headers
 * @param headers Array of header names
 * @returns CSV string with headers only
 */
export function createTemplateCSV(headers: string[]): string {
  return headers.join(",") + "\n"
}

/**
 * Download a string as a file
 * @param content String content to download
 * @param filename Name of the file
 * @param type MIME type of the file
 */
export function downloadStringAsFile(content: string, filename: string, type = "text/csv"): void {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`
  document.body.appendChild(a)
  a.click()

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 0)
}
