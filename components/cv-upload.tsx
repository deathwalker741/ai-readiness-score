"use client"

import React from "react"

import { useCallback, useState } from "react"
import { Upload, FileText, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface CVUploadProps {
  onSubmit: (content: string, file?: File) => void
  isLoading: boolean
}

export function CVUpload({ onSubmit, isLoading }: CVUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [textContent, setTextContent] = useState("")
  const [mode, setMode] = useState<"upload" | "paste">("upload")

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      console.debug("[cv-upload] file dropped:", droppedFile.name, "size:", droppedFile.size, "type:", droppedFile.type)
      if (
        droppedFile.type === "text/plain" ||
        droppedFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        droppedFile.name.endsWith(".txt") ||
        droppedFile.name.endsWith(".docx")
      ) {
        setFile(droppedFile)
      }
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      console.debug("[cv-upload] file selected:", e.target.files[0].name, "size:", e.target.files[0].size)
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = () => {
    console.debug("[cv-upload] submit clicked mode:", mode, "file:", file ? file.name : null, "textLength:", textContent.length)
    if (mode === "upload" && file) {
      onSubmit("", file)
    } else if (mode === "paste" && textContent.trim()) {
      onSubmit(textContent)
    }
  }

  const clearFile = () => {
    console.debug("[cv-upload] clearing selected file")
    setFile(null)
  }

  const canSubmit =
    (mode === "upload" && file !== null) ||
    (mode === "paste" && textContent.trim().length > 50)

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="flex gap-2 p-1 bg-secondary rounded-lg">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={cn(
            "flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all",
            mode === "upload"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Upload File
        </button>
        <button
          type="button"
          onClick={() => setMode("paste")}
          className={cn(
            "flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all",
            mode === "paste"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Paste Text
        </button>
      </div>

      {mode === "upload" ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            "relative border-2 border-dashed rounded-xl p-8 transition-all duration-200",
            dragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50",
            file && "border-success bg-success/5"
          )}
        >
          {file ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearFile}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <div className="text-center">
              <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Upload className="w-7 h-7 text-primary" />
              </div>
              <p className="text-foreground font-medium mb-1">
                Drop your CV here or click to browse
              </p>
              <p className="text-sm text-muted-foreground">
                Supports .docx and .txt files
              </p>
              <input
                type="file"
                accept=".txt,.docx,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          )}
        </div>
      ) : (
        <Textarea
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          placeholder="Paste your CV content here...

Include your work experience, projects, skills, and education. The more detailed, the better the evaluation."
          className="min-h-[300px] resize-none bg-secondary border-border focus:border-primary text-foreground placeholder:text-muted-foreground"
        />
      )}

      <Button
        onClick={handleSubmit}
        disabled={!canSubmit || isLoading}
        className="w-full h-12 text-base font-medium"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Analyzing CV...
          </>
        ) : (
          <>
            Evaluate AI Readiness
          </>
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Your CV is analyzed securely and not stored
      </p>
    </div>
  )
}
