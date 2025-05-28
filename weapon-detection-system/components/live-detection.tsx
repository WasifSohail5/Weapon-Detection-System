"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Camera, Square, AlertTriangle, CheckCircle, Loader2, Eye, EyeOff } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { detectFrame } from "@/lib/api"
import { cn } from "@/lib/utils"

interface LiveDetectionResult {
  weapon_count: number
  confidence_scores: number[]
  processing_time: number
  detections: Array<{
    x1: number
    y1: number
    x2: number
    y2: number
    confidence: number
    class_id: number
    class_name: string
  }>
}

export function LiveDetection() {
  const [isStreaming, setIsStreaming] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [confidence, setConfidence] = useState([0.25])
  const [result, setResult] = useState<LiveDetectionResult | null>(null)
  const [fps, setFps] = useState(0)
  const [alertCount, setAlertCount] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsStreaming(true)

        toast({
          title: "Camera Started",
          description: "Webcam is now active and ready for detection.",
        })
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Failed to access webcam. Please check permissions.",
        variant: "destructive",
      })
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    setIsStreaming(false)
    setIsProcessing(false)
    setResult(null)
    setFps(0)

    toast({
      title: "Camera Stopped",
      description: "Webcam has been disconnected.",
    })
  }

  const captureFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx) return

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw current frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert to blob and send for detection
    canvas.toBlob(
      async (blob) => {
        if (!blob) return

        setIsProcessing(true)
        const startTime = Date.now()

        try {
          const file = new File([blob], "frame.jpg", { type: "image/jpeg" })
          const result = await detectFrame(file, confidence[0])

          setResult(result)

          // Calculate FPS
          const processingTime = (Date.now() - startTime) / 1000
          setFps(Math.round(1 / processingTime))

          // Alert if weapons detected
          if (result.weapon_count > 0) {
            setAlertCount((prev) => prev + 1)

            // Show alert toast (throttled)
            if (alertCount % 10 === 0) {
              toast({
                title: "⚠️ WEAPON DETECTED!",
                description: `${result.weapon_count} weapon(s) detected in live feed!`,
                variant: "destructive",
              })
            }
          }
        } catch (error) {
          console.error("Detection error:", error)
        } finally {
          setIsProcessing(false)
        }
      },
      "image/jpeg",
      0.8,
    )
  }, [confidence, isProcessing, alertCount, toast])

  const startDetection = () => {
    if (intervalRef.current) return

    intervalRef.current = setInterval(captureFrame, 1000) // Process every second
    toast({
      title: "Detection Started",
      description: "Real-time weapon detection is now active.",
    })
  }

  const stopDetection = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setResult(null)
    setFps(0)
    toast({
      title: "Detection Stopped",
      description: "Real-time detection has been paused.",
    })
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.h1
          className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Live Detection
        </motion.h1>
        <motion.p
          className="text-gray-400 text-lg"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Real-time weapon detection using your webcam
        </motion.p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Camera Feed */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="backdrop-blur-xl bg-black/20 border border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Camera className="h-5 w-5" />
                  <span>Live Camera Feed</span>
                </div>
                <div className="flex items-center space-x-2">
                  {isStreaming && (
                    <Badge variant="outline" className="border-green-500/30 text-green-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                      LIVE
                    </Badge>
                  )}
                  {fps > 0 && (
                    <Badge variant="outline" className="border-blue-500/30 text-blue-400">
                      {fps} FPS
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-64 md:h-96 bg-gray-900 rounded-lg object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Overlay for detection results */}
                {result && result.detections.length > 0 && (
                  <div className="absolute inset-0 pointer-events-none">
                    {result.detections.map((detection, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute border-2 border-red-500 bg-red-500/20"
                        style={{
                          left: `${(detection.x1 / 640) * 100}%`,
                          top: `${(detection.y1 / 480) * 100}%`,
                          width: `${((detection.x2 - detection.x1) / 640) * 100}%`,
                          height: `${((detection.y2 - detection.y1) / 480) * 100}%`,
                        }}
                      >
                        <div className="absolute -top-6 left-0 bg-red-500 text-white text-xs px-2 py-1 rounded">
                          {detection.class_name} {(detection.confidence * 100).toFixed(0)}%
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {!isStreaming && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                    <div className="text-center space-y-4">
                      <EyeOff className="h-16 w-16 text-gray-500 mx-auto" />
                      <p className="text-gray-400">Camera not active</p>
                      <Button
                        onClick={startCamera}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        Start Camera
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Camera Controls */}
              {isStreaming && (
                <div className="flex justify-center space-x-4 mt-4">
                  {!intervalRef.current ? (
                    <Button
                      onClick={startDetection}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Start Detection
                    </Button>
                  ) : (
                    <Button
                      onClick={stopDetection}
                      variant="outline"
                      className="border-yellow-500 text-yellow-400 hover:bg-yellow-500/10"
                    >
                      <Square className="mr-2 h-4 w-4" />
                      Pause Detection
                    </Button>
                  )}

                  <Button
                    onClick={stopCamera}
                    variant="outline"
                    className="border-red-500 text-red-400 hover:bg-red-500/10"
                  >
                    <EyeOff className="mr-2 h-4 w-4" />
                    Stop Camera
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Controls & Status */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-6"
        >
          {/* Settings */}
          <Card className="backdrop-blur-xl bg-black/20 border border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Detection Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                <p className="text-xs text-gray-400">Higher values = fewer false positives</p>
              </div>
            </CardContent>
          </Card>

          {/* Live Status */}
          <Card className="backdrop-blur-xl bg-black/20 border border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Live Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Camera:</span>
                  <span className={cn("ml-2 font-medium", isStreaming ? "text-green-400" : "text-red-400")}>
                    {isStreaming ? "Active" : "Inactive"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Detection:</span>
                  <span className={cn("ml-2 font-medium", intervalRef.current ? "text-green-400" : "text-gray-400")}>
                    {intervalRef.current ? "Running" : "Stopped"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">FPS:</span>
                  <span className="text-white ml-2">{fps}</span>
                </div>
                <div>
                  <span className="text-gray-400">Alerts:</span>
                  <span className={cn("ml-2 font-medium", alertCount > 0 ? "text-red-400" : "text-gray-400")}>
                    {alertCount}
                  </span>
                </div>
              </div>

              {/* Current Detection Result */}
              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={cn(
                      "p-3 rounded-lg border",
                      result.weapon_count > 0
                        ? "bg-red-500/10 border-red-500/30"
                        : "bg-green-500/10 border-green-500/30",
                    )}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      {result.weapon_count > 0 ? (
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      )}
                      <span
                        className={cn(
                          "text-sm font-medium",
                          result.weapon_count > 0 ? "text-red-400" : "text-green-400",
                        )}
                      >
                        {result.weapon_count > 0 ? `${result.weapon_count} Weapon(s)!` : "All Clear"}
                      </span>
                    </div>

                    <div className="text-xs text-gray-400">Processing: {result.processing_time.toFixed(3)}s</div>

                    {result.confidence_scores.length > 0 && (
                      <div className="mt-2">
                        <div className="flex flex-wrap gap-1">
                          {result.confidence_scores.map((score, index) => (
                            <span key={index} className="px-1 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">
                              {(score * 100).toFixed(0)}%
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {isProcessing && (
                <div className="flex items-center space-x-2 text-blue-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Processing frame...</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Safety Notice */}
          <Card className="backdrop-blur-xl bg-black/20 border border-yellow-500/30">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-yellow-400 font-medium text-sm">Safety Notice</p>
                  <p className="text-gray-400 text-xs">
                    This system is for demonstration purposes. Always follow proper security protocols and contact
                    authorities for real threats.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
