"use client"

import { useState } from 'react'
import Image from 'next/image'

interface ImageWithFallbackProps {
  src: string
  alt: string
  onError?: () => void
}

export default function ImageWithFallback({ src, alt, onError }: ImageWithFallbackProps) {
  const [error, setError] = useState(false)

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-gray-400 p-2">
        <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs text-center">Image unavailable</span>
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover"
      loading="lazy"
      sizes="(max-width: 300px) 100vw, 300px"
      quality={60}
      unoptimized={src.includes('procyon.acadiau.ca')}
      onError={() => {
        setError(true)
        onError?.()
      }}
    />
  )
}