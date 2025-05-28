"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { useDetection } from "@/contexts/detection-context"
import { TrendingUp } from "lucide-react"

export function DetectionChart() {
  const { detectionHistory } = useDetection()

  // Prepare data for charts
  const dailyData = detectionHistory.reduce(
    (acc, detection) => {
      const date = new Date(detection.timestamp).toLocaleDateString()
      if (!acc[date]) {
        acc[date] = { date, weapons: 0, total: 0 }
      }
      acc[date].total += 1
      acc[date].weapons += detection.weapon_count
      return acc
    },
    {} as Record<string, { date: string; weapons: number; total: number }>,
  )

  const chartData = Object.values(dailyData).slice(-7) // Last 7 days

  const sourceData = detectionHistory.reduce(
    (acc, detection) => {
      const source = detection.source_type
      if (!acc[source]) {
        acc[source] = { name: source, value: 0, weapons: 0 }
      }
      acc[source].value += 1
      acc[source].weapons += detection.weapon_count > 0 ? 1 : 0
      return acc
    },
    {} as Record<string, { name: string; value: number; weapons: number }>,
  )

  const pieData = Object.values(sourceData)

  const COLORS = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B"]

  return (
    <Card className="backdrop-blur-xl bg-black/20 border border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-blue-400" />
          <span>Detection Analytics</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Daily Detections Bar Chart */}
        <div>
          <h3 className="text-white font-medium mb-4">Daily Detection Trends</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  color: "#F3F4F6",
                }}
              />
              <Bar dataKey="total" fill="#3B82F6" name="Total Detections" />
              <Bar dataKey="weapons" fill="#EF4444" name="Weapons Found" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Source Distribution Pie Chart */}
        <div>
          <h3 className="text-white font-medium mb-4">Detection Sources</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  color: "#F3F4F6",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
