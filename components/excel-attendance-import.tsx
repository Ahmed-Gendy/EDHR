"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, FileText, Upload, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { parseExcelFile } from "@/lib/import-export-utils"

interface AttendanceRecord {
  employeeId: string
  date: string
  checkIn: string
  checkOut: string | null
  status: string
}

export function ExcelAttendanceImport() {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [previewData, setPreviewData] = useState<AttendanceRecord[]>([])
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const selectedFile = e.target.files?.[0]

    if (!selectedFile) {
      return
    }

    if (!selectedFile.name.endsWith(".csv")) {
      setError("Please upload a CSV file (.csv)")
      return
    }

    setFile(selectedFile)

    try {
      const data = await parseExcelFile<AttendanceRecord>(selectedFile)

      // Validate required fields
      if (data.length > 0) {
        const firstRecord = data[0]
        if (!firstRecord.employeeId || !firstRecord.date) {
          throw new Error("CSV file must contain 'employeeId' and 'date' columns")
        }
      }

      setPreviewData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read CSV file")
      setFile(null)
    }
  }

  const handleUpload = async () => {
    if (!file || previewData.length === 0) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/attendance/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ records: previewData }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Failed to import attendance data")
      }

      const result = await response.json()

      toast({
        title: "Import successful",
        description: `Successfully imported ${result.imported} attendance records.`,
      })

      // Reset form
      setFile(null)
      setPreviewData([])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import attendance data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadTemplate = () => {
    const headers = ["employeeId", "date", "checkIn", "checkOut", "status"]
    const csvContent =
      headers.join(",") + "\n" + "EMP001,2023-05-01,09:00,17:00,PRESENT\n" + "EMP002,2023-05-01,08:30,16:30,PRESENT"

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "attendance_template.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Attendance from CSV</CardTitle>
        <CardDescription>
          Upload a CSV file with attendance records. The file must contain columns for employeeId, date, checkIn,
          checkOut, and status.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-4">
          <Input type="file" accept=".csv" onChange={handleFileChange} className="flex-1" />
          <Button variant="outline" onClick={handleDownloadTemplate}>
            <FileText className="mr-2 h-4 w-4" />
            Download Template
          </Button>
        </div>

        {file && (
          <div className="p-4 border rounded-md bg-muted/40">
            <p className="font-medium">Selected file: {file.name}</p>
            <p className="text-sm text-muted-foreground">Size: {(file.size / 1024).toFixed(2)} KB</p>
          </div>
        )}

        {previewData.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium">Preview (first 5 records):</h3>
            <div className="max-h-60 overflow-auto border rounded-md">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Employee ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Check In</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Check Out</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {previewData.slice(0, 5).map((record, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm">{record.employeeId}</td>
                      <td className="px-4 py-2 text-sm">{record.date}</td>
                      <td className="px-4 py-2 text-sm">{record.checkIn || "-"}</td>
                      <td className="px-4 py-2 text-sm">{record.checkOut || "-"}</td>
                      <td className="px-4 py-2 text-sm">{record.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-muted-foreground">
              {previewData.length > 5 ? `...and ${previewData.length - 5} more records` : ""}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            setFile(null)
            setPreviewData([])
            setError(null)
          }}
        >
          <X className="mr-2 h-4 w-4" />
          Clear
        </Button>
        <Button onClick={handleUpload} disabled={!file || previewData.length === 0 || isLoading}>
          {isLoading ? (
            "Importing..."
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Import Data
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
