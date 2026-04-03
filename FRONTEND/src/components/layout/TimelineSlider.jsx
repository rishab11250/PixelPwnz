import React from 'react';
import { useTimeMachine } from '../../contexts/TimeMachineContext.jsx';
import { motion } from 'motion/react';

export default function TimelineSlider() {
  const {
    minTime,
    maxTime,
    simulatedTime,
    setSimulatedTime,
    isPlaying,
    setIsPlaying
  } = useTimeMachine();

  const handleSliderChange = (e) => {
    // If playing, maybe pause it? 
    // setIsPlaying(false); // Let user scrub freely
    setSimulatedTime(Number(e.target.value));
  };

  const pct = ((simulatedTime - minTime) / (maxTime - minTime)) * 100;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-4xl">
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200, delay: 0.2 }}
        className="backdrop-blur-xl bg-bg-overlay/90 border border-edge rounded-2xl shadow-2xl px-6 py-4 flex flex-col gap-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-amber text-black hover:scale-105 transition-transform shadow-[0_0_15px_rgba(245,158,11,0.4)]"
            >
              {isPlaying ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="ml-1">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
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

        <div className="relative flex items-center h-4 group cursor-pointer">
          {/* Custom track */}
          <div className="absolute w-full h-1.5 bg-bg-raised rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber shadow-[0_0_10px_#f59e0b]"
              style={{ width: `${pct}%` }}
            />
          </div>
          {/* Invisible real range input */}
          <input
            type="range"
            min={minTime}
            max={maxTime}
            value={simulatedTime}
            onChange={handleSliderChange}
            className="absolute z-10 w-full h-full opacity-0 cursor-pointer"
          />
          {/* Custom thumb just for visual */}
          <div 
            className="absolute h-4 w-4 rounded-full bg-white shadow-md border-2 border-amber transition-transform group-hover:scale-125"
            style={{ left: `calc(${pct}% - 8px)` }}
          />
        </div>
      </motion.div>
    </div>
  );
}
