import React, { useRef, Fragment, useState, useEffect } from 'react'
import { Menu, Popover, Transition } from '@headlessui/react'
import { ChevronDownIcon, GripVerticalIcon } from 'lucide-react'
import { ToolbarButton, ToolbarDropdownButton } from './ToolbarButton'
import type { TrendLine } from '~/types'

export type LineStyle = 'solid' | 'dashed' | 'dotted'
export type LineThickness = 1 | 2 | 3 | 4

export interface LineSettings {
  color: string
  style: LineStyle
  thickness: LineThickness
  extendLeft: boolean
  extendRight: boolean
}

interface ChartLineToolbarProps {
  trendLine: TrendLine | null
  onUpdateSettings: (settings: Partial<LineSettings>) => void
  onDelete: () => void
  isVisible: boolean
}

const LinePreview: React.FC<{ color: string; style: LineStyle; thickness: number; compact?: boolean }> = ({ color, style, thickness, compact = false }) => (
  <div
    className={compact ? "w-6" : "w-12"}
    style={{
      borderTopColor: color,
      borderTopWidth: thickness,
      borderTopStyle: style,
    }}
  />
)

export const ChartLineToolbar: React.FC<ChartLineToolbarProps> = ({
  trendLine,
  onUpdateSettings,
  onDelete,
  isVisible,
}) => {
  const colorInputRef = useRef<HTMLInputElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [position, setPosition] = useState({ x: 50, y: 12 }) // Default position (centered horizontally, 12px from top)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 })

  // Check for mobile screen and set initial position
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 640
      setIsMobile(mobile)
      if (mobile) {
        setPosition({ x: 12, y: 12 }) // Position at left edge on mobile
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (!isDragging || !toolbarRef.current) return

      const parent = toolbarRef.current.parentElement
      if (!parent) return

      const parentRect = parent.getBoundingClientRect()
      const toolbarRect = toolbarRef.current.getBoundingClientRect()
      
      // Calculate new position relative to parent
      const deltaX = clientX - dragStart.x
      const deltaY = clientY - dragStart.y
      
      let newX = startPosition.x + deltaX
      let newY = startPosition.y + deltaY
      
      // Allow partial clipping on left and right edges
      // Keep at least the grab handles visible (about 30px)
      const minVisibleWidth = 30
      const maxX = parentRect.width - minVisibleWidth
      const maxY = parentRect.height - toolbarRect.height - 16
      
      newX = Math.max(-toolbarRect.width + minVisibleWidth, Math.min(newX, maxX))
      newY = Math.max(12, Math.min(newY, maxY))
      
      setPosition({ x: newX, y: newY })
    }

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        e.preventDefault() // Prevent scrolling while dragging
        const touch = e.touches[0]
        handleMove(touch.clientX, touch.clientY)
      }
    }

    const handleEnd = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleEnd)
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleEnd)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleEnd)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleEnd)
      }
    }
  }, [isDragging, dragStart, startPosition])

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    setIsDragging(true)
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    
    setDragStart({ x: clientX, y: clientY })
    setStartPosition(position)
  }

  if (!isVisible || !trendLine) return null

  const quickColors = [
    '#10b981', // emerald
    '#3b82f6', // blue
    '#ef4444', // red
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#06b6d4', // cyan
    '#e5e5e5', // gray
  ]

  const currentSettings: LineSettings = {
    color: trendLine.color || '#3b82f6',
    style: (trendLine.style as LineStyle) || 'solid',
    thickness: (trendLine.lineWidth as LineThickness) || 2,
    extendLeft: trendLine.extendLeft || false,
    extendRight: trendLine.extendRight || false,
  }

  const handleQuickColor = (color: string) => {
    onUpdateSettings({ color })
  }

  const styleLabel = (s: LineStyle) => s.charAt(0).toUpperCase() + s.slice(1)

  return (
    <div 
      ref={toolbarRef}
      className="absolute z-[60] pointer-events-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div className={`flex items-center rounded-md border border-gray-700 bg-black/90 shadow-lg backdrop-blur pointer-events-auto ${isDragging ? 'cursor-grabbing opacity-90' : ''}`}>
        {/* Drag Handle */}
        <div
          className={`flex items-center px-1 py-1 hover:bg-gray-800 rounded-l-md transition-colors border-r border-gray-700 ${
            isDragging ? 'cursor-grabbing bg-gray-800' : 'cursor-grab'
          }`}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          title="Drag to reposition"
        >
          <GripVerticalIcon className={`h-4 w-4 ${isDragging ? 'text-gray-300' : 'text-gray-400 hover:text-gray-300'}`} />
        </div>
        
        {/* Toolbar Controls */}
        <div className={`flex items-center ${isMobile ? 'gap-1 px-1' : 'gap-2 px-2'} py-1`}>
          {/* Line Color */}
          <Popover className="relative">
            <Popover.Button as={ToolbarDropdownButton} title="Line color" className={isMobile ? 'px-1' : ''}>
              <span
                className="h-4 w-4 rounded"
                style={{ backgroundColor: currentSettings.color }}
                aria-label="Current line color"
              />
              {!isMobile && <span className="hidden sm:inline">Color</span>}
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </Popover.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Popover.Panel className="absolute left-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-md shadow-xl z-[200]">
                <div className="p-3 space-y-3">
                  <div className="text-xs text-gray-300">Pick color</div>
                  <div className="grid grid-cols-7 gap-2">
                    {quickColors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className="h-5 w-5 rounded-full ring-1 ring-white/10 hover:ring-2 hover:ring-white/40 transition-all"
                        style={{ backgroundColor: c }}
                        onClick={() => handleQuickColor(c)}
                        aria-label={`Choose ${c}`}
                        title={c}
                      />
                    ))}
                  </div>
                  <input
                    ref={colorInputRef}
                    type="color"
                    value={currentSettings.color}
                    onChange={(e) => onUpdateSettings({ color: e.target.value })}
                    className="h-8 w-full cursor-pointer bg-transparent"
                    aria-label="Line color picker"
                  />
                </div>
              </Popover.Panel>
            </Transition>
          </Popover>

          {/* Line Style */}
          <Menu as="div" className="relative">
            <Menu.Button as={ToolbarDropdownButton} title={`Style: ${styleLabel(currentSettings.style)}`} className={isMobile ? 'px-1' : ''}>
              <LinePreview color={currentSettings.color} style={currentSettings.style} thickness={currentSettings.thickness} compact={isMobile} />
              <ChevronDownIcon className="h-4 w-4" />
            </Menu.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute left-0 mt-2 w-40 bg-gray-800 border border-gray-700 rounded-md shadow-xl z-[200]">
              <div className="p-1">
                <div className="px-2 py-1 text-xs text-gray-400">Line style</div>
                {(['solid', 'dashed', 'dotted'] as LineStyle[]).map((s) => (
                  <Menu.Item key={s}>
                    {({ active }) => (
                      <button
                        onClick={() => onUpdateSettings({ style: s })}
                        className={`${
                          active ? 'bg-gray-700' : ''
                        } group flex items-center w-full px-2 py-2 text-sm text-white rounded`}
                      >
                        <div className="mr-3">
                          <LinePreview color={currentSettings.color} style={s} thickness={currentSettings.thickness} />
                        </div>
                        {styleLabel(s)}
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </div>
            </Menu.Items>
          </Transition>
        </Menu>

          {/* Thickness */}
          <Menu as="div" className="relative">
            <Menu.Button as={ToolbarDropdownButton} title={`Thickness: ${currentSettings.thickness}px`} className={isMobile ? 'px-1' : ''}>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={currentSettings.thickness} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
              </svg>
              {!isMobile && <span className="text-xs">{currentSettings.thickness}</span>}
              <ChevronDownIcon className="h-4 w-4" />
            </Menu.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute left-0 mt-2 w-32 bg-gray-800 border border-gray-700 rounded-md shadow-xl z-[200]">
              <div className="p-1">
                <div className="px-2 py-1 text-xs text-gray-400">Line thickness</div>
                {[1, 2, 3, 4].map((t) => (
                  <Menu.Item key={t}>
                    {({ active }) => (
                      <button
                        onClick={() => onUpdateSettings({ thickness: t as LineThickness })}
                        className={`${
                          active ? 'bg-gray-700' : ''
                        } group flex items-center w-full px-2 py-2 text-sm text-white rounded`}
                      >
                        <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" strokeWidth={t} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                        </svg>
                        {t}px
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </div>
            </Menu.Items>
          </Transition>
        </Menu>

          {/* Extend */}
          <Menu as="div" className="relative">
            <Menu.Button as={ToolbarDropdownButton} title="Extend line" className={isMobile ? 'px-1' : ''}>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <ChevronDownIcon className="h-4 w-4" />
            </Menu.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute left-0 mt-2 w-40 bg-gray-800 border border-gray-700 rounded-md shadow-xl z-[200]">
              <div className="p-1">
                <div className="px-2 py-1 text-xs text-gray-400">Extend line</div>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => onUpdateSettings({ extendLeft: !currentSettings.extendLeft })}
                      className={`${
                        active ? 'bg-gray-700' : ''
                      } group flex items-center justify-between w-full px-2 py-2 text-sm text-white rounded`}
                    >
                      <span>Extend left</span>
                      {currentSettings.extendLeft && (
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => onUpdateSettings({ extendRight: !currentSettings.extendRight })}
                      className={`${
                        active ? 'bg-gray-700' : ''
                      } group flex items-center justify-between w-full px-2 py-2 text-sm text-white rounded`}
                    >
                      <span>Extend right</span>
                      {currentSettings.extendRight && (
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>

          {/* Delete */}
          <ToolbarButton
            onClick={onDelete}
            variant="danger"
            title="Delete line"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </ToolbarButton>
        </div>
        
        {/* Right Drag Handle */}
        <div
          className={`flex items-center px-1 py-1 hover:bg-gray-800 rounded-r-md transition-colors border-l border-gray-700 ${
            isDragging ? 'cursor-grabbing bg-gray-800' : 'cursor-grab'
          }`}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          title="Drag to reposition"
        >
          <GripVerticalIcon className={`h-4 w-4 ${isDragging ? 'text-gray-300' : 'text-gray-400 hover:text-gray-300'}`} />
        </div>
      </div>
    </div>
  )
}