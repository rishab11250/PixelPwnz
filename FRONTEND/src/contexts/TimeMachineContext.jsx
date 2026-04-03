import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';

import { api } from '../lib/api.js';

const TimeMachineContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components -- colocated hook for this provider
export function useTimeMachine() {
  return useContext(TimeMachineContext);
}

const TEN_MS = 10 * 24 * 60 * 60 * 1000;

/** If the scrubber is within this many ms of the old max, treat as "live" and follow new data. */
const LIVE_EDGE_MS = 3000;

/** How often to pull wall-clock forward so new snapshots stay reachable. */
const MAX_TIME_SYNC_MS = 30_000;

export function TimeMachineProvider({ children }) {
  const [clock, setClock] = useState(() => {
    const t = Date.now();
    return { minTime: t - TEN_MS, maxTime: t, simulatedTime: t };
  });
  const { minTime, maxTime, simulatedTime } = clock;

  const setSimulatedTime = useCallback((updater) => {
    setClock((c) => ({
      ...c,
      simulatedTime: typeof updater === 'function' ? updater(c.simulatedTime) : updater,
    }));
  }, []);

  const [isPlaying, setIsPlaying] = useState(false);
  const playIntervalRef = useRef(null);

  // Align scrubber to real DB range (single cheap aggregation) — biggest UX win vs empty rails.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const b = await api.getTimeBounds();
        if (cancelled || !b?.minTimestamp || !b?.maxTimestamp) return;
        const minT = new Date(b.minTimestamp).getTime();
        const rawMax = new Date(b.maxTimestamp).getTime();
        const now = Date.now();
        const maxT = Math.max(rawMax, now);
        if (minT >= maxT) return;
        setClock({
          minTime: minT,
          maxTime: maxT,
          simulatedTime: maxT,
        });
      } catch {
        /* keep default window if API down */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Advance maxTime toward Date.now() so timestamps from cron/live fetches stay ≤ maxTime.
  useEffect(() => {
    const bumpMaxTime = () => {
      setClock((c) => {
        const now = Date.now();
        if (now <= c.maxTime) return c;
        const wasAtLiveEdge = c.simulatedTime >= c.maxTime - LIVE_EDGE_MS;
        return {
          ...c,
          maxTime: now,
          simulatedTime: wasAtLiveEdge ? now : Math.min(c.simulatedTime, now),
        };
      });
    };

    bumpMaxTime();
    const id = setInterval(bumpMaxTime, MAX_TIME_SYNC_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      clearInterval(playIntervalRef.current);
      return;
    }

    const tick = () => {
      setClock((c) => {
        let sim = c.simulatedTime;
        if (sim >= c.maxTime) sim = c.minTime;
        const range = c.maxTime - c.minTime;
        const stepSize = range / 300;
        const next = sim + stepSize;
        if (next >= c.maxTime) {
          setIsPlaying(false);
          return { ...c, simulatedTime: c.maxTime };
        }
        return { ...c, simulatedTime: next };
      });
    };

    playIntervalRef.current = setInterval(tick, 50);
    const t0 = setTimeout(tick, 0);

    return () => {
      clearTimeout(t0);
      clearInterval(playIntervalRef.current);
    };
  }, [isPlaying]);

  const value = useMemo(
    () => ({
      minTime,
      maxTime,
      simulatedTime,
      setSimulatedTime,
      isPlaying,
      setIsPlaying,
    }),
    [minTime, maxTime, simulatedTime, setSimulatedTime, isPlaying],
  );

  return <TimeMachineContext.Provider value={value}>{children}</TimeMachineContext.Provider>;
}
