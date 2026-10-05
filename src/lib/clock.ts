import { useEffect, useReducer, useRef } from 'react';
import { AccessibilityInfo, Animated } from 'react-native';

/**
 * Server-authoritative clock. The board syncs the offset from each payload's
 * server_time, and everything reads time through serverNow() — so changing the
 * device clock never moves an SLA. A SINGLE 1s interval drives every card's
 * countdown (not one timer per card).
 */
let offsetMs = 0;

export function syncServerTime(serverTimeIso: string | undefined): void {
  if (!serverTimeIso) return;
  const server = new Date(serverTimeIso).getTime();
  if (!Number.isNaN(server)) offsetMs = server - Date.now();
}

export function serverNow(): number {
  return Date.now() + offsetMs;
}

// One shared ticker: subscribers re-render together each second.
const listeners = new Set<() => void>();
let interval: ReturnType<typeof setInterval> | null = null;

function ensureInterval(): void {
  if (interval) return;
  interval = setInterval(() => {
    listeners.forEach((fn) => fn());
  }, 1000);
}

function maybeStopInterval(): void {
  if (interval && listeners.size === 0) {
    clearInterval(interval);
    interval = null;
  }
}

/** Re-renders the caller once per second; returns the server-adjusted now (ms). */
export function useTick(): number {
  const [, force] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    listeners.add(force);
    ensureInterval();
    return () => {
      listeners.delete(force);
      maybeStopInterval();
    };
  }, []);

  return serverNow();
}

/**
 * One shared, looping opacity value that drives every overdue "!" together.
 * Honors Reduce Motion (stays fully opaque, no animation).
 */
export function useOverduePulse(): Animated.Value {
  const value = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let cancelled = false;
    let loop: Animated.CompositeAnimation | null = null;

    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled || reduce) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(value, { toValue: 0.25, duration: 450, useNativeDriver: true }),
          Animated.timing(value, { toValue: 1, duration: 450, useNativeDriver: true }),
        ]),
      );
      loop.start();
    });

    return () => {
      cancelled = true;
      loop?.stop();
    };
  }, [value]);

  return value;
}
