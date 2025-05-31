"use client"

import type React from "react"

import { useCallback } from "react"

export interface DropzoneOptions {
  onDrop: (files: File[]) => void
  accept?: Record<string, string[]>
  maxFiles?: number
  disabled?: boolean
}

export function useDropzone(options: DropzoneOptions) {
  const { onDrop, accept, maxFiles = 1, disabled = false } = options

  const getRootProps = useCallback(
    () => ({
      onDrop: (e: React.DragEvent) => {
        e.preventDefault()
        if (disabled) return

        const files = Array.from(e.dataTransfer.files)
        const validFiles = files.slice(0, maxFiles)

        if (accept) {
          const acceptedFiles = validFiles.filter((file) => {
            const fileType = file.type
            return Object.keys(accept).some((key) => {
              if (key === fileType) return true
              if (key.endsWith("/*")) {
                const baseType = key.split("/")[0]
                return fileType.startsWith(baseType + "/")
              }
              return false
            })
          })
          onDrop(acceptedFiles)
        } else {
          onDrop(validFiles)
        }
      },
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault()
      },
      onDragEnter: (e: React.DragEvent) => {
        e.preventDefault()
      },
    }),
    [onDrop, accept, maxFiles, disabled],
  )

  const getInputProps = useCallback(
    () => ({
      type: "file" as const,
      multiple: maxFiles > 1,
      accept: accept ? Object.keys(accept).join(",") : undefined,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        if (disabled) return
        const files = Array.from(e.target.files || [])
        const validFiles = files.slice(0, maxFiles)
        onDrop(validFiles)
      },
      style: { display: "none" },
    }),
    [onDrop, accept, maxFiles, disabled],
  )

  return {
    getRootProps,
    getInputProps,
    isDragActive: false, // Simplified for this implementation
  }
}
