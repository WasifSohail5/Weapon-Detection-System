"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, Square, Play, AlertTriangle, Settings } from "lucide-react"
import { useDetectionStore } from "@/store/detection-store"

export default function WebcamDetection() {
  const [isStreaming, setIsStreaming] = useState(false)
  const [confidence, setConfidence] = useState([0.25])
  const [currentDetections, setCurrentDetections] = useState<any[]>([])
  const [fps, setFps] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const fpsCounterRef = useRef({ frames: 0, lastTime: Date.now() })

  const { addDetection } = useDetectionStore()

  const startWebcam = async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsStreaming(true)

        // Start detection loop
        intervalRef.current = setInterval(processFrame, 200) // 5 FPS
      }
    } catch (err) {
      setError("Failed to access webcam. Please check permissions.")
      console.error("Webcam error:", err)
    }
  }

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsStreaming(false)
    setCurrentDetections([])
    setFps(0)
  }

  const processFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isStreaming) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx || video.readyState !== 4) return

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw current frame
    ctx.drawImage(video, 0, 0)

    // Convert to blob and send to API
    canvas.toBlob(
      async (blob) => {
        if (!blob) return

        try {
          const formData = new FormData()
          formData.append("file", blob, "frame.jpg")
          formData.append("conf_threshold", confidence[0].toString())

          const response = await fetch("http://localhost:8000/detect/frame", {
            method: "POST",
            body: formData,
          })

          if (response.ok) {
            const result = await response.json()
            setCurrentDetections(result.detections || [])

            // Update FPS counter
            const now = Date.now()
            fpsCounterRef.current.frames++
            if (now - fpsCounterRef.current.lastTime >= 1000) {
              setFps(fpsCounterRef.current.frames)
              fpsCounterRef.current.frames = 0
              fpsCounterRef.current.lastTime = now
            }

            // Add to history if weapons detected
            if (result.weapon_count > 0) {
              addDetection({
                id: `webcam-${Date.now()}`,
                timestamp: new Date().toISOString(),
                source_type: "Webcam",
                weapon_count: result.weapon_count,
                confidence_scores: result.detections.map((d: any) => d.confidence),
                processing_time: result.processing_time,
                class_names: result.detections.map((d: any) => d.class_name),
              })
            }
          }
        } catch (err) {
          console.error("Frame processing error:", err)
        }
      },
      "image/jpeg",
      0.8,
    )
  }, [confidence, isStreaming, addDetection])

  useEffect(() => {
    return () => {
      stopWebcam()
    }
  }, [])

  const drawDetections = useCallback(() => {
    if (!canvasRef.current || !videoRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx) return

    // Clear and redraw video frame
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(video, 0, 0)

    // Draw detection boxes
    currentDetections.forEach((detection) => {
      const { x1, y1, x2, y2, confidence, class_name } = detection

      // Scale coordinates to canvas size
      const scaleX = canvas.width / video.videoWidth
      const scaleY = canvas.height / video.videoHeight

      const scaledX1 = x1 * scaleX
      const scaledY1 = y1 * scaleY
      const scaledX2 = x2 * scaleX
      const scaledY2 = y2 * scaleY

      // Draw bounding box
      ctx.strokeStyle = "#ef4444"
      ctx.lineWidth = 3
      ctx.strokeRect(scaledX1, scaledY1, scaledX2 - scaledX1, scaledY2 - scaledY1)

      // Draw label background
      const label = `${class_name} ${(confidence * 100).toFixed(1)}%`
      ctx.font = "14px Arial"
      const textWidth = ctx.measureText(label).width

      ctx.fillStyle = "#ef4444"
      ctx.fillRect(scaledX1, scaledY1 - 25, textWidth + 10, 25)

      // Draw label text
      ctx.fillStyle = "#ffffff"
      ctx.fillText(label, scaledX1 + 5, scaledY1 - 8)
    })
  }, [currentDetections])

  useEffect(() => {
    if (isStreaming) {
      const animationFrame = () => {
        drawDetections()
        requestAnimationFrame(animationFrame)
      }
      requestAnimationFrame(animationFrame)
    }
  }, [isStreaming, drawDetections])

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Camera className="h-5 w-5 text-green-500" />
            <span>Live Webcam Detection</span>
          </CardTitle>
          <CardDescription>Real-time weapon detection from your webcam feed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1 mr-4">
              <Label className="text-white">Detection Confidence: {(confidence[0] * 100).toFixed(0)}%</Label>
              <Slider
                value={confidence}
                onValueChange={setConfidence}
                max={1}
                min={0.1}
                step={0.05}
                className="w-full"
              />
            </div>

            <div className="flex items-center space-x-2">
              {!isStreaming ? (
                <Button onClick={startWebcam} className="bg-green-600 hover:bg-green-700">
                  <Play className="h-4 w-4 mr-2" />
                  Start Camera
                </Button>
              ) : (
                <Button onClick={stopWebcam} variant="destructive">
                  <Square className="h-4 w-4 mr-2" />
                  Stop Camera
                </Button>
              )}
            </div>
          </div>

          {error && (
            <Alert className="border-red-600 bg-red-950/20">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-200">{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Video Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Live Feed</CardTitle>
                <div className="flex items-center space-x-4">
                  {isStreaming && (
                    <>
                      <Badge variant="outline" className="text-green-400 border-green-400">
                        Live
                      </Badge>
                      <span className="text-sm text-gray-400">{fps} FPS</span>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-auto"
                  style={{ display: isStreaming ? "block" : "none" }}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full"
                  style={{ display: isStreaming ? "block" : "none" }}
                />
                {!isStreaming && (
                  <div className="aspect-video flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Camera not active</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detection Info */}
        <div className="space-y-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Detection Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Active Detections</span>
                  <span className="text-sm text-white">{currentDetections.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Processing FPS</span>
                  <span className="text-sm text-white">{fps}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Confidence Threshold</span>
                  <span className="text-sm text-white">{(confidence[0] * 100).toFixed(0)}%</span>
                </div>
              </div>

              {currentDetections.length > 0 && (
                <div className="pt-4 border-t border-gray-800">
                  <h4 className="text-sm font-medium text-white mb-2">Current Detections</h4>
                  <div className="space-y-2">
                    {currentDetections.map((detection, index) => (
                      <div key={index} className="p-2 bg-red-950/20 border border-red-600 rounded">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-red-200">{detection.class_name}</span>
                          <Badge variant="destructive" className="text-xs">
                            {(detection.confidence * 100).toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
