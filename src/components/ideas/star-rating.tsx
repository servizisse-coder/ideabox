'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

export function StarRating({ 
  value, 
  onChange, 
  readonly = false, 
  size = 'md',
  label 
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0)

  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }

  const handleClick = (rating: number) => {
    if (!readonly && onChange) {
      onChange(rating)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <span className="text-xs font-medium text-gray-500">{label}</span>
      )}
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= (hoverValue || value)
          return (
            <button
              key={star}
              type="button"
              disabled={readonly}
              onClick={() => handleClick(star)}
              onMouseEnter={() => !readonly && setHoverValue(star)}
              onMouseLeave={() => !readonly && setHoverValue(0)}
              className={cn(
                "transition-colors",
                readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
              )}
            >
              <Star
                className={cn(
                  sizes[size],
                  "transition-colors",
                  filled
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-transparent text-gray-300"
                )}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
