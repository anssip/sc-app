import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

interface PreviewTimerProps {
  previewStartTime: number
  onExpire?: () => void
}

export default function PreviewTimer({ previewStartTime, onExpire }: PreviewTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<{ minutes: number; seconds: number } | null>(null)

  useEffect(() => {
    const updateTimer = () => {
      const elapsedMs = Date.now() - previewStartTime
      const remainingMs = Math.max(0, (5 * 60 * 1000) - elapsedMs)
      
      if (remainingMs === 0) {
        onExpire?.()
        return
      }
      
      const minutes = Math.floor(remainingMs / 60000)
      const seconds = Math.floor((remainingMs % 60000) / 1000)
      setTimeRemaining({ minutes, seconds })
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    
    return () => clearInterval(interval)
  }, [previewStartTime, onExpire])

  if (!timeRemaining) return null

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
      <Clock className="h-4 w-4 text-yellow-500" />
      <span className="text-sm text-yellow-500 font-medium">
        Preview: {timeRemaining.minutes}:{String(timeRemaining.seconds).padStart(2, '0')}
      </span>
    </div>
  )
}