"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Clock, CheckCircle } from "lucide-react"
import { useDetection } from "@/contexts/detection-context"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export function RecentDetections() {
  const { detectionHistory } = useDetection()

  const recentDetections = detectionHistory
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5)

  const getSourceTypeColor = (sourceType: string) => {
    switch (sourceType.toLowerCase()) {
      case "image upload":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30"
      case "video upload":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30"
      case "webcam":
        return "bg-green-500/10 text-green-400 border-green-500/30"
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/30"
    }
  }

  return (
    <Card className="backdrop-blur-xl bg-black/20 border border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <Clock className="h-5 w-5 text-purple-400" />
          <span>Recent Activity</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentDetections.length > 0 ? (
          <div className="space-y-4">
            {recentDetections.map((detection, index) => (
              <motion.div
                key={detection.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30 border border-gray-700/50"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={cn("p-2 rounded-full", detection.weapon_count > 0 ? "bg-red-500/20" : "bg-green-500/20")}
                  >
                    {detection.weapon_count > 0 ? (
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className={getSourceTypeColor(detection.source_type)}>
                        {detection.source_type}
                      </Badge>
                      {detection.weapon_count > 0 && (
                        <Badge variant="outline" className="border-red-500/30 text-red-400">
                          {detection.weapon_count} weapon(s)
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{new Date(detection.timestamp).toLocaleString()}</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-white">{detection.processing_time.toFixed(3)}s</div>
                  <div className="text-xs text-gray-400">processing</div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No recent detections</p>
            <p className="text-sm text-gray-500 mt-1">Start detecting to see activity here</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
