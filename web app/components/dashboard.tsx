"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Shield, Camera, Clock, TrendingUp, Zap, RefreshCw, Wifi, WifiOff, Server } from "lucide-react"
import { useDetectionStore } from "@/store/detection-store"
import { useWebSocket } from "@/hooks/use-websocket"
import { formatDistanceToNow } from "date-fns"

export default function Dashboard() {
  const { detections, recentDetections, stats, error, isLoading, loadHistory, clearError } = useDetectionStore()
  const { isConnected, connectionStatus, reconnect } = useWebSocket()

  const recentAlerts = recentDetections.filter((d) => d.weapon_count > 0).slice(0, 5)
  const todayDetections = detections.filter((d) => new Date(d.timestamp).toDateString() === new Date().toDateString())

  const isBackendOffline = connectionStatus === "Backend offline" || error

  return (
    <div className="space-y-6">
      {/* Backend Status Alert */}
      {isBackendOffline && (
        <Alert className="border-orange-600 bg-orange-950/20">
          <Server className="h-4 w-4 text-orange-500" />
          <AlertDescription className="text-orange-200 flex items-center justify-between">
            <span>
              <strong>Backend Status:</strong> FastAPI server is offline. Running in demo mode with local data only.
            </span>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (error) {
                    clearError()
                    loadHistory()
                  }
                  reconnect()
                }}
                disabled={isLoading}
                className="border-orange-600 text-orange-200 hover:bg-orange-950/40"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? "animate-spin" : ""}`} />
                Check Backend
              </Button>
              {error && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearError}
                  className="text-orange-200 hover:bg-orange-950/40"
                >
                  Dismiss
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Recent Alerts */}
      {recentAlerts.length > 0 && (
        <Alert className="border-red-600 bg-red-950/20">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-200">
            <strong>Security Alert:</strong> {recentAlerts.length} weapon detection(s) in the last hour. Latest:{" "}
            {formatDistanceToNow(new Date(recentAlerts[0].timestamp))} ago.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Detections</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalDetections}</div>
            <p className="text-xs text-gray-500">{isBackendOffline ? "Demo data" : "All time"}</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Today's Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{todayDetections.length}</div>
            <p className="text-xs text-gray-500">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Avg Confidence</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats.avgConfidence ? `${(stats.avgConfidence * 100).toFixed(1)}%` : "N/A"}
            </div>
            <p className="text-xs text-gray-500">Detection accuracy</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">System Status</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isBackendOffline ? "text-orange-400" : "text-green-400"}`}>
              {isBackendOffline ? "Demo" : "Live"}
            </div>
            <p className="text-xs text-gray-500">{isBackendOffline ? "Frontend only" : "Full system"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>{isBackendOffline ? "Demo detection data" : "Latest weapon detections"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentDetections.slice(0, 5).map((detection) => (
              <div key={detection.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-2 h-2 rounded-full ${detection.weapon_count > 0 ? "bg-red-500" : "bg-green-500"}`}
                  />
                  <div>
                    <p className="text-sm font-medium text-white">
                      {detection.weapon_count > 0 ? "Weapon Detected" : "No Threat"}
                    </p>
                    <p className="text-xs text-gray-400">{detection.source_type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">{formatDistanceToNow(new Date(detection.timestamp))} ago</p>
                  {detection.weapon_count > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {detection.weapon_count} weapon{detection.weapon_count > 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            {recentDetections.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-2">
                  {isBackendOffline ? "No demo data available" : "No recent activity"}
                </p>
                {isBackendOffline && (
                  <p className="text-xs text-gray-600">Start your FastAPI backend to see real detection data</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Camera className="h-5 w-5 text-green-500" />
              <span>System Overview</span>
            </CardTitle>
            <CardDescription>Current monitoring status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Image Detection</span>
                <Badge
                  variant="outline"
                  className={isBackendOffline ? "text-orange-400 border-orange-400" : "text-green-400 border-green-400"}
                >
                  {isBackendOffline ? "Demo" : "Live"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Video Processing</span>
                <Badge
                  variant="outline"
                  className={isBackendOffline ? "text-orange-400 border-orange-400" : "text-green-400 border-green-400"}
                >
                  {isBackendOffline ? "Demo" : "Live"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Live Feed</span>
                <Badge
                  variant="outline"
                  className={isBackendOffline ? "text-orange-400 border-orange-400" : "text-green-400 border-green-400"}
                >
                  {isBackendOffline ? "Demo" : "Ready"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">WebSocket</span>
                <Badge
                  variant="outline"
                  className={isConnected ? "text-green-400 border-green-400" : "text-orange-400 border-orange-400"}
                >
                  {isConnected ? (
                    <>
                      <Wifi className="h-3 w-3 mr-1" />
                      Connected
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3 w-3 mr-1" />
                      {connectionStatus}
                    </>
                  )}
                </Badge>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-800">
              <h4 className="text-sm font-medium text-white mb-2">Detection Sources</h4>
              <div className="space-y-2">
                {["Image Upload", "Video Upload", "Webcam"].map((source) => {
                  const count = detections.filter((d) => d.source_type === source).length
                  return (
                    <div key={source} className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{source}</span>
                      <span className="text-xs text-white">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
