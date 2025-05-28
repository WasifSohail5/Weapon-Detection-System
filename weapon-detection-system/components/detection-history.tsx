"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertTriangle, Search, Filter, Trash2, Download, Eye, MoreHorizontal, Calendar, Clock } from "lucide-react"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { useDetection } from "@/contexts/detection-context"
import { deleteDetection, clearHistory } from "@/lib/api"
import { cn } from "@/lib/utils"

export function DetectionHistory() {
  const { detectionHistory, refreshHistory } = useDetection()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [sortBy, setSortBy] = useState("timestamp")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const { toast } = useToast()

  const filteredHistory = detectionHistory
    .filter((detection) => {
      const matchesSearch =
        detection.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        detection.source_type.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesFilter =
        filterType === "all" ||
        (filterType === "weapons" && detection.weapon_count > 0) ||
        (filterType === "safe" && detection.weapon_count === 0) ||
        filterType === detection.source_type.toLowerCase().replace(" ", "-")

      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      let aValue, bValue

      switch (sortBy) {
        case "timestamp":
          aValue = new Date(a.timestamp).getTime()
          bValue = new Date(b.timestamp).getTime()
          break
        case "weapon_count":
          aValue = a.weapon_count
          bValue = b.weapon_count
          break
        case "processing_time":
          aValue = a.processing_time
          bValue = b.processing_time
          break
        default:
          aValue = a.timestamp
          bValue = b.timestamp
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  const handleDeleteDetection = async (id: string) => {
    try {
      await deleteDetection(id)
      await refreshHistory()
      toast({
        title: "Detection Deleted",
        description: "Detection record has been removed.",
      })
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete detection record.",
        variant: "destructive",
      })
    }
  }

  const handleClearHistory = async () => {
    try {
      await clearHistory()
      await refreshHistory()
      toast({
        title: "History Cleared",
        description: "All detection records have been removed.",
      })
    } catch (error) {
      toast({
        title: "Clear Failed",
        description: "Failed to clear detection history.",
        variant: "destructive",
      })
    }
  }

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
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.h1
          className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Detection History
        </motion.h1>
        <motion.p
          className="text-gray-400 text-lg"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          View and manage all weapon detection records
        </motion.p>
      </div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="backdrop-blur-xl bg-black/20 border border-white/10">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search detections..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800/50 border-gray-600 text-white"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="border-gray-600 text-gray-300">
                      <Filter className="mr-2 h-4 w-4" />
                      Filter: {filterType === "all" ? "All" : filterType}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setFilterType("all")}>All Records</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterType("weapons")}>Weapons Detected</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterType("safe")}>Safe/Clean</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterType("image-upload")}>Image Upload</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterType("video-upload")}>Video Upload</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterType("webcam")}>Webcam</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="border-gray-600 text-gray-300">
                      Sort: {sortBy}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setSortBy("timestamp")}>Timestamp</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("weapon_count")}>Weapon Count</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("processing_time")}>Processing Time</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  variant="outline"
                  size="icon"
                  className="border-gray-600 text-gray-300"
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </Button>

                {detectionHistory.length > 0 && (
                  <Button
                    onClick={handleClearHistory}
                    variant="outline"
                    className="border-red-500 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card className="backdrop-blur-xl bg-black/20 border border-white/10">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{detectionHistory.length}</div>
              <div className="text-sm text-gray-400">Total Records</div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-black/20 border border-white/10">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">
                {detectionHistory.filter((d) => d.weapon_count > 0).length}
              </div>
              <div className="text-sm text-gray-400">Weapons Detected</div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-black/20 border border-white/10">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {detectionHistory.filter((d) => d.weapon_count === 0).length}
              </div>
              <div className="text-sm text-gray-400">Safe Records</div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-black/20 border border-white/10">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{filteredHistory.length}</div>
              <div className="text-sm text-gray-400">Filtered Results</div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* History Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="backdrop-blur-xl bg-black/20 border border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Detection Records</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-300">Timestamp</TableHead>
                      <TableHead className="text-gray-300">Source</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Weapons</TableHead>
                      <TableHead className="text-gray-300">Confidence</TableHead>
                      <TableHead className="text-gray-300">Processing</TableHead>
                      <TableHead className="text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.map((detection, index) => (
                      <motion.tr
                        key={detection.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="border-gray-700 hover:bg-white/5"
                      >
                        <TableCell className="text-gray-300">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <div>
                              <div className="text-sm">{new Date(detection.timestamp).toLocaleDateString()}</div>
                              <div className="text-xs text-gray-500">
                                {new Date(detection.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className={getSourceTypeColor(detection.source_type)}>
                            {detection.source_type}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {detection.weapon_count > 0 ? (
                              <>
                                <AlertTriangle className="h-4 w-4 text-red-400" />
                                <span className="text-red-400 font-medium">ALERT</span>
                              </>
                            ) : (
                              <>
                                <div className="h-4 w-4 bg-green-400 rounded-full" />
                                <span className="text-green-400">SAFE</span>
                              </>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="text-white">
                          <span
                            className={cn(
                              "font-medium",
                              detection.weapon_count > 0 ? "text-red-400" : "text-green-400",
                            )}
                          >
                            {detection.weapon_count}
                          </span>
                        </TableCell>

                        <TableCell>
                          {detection.confidence_scores.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {detection.confidence_scores.slice(0, 3).map((score, idx) => (
                                <span key={idx} className="px-1 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">
                                  {(score * 100).toFixed(0)}%
                                </span>
                              ))}
                              {detection.confidence_scores.length > 3 && (
                                <span className="text-xs text-gray-500">+{detection.confidence_scores.length - 3}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-500 text-sm">N/A</span>
                          )}
                        </TableCell>

                        <TableCell className="text-gray-300">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3 text-gray-500" />
                            <span className="text-sm">{detection.processing_time.toFixed(3)}s</span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" />
                                Export
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteDetection(detection.id)}
                                className="text-red-400"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-300 mb-2">No Records Found</h3>
                <p className="text-gray-500">
                  {searchTerm || filterType !== "all"
                    ? "Try adjusting your search or filter criteria."
                    : "Start detecting weapons to see records here."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
