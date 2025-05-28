"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Clock, AlertTriangle, TrendingUp, Camera, Video, Eye, Wifi, WifiOff } from "lucide-react"
import { DetectionChart } from "@/components/detection-chart"
import { RecentDetections } from "@/components/recent-detections"
import { useDetection } from "@/contexts/detection-context"
import { checkApiHealth } from "@/lib/api"
import { motion } from "framer-motion"

export function Dashboard() {
  const { detectionHistory, isLoading, error } = useDetection()
  const [apiConnected, setApiConnected] = useState<boolean | null>(null)
  const [stats, setStats] = useState({
    totalDetections: 0,
    weaponsDetected: 0,
    avgProcessingTime: 0,
    recentAlerts: 0,
  })

  useEffect(() => {
    // Check API health on component mount
    checkApiHealth().then((connected) => {
      setApiConnected(connected)
      if (!connected) {
        console.log("Running in demo mode - start your FastAPI backend to connect to live data")
      }
    })
  }, [])

  useEffect(() => {
    if (detectionHistory.length > 0) {
      const totalDetections = detectionHistory.length
      const weaponsDetected = detectionHistory.reduce((sum, detection) => sum + detection.weapon_count, 0)
      const avgProcessingTime =
        detectionHistory.reduce((sum, detection) => sum + detection.processing_time, 0) / totalDetections
      const recentAlerts = detectionHistory.filter((detection) => {
        const detectionTime = new Date(detection.timestamp)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        return detectionTime > oneDayAgo && detection.weapon_count > 0
      }).length

      setStats({
        totalDetections,
        weaponsDetected,
        avgProcessingTime,
        recentAlerts,
      })
    }
  }, [detectionHistory])

  const statCards = [
    {
      title: "Total Detections",
      value: stats.totalDetections,
      icon: Shield,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
    },
    {
      title: "Weapons Detected",
      value: stats.weaponsDetected,
      icon: AlertTriangle,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
    },
    {
      title: "Avg Processing Time",
      value: `${stats.avgProcessingTime.toFixed(2)}s`,
      icon: Clock,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
    },
    {
      title: "Recent Alerts (24h)",
      value: stats.recentAlerts,
      icon: TrendingUp,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
    },
  ]

  const quickActions = [
    {
      title: "Image Detection",
      description: "Upload and analyze images for weapons",
      icon: Camera,
      href: "/image-detection",
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Video Detection",
      description: "Process video files for weapon detection",
      icon: Video,
      href: "/video-detection",
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "Live Detection",
      description: "Real-time webcam monitoring",
      icon: Eye,
      href: "/live-detection",
      color: "from-green-500 to-emerald-500",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.h1
          className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Security Dashboard
        </motion.h1>
        <motion.p
          className="text-gray-400 text-lg"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Real-time weapon detection and monitoring system
        </motion.p>
      </div>

      {/* Demo Mode Alert */}
      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Alert className="border-blue-500/50 bg-blue-500/10">
            <Eye className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-blue-200">
              <strong>Demo Mode:</strong> Exploring the interface with sample data. Start your FastAPI backend at{" "}
              <code className="bg-blue-500/20 px-1 rounded">http://localhost:8000</code> to connect live detection.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card
                className={`backdrop-blur-xl bg-black/20 border ${stat.borderColor} hover:bg-black/30 transition-all duration-300`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">{stat.title}</CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickActions.map((action, index) => {
          const Icon = action.icon
          return (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
            >
              <Card className="backdrop-blur-xl bg-black/20 border border-white/10 hover:bg-black/30 transition-all duration-300 cursor-pointer group">
                <CardHeader>
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-r ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-white group-hover:text-blue-400 transition-colors">
                    {action.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400">{action.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <DetectionChart />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <RecentDetections />
        </motion.div>
      </div>

      {/* System Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9 }}
      >
        <Card className="backdrop-blur-xl bg-black/20 border border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-400" />
              <span>System Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="border-green-500/30 text-green-400">
                  AI Model: Active
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    apiConnected === false ? "border-red-500/30 text-red-400" : "border-blue-500/30 text-blue-400"
                  }
                >
                  {apiConnected === false ? (
                    <>
                      <WifiOff className="w-3 h-3 mr-1" />
                      API: Disconnected
                    </>
                  ) : (
                    <>
                      <Wifi className="w-3 h-3 mr-1" />
                      API: {apiConnected ? "Connected" : "Checking..."}
                    </>
                  )}
                </Badge>
                <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                  Detection: Ready
                </Badge>
              </div>
              <div className="text-sm text-gray-400">Last updated: {new Date().toLocaleTimeString()}</div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
