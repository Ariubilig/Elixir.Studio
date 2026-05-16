import { useEffect, useState } from "react";
import SplitTextReveal from "../splittext/SplitTextReveal";

const DEFAULT_PHRASES = [
  "Not Real, Yet.",
  "Creative Studio",
  "From the bottom",
  "Elixir.Studio™",
];

export default function Preloader({
  onFinish,
  exiting = false,
  onExited,
  phrases = DEFAULT_PHRASES,
  holdMs = 600,
  finalHoldMs = 800,
}: {
  onFinish: () => void;
  exiting?: boolean;
  onExited?: () => void;
  phrases?: string[];
  holdMs?: number;
  finalHoldMs?: number;
}) {
  const [index, setIndex] = useState(0);
  const [shouldShow, setShouldShow] = useState(true);
  const isLast = index === phrases.length - 1;

  useEffect(() => {
    const sessionLoaded = sessionStorage.getItem('sessionLoaded');
    if (sessionLoaded) {
      setShouldShow(false);
      onFinish();
      return;
    }
  }, [onFinish]);

  useEffect(() => {
    if (!shouldShow) return;
    const timer = setTimeout(() => {
      if (isLast) {
        sessionStorage.setItem('sessionLoaded', 'true');
        onFinish?.();
      } else {
        setIndex((i) => i + 1);
      }
    }, isLast ? finalHoldMs : holdMs);
    return () => clearTimeout(timer);
  }, [index, isLast, shouldShow, onFinish, holdMs, finalHoldMs]);

  const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.propertyName === "opacity") onExited?.();
  };

  if (!shouldShow) return null;

  return (
    <div
      className={`preloader${exiting ? " preloader--exiting" : ""}`}
      onTransitionEnd={handleTransitionEnd}
    >
      <SplitTextReveal
        key={index}
        type="lines"
        animateOnScroll={false}
        ease="power3.out"
      >
        <span className="preloader-phrase">{phrases[index]}</span>
      </SplitTextReveal>
    </div>
  );
}
