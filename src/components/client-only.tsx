"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

/**
 * Renders children only on the client side to prevent hydration errors
 */
export function ClientOnly({
  children,
  showLoader = true
}: {
  children: React.ReactNode
  showLoader?: boolean
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    if (!showLoader) return null

    return (
      <div className="flex items-center justify-center p-4">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    )
  }

  return <>{children}</>
}