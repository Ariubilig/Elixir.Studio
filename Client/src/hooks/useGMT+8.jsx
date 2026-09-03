import { useState, useEffect } from "react";

// Built once at module scope: constructing an Intl.DateTimeFormat is expensive
// and the format never varies.
const formatter = new Intl.DateTimeFormat("en-US", {
  hour12: false,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  timeZone: "Asia/Ulaanbaatar",
});

const readClock = () => formatter.format(new Date());

/**
 * Ulaanbaatar time, ticking once a second.
 *
 * Call this from the component that actually shows the time — every tick is a
 * re-render of whoever owns it, so owning it high up costs the whole tree.
 */
export default function useGMTplus8() {
  // Seeded synchronously, so the first paint already has the real time.
  const [currentTime, setCurrentTime] = useState(readClock);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(readClock()), 1000);
    return () => clearInterval(interval);
  }, []);

  return currentTime;
}
