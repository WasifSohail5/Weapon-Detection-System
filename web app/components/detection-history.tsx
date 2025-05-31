"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, Search, Filter, Trash2, Download, Eye } from "lucide-react"
import { useDetectionStore } from "@/store/detection-store"
import { formatDistanceToNow, format } from "date-fns"

export default function DetectionHistory() {
  const { detections, removeDetection, clearHistory } = useDetectionStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterSource, setFilterSource] = useState("all")
  const [filterWeapons, setFilterWeapons] = useState("all")
  const [sortBy, setSortBy] = useState("newest")

  const filteredDetections = detections
    .filter((detection) => {
      const matchesSearch =
        detection.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        detection.class_names.some((name) => name.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesSource = filterSource === "all" || detection.source_type === filterSource
      const matchesWeapons =
        filterWeapons === "all" ||
        (filterWeapons === "weapons" && detection.weapon_count > 0) ||
        (filterWeapons === "no-weapons" && detection.weapon_count === 0)

      return matchesSearch && matchesSource && matchesWeapons
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        case "oldest":
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        case "confidence":
          const aMax = Math.max(...(a.confidence_scores || [0]))
          const bMax = Math.max(...(b.confidence_scores || [0]))
          return bMax - aMax
        case "weapons":
          return b.weapon_count - a.weapon_count
        default:
          return 0
      }
    })

  const handleDeleteDetection = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:8000/history/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        removeDetection(id)
      }
    } catch (error) {
      console.error("Error deleting detection:", error)
    }
  }

  const handleClearHistory = async () => {
    try {
      const response = await fetch("http://localhost:8000/history", {
        method: "DELETE",
      })

      if (response.ok) {
        clearHistory()
      }
    } catch (error) {
      console.error("Error clearing history:", error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Filter className="h-5 w-5 text-blue-500" />
            <span>Detection History</span>
          </CardTitle>
          <CardDescription>Browse and manage all weapon detection records</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search detections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <Select value={filterSource} onValueChange={setFilterSource}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="Image Upload">Image Upload</SelectItem>
                <SelectItem value="Video Upload">Video Upload</SelectItem>
                <SelectItem value="Webcam">Webcam</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterWeapons} onValueChange={setFilterWeapons}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Detections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Results</SelectItem>
                <SelectItem value="weapons">Weapons Only</SelectItem>
                <SelectItem value="no-weapons">No Weapons</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="confidence">Highest Confidence</SelectItem>
                <SelectItem value="weapons">Most Weapons</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={handleClearHistory}
              variant="destructive"
              className="w-full"
              disabled={detections.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>
              Showing {filteredDetections.length} of {detections.length} detections
            </span>
            <span>{detections.filter((d) => d.weapon_count > 0).length} weapon alerts</span>
          </div>
        </CardContent>
      </Card>

      {/* Detection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDetections.map((detection) => (
          <Card key={detection.id} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge
                  variant={detection.weapon_count > 0 ? "destructive" : "outline"}
                  className={detection.weapon_count > 0 ? "" : "text-green-400 border-green-400"}
                >
                  {detection.weapon_count > 0 ? (
                    <>
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {detection.weapon_count} weapon{detection.weapon_count > 1 ? "s" : ""}
                    </>
                  ) : (
                    "No threats"
                  )}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteDetection(detection.id)}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-white">{detection.source_type}</p>
                <p className="text-xs text-gray-400">
                  {format(new Date(detection.timestamp), "MMM dd, yyyy HH:mm:ss")}
                </p>
                <p className="text-xs text-gray-500">{formatDistanceToNow(new Date(detection.timestamp))} ago</p>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Detection Image */}
              {detection.image_path && (
                <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
                  <img
                    src={`http://localhost:8000/image/${detection.id}`}
                    alt="Detection result"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none"
                    }}
                  />
                </div>
              )}

              {/* Detection Details */}
              <div className="space-y-2">
                {detection.confidence_scores.length > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Max Confidence:</span>
                    <span className="text-white">{(Math.max(...detection.confidence_scores) * 100).toFixed(1)}%</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Processing Time:</span>
                  <span className="text-white">{detection.processing_time.toFixed(2)}s</span>
                </div>

                {detection.class_names.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Detected Classes:</p>
                    <div className="flex flex-wrap gap-1">
                      {detection.class_names.map((className, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {className}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 pt-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <Download className="h-3 w-3 mr-1" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDetections.length === 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="py-12 text-center">
            <div className="text-gray-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No detections found</p>
              <p className="text-sm">Try adjusting your filters or upload some files to analyze</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
