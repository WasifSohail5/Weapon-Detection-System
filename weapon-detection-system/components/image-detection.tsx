"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Upload, ImageIcon, AlertTriangle, CheckCircle, Loader2 } from "lucide-react"
import { useDropzone } from "react-dropzone"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { detectImage } from "@/lib/api"
import { cn } from "@/lib/utils"

interface DetectionResult {
  id: string
  timestamp: string
  weapon_count: number
  confidence_scores: number[]
  processing_time: number
  class_names: string[]
}

export function ImageDetection() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<DetectionResult | null>(null)
  const [confidence, setConfidence] = useState([0.25])
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
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".bmp", ".webp"],
    },
    multiple: false,
  })

  const handleDetection = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select an image file first.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      const result = await detectImage(selectedFile, confidence[0])
      setResult(result)

      if (result.weapon_count > 0) {
        toast({
          title: "⚠️ Weapons Detected!",
          description: `Found ${result.weapon_count} weapon(s) in the image.`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "✅ No Weapons Detected",
          description: "The image appears to be safe.",
        })
      }
    } catch (error) {
      toast({
        title: "Detection Failed",
        description: "Failed to process the image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const clearSelection = () => {
    setSelectedFile(null)
    setPreview(null)
    setResult(null)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.h1
          className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Image Detection
        </motion.h1>
        <motion.p
          className="text-gray-400 text-lg"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Upload images to detect weapons using AI-powered analysis
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
                <span>Upload Image</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300",
                  isDragActive
                    ? "border-blue-400 bg-blue-500/10"
                    : "border-gray-600 hover:border-gray-500 hover:bg-white/5",
                )}
              >
                <input {...getInputProps()} />
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-white" />
                  </div>
                  {isDragActive ? (
                    <p className="text-blue-400 font-medium">Drop the image here...</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-white font-medium">Drag & drop an image here</p>
                      <p className="text-gray-400 text-sm">or click to select a file</p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">Supports: JPEG, PNG, GIF, BMP, WebP</p>
                </div>
              </div>

              {/* Confidence Threshold */}
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
                <p className="text-xs text-gray-400">Higher values = more strict detection</p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button
                  onClick={handleDetection}
                  disabled={!selectedFile || isProcessing}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Detect Weapons
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
                <ImageIcon className="h-5 w-5" />
                <span>Preview & Results</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {preview ? (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {/* Image Preview */}
                    <div className="relative">
                      <img
                        src={preview || "/placeholder.svg"}
                        alt="Preview"
                        className="w-full h-64 object-contain rounded-lg bg-gray-900"
                      />
                      {isProcessing && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                          <div className="text-center space-y-2">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto" />
                            <p className="text-white font-medium">Analyzing image...</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Results */}
                    {result && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-4"
                      >
                        <div
                          className={cn(
                            "p-4 rounded-lg border",
                            result.weapon_count > 0
                              ? "bg-red-500/10 border-red-500/30"
                              : "bg-green-500/10 border-green-500/30",
                          )}
                        >
                          <div className="flex items-center space-x-2 mb-2">
                            {result.weapon_count > 0 ? (
                              <AlertTriangle className="h-5 w-5 text-red-400" />
                            ) : (
                              <CheckCircle className="h-5 w-5 text-green-400" />
                            )}
                            <span
                              className={cn("font-medium", result.weapon_count > 0 ? "text-red-400" : "text-green-400")}
                            >
                              {result.weapon_count > 0
                                ? `${result.weapon_count} Weapon(s) Detected!`
                                : "No Weapons Detected"}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-400">Processing Time:</span>
                              <span className="text-white ml-2">{result.processing_time.toFixed(3)}s</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Timestamp:</span>
                              <span className="text-white ml-2">{new Date(result.timestamp).toLocaleTimeString()}</span>
                            </div>
                          </div>

                          {result.confidence_scores.length > 0 && (
                            <div className="mt-3">
                              <span className="text-gray-400 text-sm">Confidence Scores:</span>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {result.confidence_scores.map((score, index) => (
                                  <span key={index} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                                    {(score * 100).toFixed(1)}%
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
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
                      <ImageIcon className="h-12 w-12 text-gray-500 mx-auto" />
                      <p className="text-gray-500">No image selected</p>
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
