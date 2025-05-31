"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Camera, Upload, BarChart3, History, AlertTriangle, Eye, Info } from "lucide-react"
import Dashboard from "@/components/dashboard"
import UploadInterface from "@/components/upload-interface"
import WebcamDetection from "@/components/webcam-detection"
import DetectionHistory from "@/components/detection-history"
import Analytics from "@/components/analytics"
import { useWebSocket } from "@/hooks/use-websocket"
import { useDetectionStore } from "@/store/detection-store"

export default function WeaponDetectionSystem() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const { isConnected, connectionStatus } = useWebSocket()
  const { recentDetections, loadHistory, error } = useDetectionStore()

  // Load detection history on component mount
  useEffect(() => {
    // Only attempt to load if we're in a browser environment
    if (typeof window !== "undefined") {
      loadHistory()
    }
  }, [loadHistory])

  const hasRecentAlerts = recentDetections.some(
    (detection) => detection.weapon_count > 0 && new Date(detection.timestamp).getTime() > Date.now() - 300000, // Last 5 minutes
  )

  const isBackendOffline = connectionStatus === "Backend offline" || error

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-600 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Weapon Detection System</h1>
                <p className="text-sm text-gray-400">AI-Powered Security Monitoring</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isBackendOffline ? "bg-orange-500" : isConnected ? "bg-green-500" : "bg-yellow-500"
                  }`}
                />
                <span className="text-sm text-gray-400">
                  {isBackendOffline ? "Demo Mode" : isConnected ? "Live" : connectionStatus}
                </span>
              </div>

              {/* Alert Indicator */}
              {hasRecentAlerts && (
                <Badge variant="destructive" className="animate-pulse">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Active Alert
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Backend Status Info */}
      {isBackendOffline && (
        <div className="bg-blue-950/20 border-b border-blue-800">
          <div className="container mx-auto px-4 py-2">
            <Alert className="border-blue-600 bg-transparent">
              <Info className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-200 text-sm">
                <strong>Demo Mode:</strong> The FastAPI backend is not running. You're viewing the interface with demo
                data. Start your backend on localhost:8000 for full functionality including real-time detection,
                uploads, and webcam features.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-gray-900 border border-gray-800">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              <span>Upload</span>
            </TabsTrigger>
            <TabsTrigger value="webcam" className="flex items-center space-x-2">
              <Camera className="h-4 w-4" />
              <span>Live Feed</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2">
              <History className="h-4 w-4" />
              <span>History</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <Eye className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <Dashboard />
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <UploadInterface />
          </TabsContent>

          <TabsContent value="webcam" className="space-y-6">
            <WebcamDetection />
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <DetectionHistory />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Analytics />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
