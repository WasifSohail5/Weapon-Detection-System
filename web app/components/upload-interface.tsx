"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, ImageIcon, Video, FileText, AlertTriangle, CheckCircle } from "lucide-react"
import { useDropzone } from "react-dropzone"
import { useDetectionStore } from "@/store/detection-store"

export default function UploadInterface() {
  const [confidence, setConfidence] = useState([0.25])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [result, setResult] = useState<any>(null)
  const { addDetection } = useDetectionStore()

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      setUploading(true)
      setUploadProgress(0)
      setResult(null)

      try {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("conf_threshold", confidence[0].toString())

        const endpoint = file.type.startsWith("image/") ? "/detect/image" : "/detect/video/upload"

        const response = await fetch(`http://localhost:8000${endpoint}`, {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`)
        }

        const data = await response.json()
        setResult(data)

        if (data.weapon_count > 0) {
          addDetection(data)
        }

        setUploadProgress(100)
      } catch (error) {
        console.error("Upload error:", error)
        setResult({ error: error instanceof Error ? error.message : "Upload failed" })
      } finally {
        setUploading(false)
      }
    },
    [confidence, addDetection],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".bmp"],
      "video/*": [".mp4", ".avi", ".mov", ".wmv", ".flv"],
    },
    maxFiles: 1,
    disabled: uploading,
  })

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Upload className="h-5 w-5 text-blue-500" />
            <span>File Upload</span>
          </CardTitle>
          <CardDescription>Upload images or videos for weapon detection analysis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Confidence Threshold */}
          <div className="space-y-2">
            <Label className="text-white">Detection Confidence Threshold: {(confidence[0] * 100).toFixed(0)}%</Label>
            <Slider value={confidence} onValueChange={setConfidence} max={1} min={0.1} step={0.05} className="w-full" />
            <p className="text-xs text-gray-400">Higher values reduce false positives but may miss some detections</p>
          </div>

          {/* Drop Zone */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${
                isDragActive ? "border-blue-500 bg-blue-950/20" : "border-gray-600 hover:border-gray-500 bg-gray-800/50"
              }
              ${uploading ? "pointer-events-none opacity-50" : ""}
            `}
          >
            <input {...getInputProps()} />
            <div className="space-y-4">
              <div className="flex justify-center space-x-4">
                <ImageIcon className="h-8 w-8 text-gray-400" />
                <Video className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <p className="text-lg font-medium text-white">
                  {isDragActive ? "Drop files here" : "Drag & drop files here"}
                </p>
                <p className="text-gray-400">or click to browse</p>
              </div>
              <div className="text-sm text-gray-500">Supports: JPG, PNG, GIF, MP4, AVI, MOV (Max 100MB)</div>
            </div>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Processing...</span>
                <span className="text-sm text-gray-400">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              {result.error ? (
                <Alert className="border-red-600 bg-red-950/20">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-200">{result.error}</AlertDescription>
                </Alert>
              ) : (
                <Alert
                  className={`${result.weapon_count > 0 ? "border-red-600 bg-red-950/20" : "border-green-600 bg-green-950/20"}`}
                >
                  {result.weapon_count > 0 ? (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  <AlertDescription className={result.weapon_count > 0 ? "text-red-200" : "text-green-200"}>
                    <strong>
                      {result.weapon_count > 0
                        ? `⚠️ ${result.weapon_count} weapon(s) detected!`
                        : "✅ No weapons detected"}
                    </strong>
                    <br />
                    Processing time: {result.processing_time?.toFixed(2)}s
                    {result.confidence_scores?.length > 0 && (
                      <>
                        <br />
                        Max confidence: {(Math.max(...result.confidence_scores) * 100).toFixed(1)}%
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {result.job_id && (
                <div className="p-4 bg-blue-950/20 border border-blue-600 rounded-lg">
                  <p className="text-blue-200">
                    <strong>Video processing started</strong>
                  </p>
                  <p className="text-sm text-blue-300">Job ID: {result.job_id}</p>
                  <p className="text-xs text-blue-400 mt-1">Results will appear in real-time as frames are processed</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Tips */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <FileText className="h-5 w-5 text-yellow-500" />
            <span>Upload Guidelines</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-white mb-2">Image Files</h4>
              <ul className="space-y-1 text-gray-400">
                <li>• Clear, well-lit images work best</li>
                <li>• Minimum resolution: 640x640</li>
                <li>• Supported: JPG, PNG, GIF, BMP</li>
                <li>• Max size: 10MB</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">Video Files</h4>
              <ul className="space-y-1 text-gray-400">
                <li>• Good lighting and stable footage</li>
                <li>• Processed frame by frame</li>
                <li>• Supported: MP4, AVI, MOV, WMV</li>
                <li>• Max size: 100MB</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
