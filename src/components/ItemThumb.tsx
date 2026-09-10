import { useState } from 'react'
import { Icon } from './Icon'
import { categoryOf } from '../lib/categories'
import type { CategoryId } from '../types'

interface ItemThumbProps {
  src?: string
  alt: string
  category: CategoryId
  className?: string
  /** px size of the placeholder glyph shown when there is no usable photo. */
  glyphSize?: number
}

/** Photo with a category-glyph placeholder — items are often reported without one. */
export function ItemThumb({ src, alt, category, className = '', glyphSize = 36 }: ItemThumbProps) {
  const [broken, setBroken] = useState(false)

  if (!src || broken) {
    return (
      <div
        className={`flex items-center justify-center bg-surface-container-high text-outline ${className}`}
        role="img"
        aria-label={alt}
      >
        <Icon name={categoryOf(category).icon} size={glyphSize} className="opacity-50" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setBroken(true)}
      className={`object-cover ${className}`}
    />
  )
}
