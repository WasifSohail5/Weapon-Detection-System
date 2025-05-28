"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { getDetectionHistory } from "@/lib/api"

interface Detection {
  id: string
  timestamp: string
  source_type: string
  weapon_count: number
  confidence_scores: number[]
  processing_time: number
  image_path?: string
  class_names: string[]
}

interface DetectionContextType {
  detectionHistory: Detection[]
  isLoading: boolean
  error: string | null
  refreshHistory: () => Promise<void>
}

const DetectionContext = createContext<DetectionContextType | undefined>(undefined)

// Mock data for development/demo purposes
const mockDetections: Detection[] = [
  {
    id: "1",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    source_type: "Image Upload",
    weapon_count: 1,
    confidence_scores: [0.87],
    processing_time: 0.234,
    class_names: ["weapon"],
  },
  {
    id: "2",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    source_type: "Webcam",
    weapon_count: 0,
    confidence_scores: [],
    processing_time: 0.156,
    class_names: [],
  },
  {
    id: "3",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
    source_type: "Video Upload",
    weapon_count: 2,
    confidence_scores: [0.92, 0.78],
    processing_time: 1.432,
    class_names: ["weapon", "weapon"],
  },
  {
    id: "4",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
    source_type: "Image Upload",
    weapon_count: 0,
    confidence_scores: [],
    processing_time: 0.198,
    class_names: [],
  },
  {
    id: "5",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
    source_type: "Webcam",
    weapon_count: 1,
    confidence_scores: [0.65],
    processing_time: 0.287,
    class_names: ["weapon"],
  },
]

export function DetectionProvider({ children }: { children: ReactNode }) {
  const [detectionHistory, setDetectionHistory] = useState<Detection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isApiAvailable, setIsApiAvailable] = useState<boolean | null>(null)

  const refreshHistory = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Try to fetch from API first
      const history = await getDetectionHistory()
      setDetectionHistory(history)
      setIsApiAvailable(true)
    } catch (error) {
      // Only log the first time we detect API is unavailable
      if (isApiAvailable !== false) {
        console.warn("API not available, switching to demo mode")
      }

      setIsApiAvailable(false)
      setError("API connection failed - using demo data")

      // Fall back to mock data for demo purposes
      setDetectionHistory(mockDetections)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshHistory()

    // Only set up polling if API is available, otherwise check less frequently
    const interval = setInterval(
      () => {
        if (isApiAvailable === false) {
          // Check API availability every 5 minutes when in demo mode
          refreshHistory().catch(() => {
            // Silently handle errors in background refresh
          })
        } else {
          // Normal refresh every 30 seconds when API is working
          refreshHistory().catch(() => {
            // Silently handle errors in background refresh
          })
        }
      },
      isApiAvailable === false ? 300000 : 30000,
    ) // 5 minutes vs 30 seconds

    return () => clearInterval(interval)
  }, [isApiAvailable])

  return (
    <DetectionContext.Provider
      value={{
        detectionHistory,
        isLoading,
        error,
        refreshHistory,
      }}
    >
      {children}
    </DetectionContext.Provider>
  )
}

export function useDetection() {
  const context = useContext(DetectionContext)
  if (context === undefined) {
    throw new Error("useDetection must be used within a DetectionProvider")
  }
  return context
}
