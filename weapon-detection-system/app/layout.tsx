import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { DetectionProvider } from "@/contexts/detection-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Weapon Detection System",
  description: "Advanced AI-powered weapon detection and security monitoring system",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <DetectionProvider>
            {children}
            <Toaster />
          </DetectionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
