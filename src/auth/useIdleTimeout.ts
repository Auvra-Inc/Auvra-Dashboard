import { useEffect, useRef } from "react";

const ACTIVITY_KEY = "auvra_last_activity";
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "wheel"] as const;

// PRD §5: sessions end after 30 minutes of inactivity. Activity is shared across tabs via localStorage.
export function useIdleTimeout(timeoutMs: number, onTimeout: () => void) {
  const onTimeoutRef = useRef(onTimeout);
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    let lastWrite = 0;
    const markActive = () => {
      const now = Date.now();
      // Throttle writes; mousemove fires constantly
      if (now - lastWrite > 5000) {
        lastWrite = now;
        localStorage.setItem(ACTIVITY_KEY, String(now));
      }
    };
    markActive();

    const check = () => {
      const last = Number(localStorage.getItem(ACTIVITY_KEY) || Date.now());
      if (Date.now() - last >= timeoutMs) onTimeoutRef.current();
    };

    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, markActive, { passive: true }));
    document.addEventListener("visibilitychange", check);
    const timer = window.setInterval(check, 15_000);

    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, markActive));
      document.removeEventListener("visibilitychange", check);
      window.clearInterval(timer);
    };
  }, [timeoutMs]);
}
