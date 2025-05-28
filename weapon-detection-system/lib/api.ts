const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export interface DetectionResult {
  id: string
  timestamp: string
  source_type: string
  weapon_count: number
  confidence_scores: number[]
  processing_time: number
  image_path?: string
  class_names: string[]
}

export interface VideoDetectionResult {
  job_id: string
  status: string
  message: string
}

export interface FrameDetectionResult {
  weapon_count: number
  confidence_scores: number[]
  processing_time: number
  detections: Array<{
    x1: number
    y1: number
    x2: number
    y2: number
    confidence: number
    class_id: number
    class_name: string
  }>
  image_bytes: ArrayBuffer
}

// Helper function to handle API errors
async function handleApiResponse(response: Response) {
  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error")
    throw new Error(`API Error (${response.status}): ${errorText}`)
  }
  return response.json()
}

// Helper function to make API calls with timeout and error handling
async function makeApiCall(url: string, options: RequestInit = {}) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000) // Reduced to 5 second timeout

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...options.headers,
      },
    })
    clearTimeout(timeoutId)
    return await handleApiResponse(response)
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error("Request timeout")
      }
      // Don't expose detailed network errors to reduce noise
      throw new Error("Network error")
    }
    throw new Error("Network error")
  }
}

export async function detectImage(file: File, confidence = 0.25): Promise<DetectionResult> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("conf_threshold", confidence.toString())

  return makeApiCall(`${API_BASE_URL}/detect/image`, {
    method: "POST",
    body: formData,
  })
}

export async function detectVideo(file: File, confidence = 0.25, frameSkip = 2): Promise<VideoDetectionResult> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("conf_threshold", confidence.toString())
  formData.append("frame_skip", frameSkip.toString())

  return makeApiCall(`${API_BASE_URL}/detect/video/upload`, {
    method: "POST",
    body: formData,
  })
}

export async function detectFrame(file: File, confidence = 0.25): Promise<FrameDetectionResult> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("conf_threshold", confidence.toString())

  return makeApiCall(`${API_BASE_URL}/detect/frame`, {
    method: "POST",
    body: formData,
  })
}

export async function getDetectionHistory(): Promise<DetectionResult[]> {
  return makeApiCall(`${API_BASE_URL}/history`)
}

export async function deleteDetection(id: string): Promise<void> {
  await makeApiCall(`${API_BASE_URL}/history/${id}`, {
    method: "DELETE",
  })
}

export async function clearHistory(): Promise<void> {
  await makeApiCall(`${API_BASE_URL}/history`, {
    method: "DELETE",
  })
}

export async function getModelInfo(): Promise<{ class_names: Record<number, string>; model_path: string }> {
  return makeApiCall(`${API_BASE_URL}/model/info`)
}

// Health check function to test API connectivity
export async function checkApiHealth(): Promise<boolean> {
  try {
    await makeApiCall(`${API_BASE_URL}/health`)
    return true
  } catch (error) {
    // Don't log health check failures to reduce console noise
    return false
  }
}
