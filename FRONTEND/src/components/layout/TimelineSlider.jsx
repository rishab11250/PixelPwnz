import React, { useMemo, useState, useRef, useEffect } from 'react'
import { useTimeMachine } from '../../contexts/TimeMachineContext.jsx'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from '../ui/button.jsx'
import { Slider } from '../ui/slider.jsx'

export default function TimelineSlider() {
  const [isOpen, setIsOpen] = useState(false)
  const {
    minTime,
    maxTime,
    simulatedTime,
    setSimulatedTime,
    isPlaying,
    setIsPlaying,
  } = useTimeMachine()

  const span = Math.max(1, maxTime - minTime)
  const step = useMemo(
    () => Math.max(1, Math.min(60_000, Math.floor(span / 500))),
    [span],
  )

  const sliderMin = minTime
  const sliderMax = maxTime <= minTime ? minTime + 1 : maxTime
  const sliderValue = Math.min(sliderMax, Math.max(sliderMin, simulatedTime))

  return (
    <div 
      className="fixed bottom-6 right-6 z-100"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <AnimatePresence>
        {!isOpen ? (
          // Floating Button
          <motion.button
            key="button"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200, delay: 0.5 }}
            className="w-14 h-14 bg-linear-to-br from-amber to-rose border border-edge rounded-full shadow-2xl flex items-center justify-center"
            style={{ 
              boxShadow: '0 0 20px rgba(245,158,11,0.3)',
              background: 'linear-gradient(135deg, #f59e0b 0%, #fb7185 100%)'
            }}
            whileHover={{ 
              scale: 1.1,
              boxShadow: '0 0 30px rgba(245,158,11,0.5)'
            }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="white" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              animate={{ rotate: isPlaying ? 360 : 0 }}
              transition={{ duration: 2, repeat: isPlaying ? Infinity : 0, ease: 'linear' }}
            >
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </motion.svg>
          </motion.button>
        ) : (
          // Full Slider Panel
          <motion.div
            key="slider"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="backdrop-blur-xl bg-bg-overlay/90 border border-edge rounded-2xl shadow-2xl px-6 py-4 flex flex-col gap-3"
            style={{
              width: '90vw',
              maxWidth: '800px',
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              transform: 'translateX(0)',
              boxShadow: '0 0 40px rgba(245,158,11,0.2)',
              background: 'linear-gradient(135deg, rgba(24,24,27,0.95) 0%, rgba(28,28,31,0.95) 100%)'
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    type="button"
                    size="iconLg"
                    variant="default"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="hover:scale-105 transition-transform bg-amber hover:bg-amber/80 text-white border-amber/30"
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b 0%, #fb7185 100%)'
                    }}
                  >
                    <motion.div
                      animate={{ rotate: isPlaying ? 360 : 0 }}
                      transition={{ duration: 2, repeat: isPlaying ? Infinity : 0, ease: 'linear' }}
                    >
                      {isPlaying ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5" aria-hidden>
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </motion.div>
                  </Button>
                </motion.div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Simulated Time</span>
                  <span className="text-sm font-mono font-bold text-amber">
                    {new Date(simulatedTime).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="text-right text-xs text-text-muted flex flex-col">
                <span>Now:</span>
                <span className="font-mono">{new Date(maxTime).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="relative flex min-h-6 w-full items-center pt-1">
              <Slider
                min={sliderMin}
                max={sliderMax}
                step={step}
                value={[sliderValue]}
                onValueChange={(v) => setSimulatedTime(v[0])}
                disabled={maxTime <= minTime}
                className="w-full cursor-pointer"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
