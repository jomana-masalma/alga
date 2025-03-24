"use client"

import { useState } from "react"
import { Button } from "@/components/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/dropdown-menu"
import { ChevronDown } from "lucide-react"
import { parseProducers } from "@/lib/data-processor"

interface ExpandableCellProps {
  content: string | string[]
  maxLength?: number
  className?: string
}

export default function ExpandableCell({ 
  content, 
  maxLength = 50,
  className = "" 
}: ExpandableCellProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Handle different content types using consistent parsing logic
  const items: string[] = Array.isArray(content) 
    ? content 
    : typeof content === 'string'
      ? parseProducers(content) // Use parseProducers for all string content
      : []

  // If content is empty or just a dash
  if (!items.length || (items.length === 1 && (items[0] === '-' || !items[0]))) {
    return <span className={className}>-</span>
  }

  // If we have a single item that's not too long, just show it
  if (items.length === 1 && items[0].length <= maxLength) {
    return <span className={className}>{items[0]}</span>
  }

  // For text that's too long but not a list
  if (items.length === 1 && items[0].length > maxLength) {
    const displayText = isExpanded ? items[0] : `${items[0].substring(0, maxLength)}...`
    
    return (
      <div className={`flex items-center ${className}`}>
        <span className={isExpanded ? "" : "truncate"}>
          {displayText}
        </span>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 px-2 ml-1"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "Less" : "More"}
        </Button>
      </div>
    )
  }

  // For lists with multiple items, show only the first item followed by dropdown
  // This matches the UI pattern shown in the example image
  return (
    <div className={`flex items-center ${className}`}>
      <span className="truncate mr-2">{items[0]}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 px-2">
            +{items.length - 1} <ChevronDown className="ml-1 h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[250px] max-h-[300px] overflow-y-auto">
          {items.map((item, idx) => (
            <DropdownMenuItem key={idx} className="py-2">
              {item}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
