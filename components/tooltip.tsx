'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface TooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  delay?: number
  className?: string
  variant?: 'dark' | 'light'
}

export default function Tooltip({ children, content, delay = 300, className = '', variant = 'dark' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const timeoutRef = useRef<NodeJS.Timeout>()
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
      updatePosition()
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  const updatePosition = () => {
    if (!triggerRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    
    // Estimate tooltip size first
    const estimatedHeight = 200 // reasonable estimate
    const estimatedWidth = 256 // w-64
    
    let top = triggerRect.top - estimatedHeight - 8
    let left = triggerRect.left + (triggerRect.width - estimatedWidth) / 2

    // Keep tooltip on screen
    if (top < 8) {
      top = triggerRect.bottom + 8
    }
    if (left < 8) {
      left = 8
    }
    if (left + estimatedWidth > window.innerWidth - 8) {
      left = window.innerWidth - estimatedWidth - 8
    }

    setPosition({ top, left })
  }

  useEffect(() => {
    if (isVisible) {
      updatePosition()
      window.addEventListener('scroll', updatePosition)
      window.addEventListener('resize', updatePosition)
      
      return () => {
        window.removeEventListener('scroll', updatePosition)
        window.removeEventListener('resize', updatePosition)
      }
    }
  }, [isVisible])

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        className="inline-block"
      >
        {children}
      </div>
      {isVisible && createPortal(
        <div
          ref={tooltipRef}
          className={`fixed z-50 px-3 py-2 text-xs rounded-lg shadow-lg pointer-events-none transition-all duration-200 ${
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          } ${
            variant === 'dark' 
              ? 'bg-gray-800 text-white' 
              : 'bg-white border border-gray-200'
          } ${className}`}
          style={{ top: `${position.top}px`, left: `${position.left}px` }}
        >
          {content}
          {/* Arrow pointing down when tooltip is above */}
          {position.top < triggerRef.current?.getBoundingClientRect().top && (
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 translate-y-full">
              <div className={`w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${
                variant === 'dark' ? 'border-t-gray-800' : 'border-t-white'
              }`}></div>
            </div>
          )}
          {/* Arrow pointing up when tooltip is below */}
          {position.top > triggerRef.current?.getBoundingClientRect().top && (
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 -translate-y-full">
              <div className={`w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent ${
                variant === 'dark' ? 'border-b-gray-800' : 'border-b-white'
              }`}></div>
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  )
}