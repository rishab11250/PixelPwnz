import React, { useMemo, useState } from 'react'
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
    <>
      {/* Floating Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200, delay: 0.5 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-100 w-14 h-14 bg-linear-to-br from-amber to-rose border border-edge rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform"
          style={{ boxShadow: '0 0 20px rgba(245,158,11,0.3)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </motion.button>
      )}

      {/* Expanded Timeline Slider */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: 50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-100 w-[90%] max-w-4xl"
          >
            <div className="backdrop-blur-xl bg-bg-overlay/90 border border-edge rounded-2xl shadow-2xl px-6 py-4 flex flex-col gap-3">
              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-bg-hover/50 hover:bg-bg-hover/80 transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    size="iconLg"
                    variant="default"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="hover:scale-105 transition-transform"
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
                  </Button>
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
