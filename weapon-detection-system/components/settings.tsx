"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Brain, Palette, Bell, Monitor, Save, RotateCcw } from "lucide-react"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "next-themes"

export function Settings() {
  const [modelSettings, setModelSettings] = useState({
    confidenceThreshold: 0.25,
    frameSkip: 2,
    maxDetections: 10,
    enableGPU: true,
  })

  const [alertSettings, setAlertSettings] = useState({
    enableAlerts: true,
    soundAlerts: false,
    emailNotifications: false,
    alertCooldown: 5,
  })

  const [displaySettings, setDisplaySettings] = useState({
    showBoundingBoxes: true,
    showConfidenceScores: true,
    highlightWeapons: true,
    animateDetections: true,
  })

  const { theme, setTheme } = useTheme()
  const { toast } = useToast()

  const handleSaveSettings = () => {
    // In a real app, you would save these to a backend or local storage
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated successfully.",
    })
  }

  const handleResetSettings = () => {
    setModelSettings({
      confidenceThreshold: 0.25,
      frameSkip: 2,
      maxDetections: 10,
      enableGPU: true,
    })
    setAlertSettings({
      enableAlerts: true,
      soundAlerts: false,
      emailNotifications: false,
      alertCooldown: 5,
    })
    setDisplaySettings({
      showBoundingBoxes: true,
      showConfidenceScores: true,
      highlightWeapons: true,
      animateDetections: true,
    })

    toast({
      title: "Settings Reset",
      description: "All settings have been restored to defaults.",
    })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.h1
          className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Settings
        </motion.h1>
        <motion.p
          className="text-gray-400 text-lg"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Configure detection parameters and system preferences
        </motion.p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Model Configuration */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="backdrop-blur-xl bg-black/20 border border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Brain className="h-5 w-5 text-blue-400" />
                <span>Model Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-white">
                  Confidence Threshold: {modelSettings.confidenceThreshold.toFixed(2)}
                </Label>
                <Slider
                  value={[modelSettings.confidenceThreshold]}
                  onValueChange={(value) => setModelSettings((prev) => ({ ...prev, confidenceThreshold: value[0] }))}
                  max={1}
                  min={0.1}
                  step={0.05}
                  className="w-full"
                />
                <p className="text-xs text-gray-400">Minimum confidence required for weapon detection</p>
              </div>

              <div className="space-y-3">
                <Label className="text-white">Frame Skip: {modelSettings.frameSkip} frames</Label>
                <Slider
                  value={[modelSettings.frameSkip]}
                  onValueChange={(value) => setModelSettings((prev) => ({ ...prev, frameSkip: value[0] }))}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-gray-400">Process every Nth frame for video analysis</p>
              </div>

              <div className="space-y-3">
                <Label className="text-white">Max Detections: {modelSettings.maxDetections}</Label>
                <Slider
                  value={[modelSettings.maxDetections]}
                  onValueChange={(value) => setModelSettings((prev) => ({ ...prev, maxDetections: value[0] }))}
                  max={50}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-gray-400">Maximum number of detections per frame</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-white">GPU Acceleration</Label>
                  <p className="text-xs text-gray-400">Use GPU for faster processing</p>
                </div>
                <Switch
                  checked={modelSettings.enableGPU}
                  onCheckedChange={(checked) => setModelSettings((prev) => ({ ...prev, enableGPU: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Alert Settings */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="backdrop-blur-xl bg-black/20 border border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Bell className="h-5 w-5 text-yellow-400" />
                <span>Alert Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-white">Enable Alerts</Label>
                  <p className="text-xs text-gray-400">Show notifications when weapons are detected</p>
                </div>
                <Switch
                  checked={alertSettings.enableAlerts}
                  onCheckedChange={(checked) => setAlertSettings((prev) => ({ ...prev, enableAlerts: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-white">Sound Alerts</Label>
                  <p className="text-xs text-gray-400">Play audio when weapons are detected</p>
                </div>
                <Switch
                  checked={alertSettings.soundAlerts}
                  onCheckedChange={(checked) => setAlertSettings((prev) => ({ ...prev, soundAlerts: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-white">Email Notifications</Label>
                  <p className="text-xs text-gray-400">Send email alerts for detections</p>
                </div>
                <Switch
                  checked={alertSettings.emailNotifications}
                  onCheckedChange={(checked) => setAlertSettings((prev) => ({ ...prev, emailNotifications: checked }))}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-white">Alert Cooldown: {alertSettings.alertCooldown}s</Label>
                <Slider
                  value={[alertSettings.alertCooldown]}
                  onValueChange={(value) => setAlertSettings((prev) => ({ ...prev, alertCooldown: value[0] }))}
                  max={60}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-gray-400">Minimum time between consecutive alerts</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Display Settings */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="backdrop-blur-xl bg-black/20 border border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Palette className="h-5 w-5 text-purple-400" />
                <span>Display Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-white">Show Bounding Boxes</Label>
                  <p className="text-xs text-gray-400">Draw boxes around detected weapons</p>
                </div>
                <Switch
                  checked={displaySettings.showBoundingBoxes}
                  onCheckedChange={(checked) => setDisplaySettings((prev) => ({ ...prev, showBoundingBoxes: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-white">Show Confidence Scores</Label>
                  <p className="text-xs text-gray-400">Display detection confidence percentages</p>
                </div>
                <Switch
                  checked={displaySettings.showConfidenceScores}
                  onCheckedChange={(checked) =>
                    setDisplaySettings((prev) => ({ ...prev, showConfidenceScores: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-white">Highlight Weapons</Label>
                  <p className="text-xs text-gray-400">Use red highlighting for weapon detections</p>
                </div>
                <Switch
                  checked={displaySettings.highlightWeapons}
                  onCheckedChange={(checked) => setDisplaySettings((prev) => ({ ...prev, highlightWeapons: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-white">Animate Detections</Label>
                  <p className="text-xs text-gray-400">Use smooth animations for detection boxes</p>
                </div>
                <Switch
                  checked={displaySettings.animateDetections}
                  onCheckedChange={(checked) => setDisplaySettings((prev) => ({ ...prev, animateDetections: checked }))}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-white">Theme</Label>
                <div className="flex space-x-2">
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("dark")}
                    className="flex-1"
                  >
                    Dark
                  </Button>
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("light")}
                    className="flex-1"
                  >
                    Light
                  </Button>
                  <Button
                    variant={theme === "system" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("system")}
                    className="flex-1"
                  >
                    System
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* System Information */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="backdrop-blur-xl bg-black/20 border border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Monitor className="h-5 w-5 text-green-400" />
                <span>System Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">API Status:</span>
                  <Badge variant="outline" className="ml-2 border-green-500/30 text-green-400">
                    Connected
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-400">Model:</span>
                  <span className="text-white ml-2">YOLOv8</span>
                </div>
                <div>
                  <span className="text-gray-400">Version:</span>
                  <span className="text-white ml-2">1.0.0</span>
                </div>
                <div>
                  <span className="text-gray-400">GPU:</span>
                  <Badge variant="outline" className="ml-2 border-blue-500/30 text-blue-400">
                    {modelSettings.enableGPU ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-700">
                <h4 className="text-white font-medium mb-2">Performance Metrics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Avg Processing Time:</span>
                    <span className="text-white">0.15s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Detections:</span>
                    <span className="text-white">1,247</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Accuracy Rate:</span>
                    <span className="text-green-400">94.2%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="flex justify-center space-x-4"
      >
        <Button
          onClick={handleSaveSettings}
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
        >
          <Save className="mr-2 h-4 w-4" />
          Save Settings
        </Button>
        <Button
          onClick={handleResetSettings}
          variant="outline"
          className="border-gray-600 text-gray-300 hover:bg-gray-800"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset to Defaults
        </Button>
      </motion.div>
    </div>
  )
}
