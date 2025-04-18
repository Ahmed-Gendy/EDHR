"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle, CheckCircle, FileSpreadsheet, Loader2, Upload, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { downloadTemplate, parseExcelFile, validateData } from "@/lib/import-export-utils"

interface DataImportProps {
  title: string
  description: string
  requiredFields: string[]
  templateFields: string[]
  templateFileName: string
  onImport: (data: any[]) => Promise<{ success: boolean; message: string }>
  instructions?: React.ReactNode
}

export function DataImport(props: DataImportProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Handle file selection
  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setError(null)
    setResult(null)

    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    // Check file type
    if (!selectedFile.name.endsWith(".xlsx") && !selectedFile.name.endsWith(".xls")) {
      setError("Please upload an Excel file (.xlsx or .xls)")
      return
    }

    setFile(selectedFile)

    // Parse and preview file
    parseExcelFile(selectedFile)
      .then((data) => {
        // Validate data
        const validation = validateData(data, props.requiredFields)
        if (!validation.valid) {
          setError(validation.errors.join("\n"))
          setPreview([])
          return
        }

        // Set preview data (first 5 rows)
        setPreview(data.slice(0, 5))
      })
      .catch((err) => {
        setError(err.message || "Failed to read Excel file")
        setPreview([])
      })
  }

  // Handle import
  function handleImport() {
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file to import",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    // Parse file
    parseExcelFile(file)
      .then((data) => {
        // Validate data
        const validation = validateData(data, props.requiredFields)
        if (!validation.valid) {
          setError(validation.errors.join("\n"))
          setLoading(false)
          return
        }

        // Import data
        return props.onImport(data)
      })
      .then((importResult) => {
        if (importResult) {
          setResult(importResult)
          toast({
            title: importResult.success ? "Import Successful" : "Import Failed",
            description: importResult.message,
            variant: importResult.success ? "default" : "destructive",
          })
        }
      })
      .catch((err) => {
        setError(err.message || "An error occurred during import")
        toast({
          title: "Error",
          description: err.message || "An error occurred during import",
          variant: "destructive",
        })
      })
      .finally(() => {
        setLoading(false)
      })
  }

  // Handle template download
  function handleDownloadTemplate() {
    try {
      downloadTemplate(props.templateFields, props.templateFileName)
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to generate template file",
        variant: "destructive",
      })
    }
  }

  // Reset form
  function handleReset() {
    setFile(null)
    setPreview([])
    setError(null)
    setResult(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.title}</CardTitle>
        <CardDescription>{props.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error message */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Import result */}
        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>{result.success ? "Import Successful" : "Import Failed"}</AlertTitle>
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        {props.instructions && <div className="mb-4">{props.instructions}</div>}

        {/* File selection */}
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={handleDownloadTemplate}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Download Template
          </Button>
          <Input type="file" id="file-upload" accept=".xlsx, .xls" onChange={handleFileChange} className="hidden" />
          <Button variant="secondary" asChild>
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="mr-2 h-4 w-4" />
              Select File
            </label>
          </Button>
        </div>

        {/* Selected file info */}
        {file && (
          <div className="p-4 border rounded-md bg-muted/50">
            <p className="font-medium">Selected file: {file.name}</p>
            <p className="text-sm text-muted-foreground">Size: {(file.size / 1024).toFixed(2)} KB</p>
          </div>
        )}

        {/* Preview data */}
        {preview.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium">Preview (first 5 rows):</h3>
            <div className="max-h-60 overflow-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(preview[0]).map((key, index) => (
                      <TableHead key={index}>{key}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {Object.keys(row).map((key, cellIndex) => {
                        const cellValue = row[key]
                        return (
                          <TableCell key={cellIndex}>
                            {cellValue !== undefined && cellValue !== null ? String(cellValue) : "-"}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleReset}>
          <X className="mr-2 h-4 w-4" />
          Clear
        </Button>
        <Button onClick={handleImport} disabled={!file || loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
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
