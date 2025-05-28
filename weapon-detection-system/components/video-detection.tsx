"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Upload, Video, CheckCircle, Loader2, Play } from "lucide-react"
import { useDropzone } from "react-dropzone"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { detectVideo } from "@/lib/api"
import { cn } from "@/lib/utils"

interface VideoDetectionResult {
  job_id: string
  status: string
  message: string
}

export function VideoDetection() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<VideoDetectionResult | null>(null)
  const [confidence, setConfidence] = useState([0.25])
  const [frameSkip, setFrameSkip] = useState([2])
  const [progress, setProgress] = useState(0)
  const { toast } = useToast()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      setResult(null)
      setProgress(0)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "video/*": [".mp4", ".avi", ".mov", ".wmv", ".flv", ".webm"],
    },
    multiple: false,
  })

  const handleDetection = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a video file first.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setProgress(0)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return prev
        }
        return prev + Math.random() * 10
      })
    }, 1000)

    try {
      const result = await detectVideo(selectedFile, confidence[0], frameSkip[0])
      setResult(result)
      setProgress(100)

      toast({
        title: "Video Processing Started",
        description: `Job ID: ${result.job_id}. Processing in background.`,
      })
    } catch (error) {
      toast({
        title: "Processing Failed",
        description: "Failed to process the video. Please try again.",
        variant: "destructive",
      })
      setProgress(0)
    } finally {
      setIsProcessing(false)
      clearInterval(progressInterval)
    }
  }

  const clearSelection = () => {
    setSelectedFile(null)
    setPreview(null)
    setResult(null)
    setProgress(0)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.h1
          className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Video Detection
        </motion.h1>
        <motion.p
          className="text-gray-400 text-lg"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Upload videos to detect weapons frame by frame
        </motion.p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="backdrop-blur-xl bg-black/20 border border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Upload Video</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300",
                  isDragActive
                    ? "border-purple-400 bg-purple-500/10"
                    : "border-gray-600 hover:border-gray-500 hover:bg-white/5",
                )}
              >
                <input {...getInputProps()} />
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Video className="h-8 w-8 text-white" />
                  </div>
                  {isDragActive ? (
                    <p className="text-purple-400 font-medium">Drop the video here...</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-white font-medium">Drag & drop a video here</p>
                      <p className="text-gray-400 text-sm">or click to select a file</p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">Supports: MP4, AVI, MOV, WMV, FLV, WebM</p>
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-white">Confidence Threshold: {confidence[0].toFixed(2)}</Label>
                  <Slider
                    value={confidence}
                    onValueChange={setConfidence}
                    max={1}
                    min={0.1}
                    step={0.05}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-white">
                    Frame Skip: {frameSkip[0]} (process every {frameSkip[0] + 1} frames)
                  </Label>
                  <Slider value={frameSkip} onValueChange={setFrameSkip} max={10} min={1} step={1} className="w-full" />
                  <p className="text-xs text-gray-400">Higher values = faster processing, lower accuracy</p>
                </div>
              </div>

              {/* Progress Bar */}
              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Processing...</span>
                    <span className="text-white">{progress.toFixed(0)}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button
                  onClick={handleDetection}
                  disabled={!selectedFile || isProcessing}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Process Video
                    </>
                  )}
                </Button>
                {selectedFile && (
                  <Button
                    onClick={clearSelection}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Preview & Results Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="backdrop-blur-xl bg-black/20 border border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Video className="h-5 w-5" />
                <span>Preview & Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {selectedFile ? (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {/* Video Info */}
                    <div className="p-4 bg-gray-800/50 rounded-lg">
                      <h3 className="text-white font-medium mb-2">File Information</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Name:</span>
                          <span className="text-white ml-2 break-all">{selectedFile.name}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Size:</span>
                          <span className="text-white ml-2">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Type:</span>
                          <span className="text-white ml-2">{selectedFile.type}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Modified:</span>
                          <span className="text-white ml-2">
                            {new Date(selectedFile.lastModified).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Processing Status */}
                    {result && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-4"
                      >
                        <div className="p-4 rounded-lg border bg-blue-500/10 border-blue-500/30">
                          <div className="flex items-center space-x-2 mb-2">
                            <CheckCircle className="h-5 w-5 text-blue-400" />
                            <span className="font-medium text-blue-400">Processing Started</span>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-gray-400">Job ID:</span>
                              <span className="text-white ml-2 font-mono">{result.job_id}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Status:</span>
                              <span className="text-white ml-2 capitalize">{result.status}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Message:</span>
                              <span className="text-white ml-2">{result.message}</span>
                            </div>
                          </div>

                          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
                            <p className="text-yellow-400 text-sm">
                              ⏳ Video is being processed in the background. Check the History page for results.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Processing Tips */}
                    <div className="p-4 bg-gray-800/30 rounded-lg">
                      <h4 className="text-white font-medium mb-2">Processing Tips</h4>
                      <ul className="text-sm text-gray-400 space-y-1">
                        <li>• Larger videos take longer to process</li>
                        <li>• Higher frame skip values reduce processing time</li>
                        <li>• Results will appear in the History section</li>
                        <li>• Only frames with weapons are saved</li>
                      </ul>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-64 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center"
                  >
                    <div className="text-center space-y-2">
                      <Video className="h-12 w-12 text-gray-500 mx-auto" />
                      <p className="text-gray-500">No video selected</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
