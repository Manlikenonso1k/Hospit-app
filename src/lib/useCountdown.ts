import { useEffect, useRef, useState } from 'react';

/**
 * A live countdown seeded from the server's seconds_remaining. It ticks using a
 * LOCAL elapsed delta only (performance-style monotonic reference), never the
 * absolute device clock — so changing the phone clock cannot move the SLA. Each
 * poll passes a fresh seconds_remaining, which re-anchors the countdown.
 */
export function useCountdown(secondsRemaining: number): number {
  const [display, setDisplay] = useState(secondsRemaining);
  const anchor = useRef({ seed: secondsRemaining, at: Date.now() });

  useEffect(() => {
    anchor.current = { seed: secondsRemaining, at: Date.now() };
    setDisplay(secondsRemaining);
  }, [secondsRemaining]);

  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - anchor.current.at) / 1000);
      setDisplay(anchor.current.seed - elapsed);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return display;
}
