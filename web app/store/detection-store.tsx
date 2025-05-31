"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

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

interface DetectionStore {
  detections: Detection[]
  recentDetections: Detection[]
  stats: {
    totalDetections: number
    avgConfidence: number
  }
  isLoading: boolean
  error: string | null
  addDetection: (detection: Detection) => void
  removeDetection: (id: string) => void
  clearHistory: () => void
  loadHistory: () => Promise<void>
  clearError: () => void
}

export const useDetectionStore = create<DetectionStore>()(
  persist(
    (set, get) => ({
      detections: [],
      recentDetections: [],
      stats: {
        totalDetections: 0,
        avgConfidence: 0,
      },
      isLoading: false,
      error: null,

      addDetection: (detection) => {
        set((state) => {
          const newDetections = [detection, ...state.detections]
          const recentDetections = newDetections
            .filter((d) => new Date(d.timestamp).getTime() > Date.now() - 3600000) // Last hour
            .slice(0, 10)

          const totalDetections = newDetections.length
          const avgConfidence =
            newDetections.length > 0
              ? newDetections.reduce((sum, d) => {
                  const maxConf = Math.max(...(d.confidence_scores || [0]))
                  return sum + maxConf
                }, 0) / newDetections.length
              : 0

          return {
            detections: newDetections,
            recentDetections,
            stats: {
              totalDetections,
              avgConfidence,
            },
            error: null, // Clear any previous errors when adding new detection
          }
        })
      },

      removeDetection: (id) => {
        set((state) => {
          const newDetections = state.detections.filter((d) => d.id !== id)
          const recentDetections = newDetections
            .filter((d) => new Date(d.timestamp).getTime() > Date.now() - 3600000)
            .slice(0, 10)

          const totalDetections = newDetections.length
          const avgConfidence =
            newDetections.length > 0
              ? newDetections.reduce((sum, d) => {
                  const maxConf = Math.max(...(d.confidence_scores || [0]))
                  return sum + maxConf
                }, 0) / newDetections.length
              : 0

          return {
            detections: newDetections,
            recentDetections,
            stats: {
              totalDetections,
              avgConfidence,
            },
          }
        })
      },

      clearHistory: () => {
        set({
          detections: [],
          recentDetections: [],
          stats: {
            totalDetections: 0,
            avgConfidence: 0,
          },
          error: null,
        })
      },

      loadHistory: async () => {
        // Don't attempt to load if we're not in a browser environment
        if (typeof window === "undefined") {
          return
        }

        set({ isLoading: true, error: null })

        try {
          // Add a timeout to the fetch request
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

          const response = await fetch("http://localhost:8000/history", {
            signal: controller.signal,
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const history = await response.json()

          set((state) => {
            const recentDetections = history
              .filter((d: Detection) => new Date(d.timestamp).getTime() > Date.now() - 3600000)
              .slice(0, 10)

            const totalDetections = history.length
            const avgConfidence =
              history.length > 0
                ? history.reduce((sum: number, d: Detection) => {
                    const maxConf = Math.max(...(d.confidence_scores || [0]))
                    return sum + maxConf
                  }, 0) / history.length
                : 0

            return {
              detections: history,
              recentDetections,
              stats: {
                totalDetections,
                avgConfidence,
              },
              isLoading: false,
              error: null,
            }
          })

          console.log(`Loaded ${history.length} detection records from backend`)
        } catch (error) {
          console.warn("Backend not available, using local data:", error)

          // Set error state but don't throw - app should continue working
          set((state) => {
            // Calculate stats from existing local data
            const totalDetections = state.detections.length
            const avgConfidence =
              state.detections.length > 0
                ? state.detections.reduce((sum, d) => {
                    const maxConf = Math.max(...(d.confidence_scores || [0]))
                    return sum + maxConf
                  }, 0) / state.detections.length
                : 0

            const recentDetections = state.detections
              .filter((d) => new Date(d.timestamp).getTime() > Date.now() - 3600000)
              .slice(0, 10)

            return {
              ...state,
              recentDetections,
              stats: {
                totalDetections,
                avgConfidence,
              },
              isLoading: false,
              error: error instanceof Error ? error.message : "Backend connection failed",
            }
          })
        }
      },

      clearError: () => {
        set({ error: null })
      },
    }),
    {
      name: "detection-store",
      partialize: (state) => ({
        detections: state.detections.slice(0, 100), // Keep only last 100 detections in storage
      }),
    },
  ),
)
