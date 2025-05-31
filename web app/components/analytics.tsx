"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { TrendingUp, Target, Clock, AlertTriangle } from "lucide-react"
import { useDetectionStore } from "@/store/detection-store"
import { format, subDays, eachDayOfInterval } from "date-fns"

export default function Analytics() {
  const { detections } = useDetectionStore()

  // Prepare data for charts
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date(),
  })

  const dailyData = last7Days.map((day) => {
    const dayStr = format(day, "yyyy-MM-dd")
    const dayDetections = detections.filter((d) => format(new Date(d.timestamp), "yyyy-MM-dd") === dayStr)

    return {
      date: format(day, "MMM dd"),
      detections: dayDetections.length,
      weapons: dayDetections.filter((d) => d.weapon_count > 0).length,
      avgConfidence:
        dayDetections.length > 0
          ? dayDetections.reduce((sum, d) => sum + Math.max(...(d.confidence_scores || [0])), 0) / dayDetections.length
          : 0,
    }
  })

  const sourceData = ["Image Upload", "Video Upload", "Webcam"].map((source) => ({
    source,
    count: detections.filter((d) => d.source_type === source).length,
    weapons: detections.filter((d) => d.source_type === source && d.weapon_count > 0).length,
  }))

  const confidenceRanges = [
    { range: "90-100%", count: 0, color: "#ef4444" },
    { range: "80-90%", count: 0, color: "#f97316" },
    { range: "70-80%", count: 0, color: "#eab308" },
    { range: "60-70%", count: 0, color: "#22c55e" },
    { range: "<60%", count: 0, color: "#6b7280" },
  ]

  detections.forEach((detection) => {
    const maxConf = Math.max(...(detection.confidence_scores || [0])) * 100
    if (maxConf >= 90) confidenceRanges[0].count++
    else if (maxConf >= 80) confidenceRanges[1].count++
    else if (maxConf >= 70) confidenceRanges[2].count++
    else if (maxConf >= 60) confidenceRanges[3].count++
    else confidenceRanges[4].count++
  })

  const totalWeapons = detections.reduce((sum, d) => sum + d.weapon_count, 0)
  const avgProcessingTime =
    detections.length > 0 ? detections.reduce((sum, d) => sum + d.processing_time, 0) / detections.length : 0

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Detections</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{detections.length}</div>
            <p className="text-xs text-gray-500">All time</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Weapons Found</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalWeapons}</div>
            <p className="text-xs text-gray-500">
              {detections.length > 0 ? ((totalWeapons / detections.length) * 100).toFixed(1) : 0}% detection rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Avg Processing</CardTitle>
            <Clock className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{avgProcessingTime.toFixed(2)}s</div>
            <p className="text-xs text-gray-500">Per detection</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {dailyData.reduce((sum, day) => sum + day.detections, 0)}
            </div>
            <p className="text-xs text-gray-500">
              {dailyData.reduce((sum, day) => sum + day.weapons, 0)} weapons detected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Detections */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Daily Detection Activity</CardTitle>
            <CardDescription>Detections and weapon alerts over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="detections" fill="#3b82f6" name="Total Detections" />
                <Bar dataKey="weapons" fill="#ef4444" name="Weapon Alerts" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Confidence Distribution */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Confidence Distribution</CardTitle>
            <CardDescription>Detection confidence score ranges</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={confidenceRanges.filter((r) => r.count > 0)}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="count"
                  nameKey="range"
                  label={({ range, count }) => `${range}: ${count}`}
                >
                  {confidenceRanges.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Source Breakdown */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Detection Sources</CardTitle>
            <CardDescription>Breakdown by input source type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sourceData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9ca3af" />
                <YAxis dataKey="source" type="category" stroke="#9ca3af" width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" name="Total" />
                <Bar dataKey="weapons" fill="#ef4444" name="Weapons" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Average Confidence Trend */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Confidence Trend</CardTitle>
            <CardDescription>Average detection confidence over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" domain={[0, 1]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, "Avg Confidence"]}
                />
                <Line
                  type="monotone"
                  dataKey="avgConfidence"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ fill: "#22c55e", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detection Summary */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Detection Summary</CardTitle>
          <CardDescription>Detailed breakdown of all detection activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-white">By Source Type</h4>
              {sourceData.map((source) => (
                <div key={source.source} className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">{source.source}</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {source.count} total
                    </Badge>
                    {source.weapons > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {source.weapons} weapons
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-white">Performance Metrics</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Total Processing Time</span>
                  <span className="text-sm text-white">
                    {detections.reduce((sum, d) => sum + d.processing_time, 0).toFixed(2)}s
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Fastest Detection</span>
                  <span className="text-sm text-white">
                    {detections.length > 0 ? Math.min(...detections.map((d) => d.processing_time)).toFixed(2) : 0}s
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Slowest Detection</span>
                  <span className="text-sm text-white">
                    {detections.length > 0 ? Math.max(...detections.map((d) => d.processing_time)).toFixed(2) : 0}s
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-white">Detection Quality</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">{"High Confidence (>80%)"}</span>
                  <span className="text-sm text-white">
                    {detections.filter((d) => Math.max(...(d.confidence_scores || [0])) > 0.8).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">{"Medium Confidence (60-80%)"}</span>
                  <span className="text-sm text-white">
                    {
                      detections.filter((d) => {
                        const max = Math.max(...(d.confidence_scores || [0]))
                        return max >= 0.6 && max <= 0.8
                      }).length
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">{"Low Confidence (<60%)"}</span>
                  <span className="text-sm text-white">
                    {detections.filter((d) => Math.max(...(d.confidence_scores || [0])) < 0.6).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
