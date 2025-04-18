"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, CheckCircle, Download, Loader2, Upload } from "lucide-react"
import { parseExcelFile } from "@/lib/import-export-utils"

export function DailyWorkerImport() {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [importResult, setImportResult] = useState<{
    success?: boolean
    imported?: number
    errors?: number
    errorDetails?: string[]
  } | null>(null)

  // Handle file selection
  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith(".csv")) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file (.csv)",
        variant: "destructive",
      })
      return
    }

    setFile(selectedFile)

    try {
      // Parse the CSV file
      const data = await parseExcelFile(selectedFile)

      // Map CSV columns to our expected format
      const mappedData = data.map((record: any) => ({
        firstName: record["First Name"] || record["firstName"] || record["first_name"] || "",
        lastName: record["Last Name"] || record["lastName"] || record["last_name"] || "",
        phone: record["Phone"] || record["phone"] || "",
        specialization: record["Specialization"] || record["specialization"] || "",
        dailyRate: record["Daily Rate"] || record["dailyRate"] || record["daily_rate"] || 0,
        status: record["Status"] || record["status"] || "ACTIVE",
        hireDate:
          record["Hire Date"] || record["hireDate"] || record["hire_date"] || new Date().toISOString().split("T")[0],
        bankName: record["Bank Name"] || record["bankName"] || record["bank_name"] || "",
        accountNumber: record["Account Number"] || record["accountNumber"] || record["account_number"] || "",
        notes: record["Notes"] || record["notes"] || "",
      }))

      setPreviewData(mappedData.slice(0, 5)) // Preview first 5 rows
    } catch (error) {
      console.error("Error parsing CSV file:", error)
      toast({
        title: "Error",
        description: "Failed to parse the CSV file. Please check the format.",
        variant: "destructive",
      })
    }
  }

  // Handle import
  async function handleImport() {
    if (!file) return

    setIsLoading(true)
    setImportResult(null)

    try {
      // Parse the CSV file
      const data = await parseExcelFile(file)

      // Map CSV columns to our expected format
      const mappedData = data.map((record: any) => ({
        firstName: record["First Name"] || record["firstName"] || record["first_name"] || "",
        lastName: record["Last Name"] || record["lastName"] || record["last_name"] || "",
        phone: record["Phone"] || record["phone"] || "",
        specialization: record["Specialization"] || record["specialization"] || "",
        dailyRate: record["Daily Rate"] || record["dailyRate"] || record["daily_rate"] || 0,
        status: record["Status"] || record["status"] || "ACTIVE",
        hireDate:
          record["Hire Date"] || record["hireDate"] || record["hire_date"] || new Date().toISOString().split("T")[0],
        bankName: record["Bank Name"] || record["bankName"] || record["bank_name"] || "",
        accountNumber: record["Account Number"] || record["accountNumber"] || record["account_number"] || "",
        notes: record["Notes"] || record["notes"] || "",
      }))

      // Send to API
      const response = await fetch("/api/import/daily-workers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: mappedData }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Import failed")
      }

      setImportResult(result)

      toast({
        title: "Import Successful",
        description: `Successfully imported ${result.imported} workers with ${result.errors} errors.`,
      })
    } catch (error) {
      console.error("Error importing data:", error)
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "An error occurred during import",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle template download
  function handleDownloadTemplate() {
    try {
      const headers = [
        "First Name",
        "Last Name",
        "Phone",
        "Specialization",
        "Daily Rate",
        "Status",
        "Hire Date",
        "Bank Name",
        "Account Number",
        "Notes",
      ]

      // Create CSV content with example data
      const csvContent =
        headers.join(",") +
        "\n" +
        "John,Doe,+1234567890,Carpenter,100,ACTIVE," +
        new Date().toISOString().split("T")[0] +
        ",Example Bank,1234567890,Example notes\n" +
        "Jane,Smith,+0987654321,Electrician,120,ACTIVE," +
        new Date().toISOString().split("T")[0] +
        ",Example Bank,0987654321,"

      // Download the CSV file
      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = URL.createObjectURL(blob)

      const a = document.createElement("a")
      a.href = url
      a.download = "daily_workers_template.csv"
      document.body.appendChild(a)
      a.click()

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 0)
    } catch (error) {
      console.error("Error generating template:", error)
      toast({
        title: "Error",
        description: "Failed to generate template file",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Import Daily Workers</CardTitle>
        <CardDescription>
          Upload a CSV file with daily worker information. Download the template for the correct format.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handleDownloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Download Template
          </Button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
          <Button
            variant="secondary"
            onClick={() => {
              fileInputRef.current?.click()
            }}
          >
            <Upload className="mr-2 h-4 w-4" />
            Select File
          </Button>
        </div>

        {file && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>File selected</AlertTitle>
            <AlertDescription>{file.name}</AlertDescription>
          </Alert>
        )}

        {previewData.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-2">Preview (first 5 rows)</h3>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>First Name</TableHead>
                    <TableHead>Last Name</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead>Daily Rate</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.firstName}</TableCell>
                      <TableCell>{row.lastName}</TableCell>
                      <TableCell>{row.specialization}</TableCell>
                      <TableCell>{row.dailyRate}</TableCell>
                      <TableCell>{row.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {importResult && (
          <Alert variant={importResult.success ? "default" : "destructive"}>
            {importResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>{importResult.success ? "Import Successful" : "Import Completed with Errors"}</AlertTitle>
            <AlertDescription>
              Successfully imported {importResult.imported} workers with {importResult.errors} errors.
              {importResult.errorDetails && importResult.errorDetails.length > 0 && (
                <ul className="mt-2 list-disc pl-5">
                  {importResult.errorDetails.slice(0, 5).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                  {importResult.errorDetails.length > 5 && (
                    <li>...and {importResult.errorDetails.length - 5} more errors</li>
                  )}
                </ul>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            router.push("/daily-workers")
          }}
        >
          Cancel
        </Button>
        <Button onClick={handleImport} disabled={!file || isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            "Import Workers"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
