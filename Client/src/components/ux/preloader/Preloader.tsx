import { useEffect, useState } from "react";
import SplitTextReveal from "../splittext/SplitTextReveal";

const DEFAULT_PHRASES = [
  "Not Real, Yet.",
  "Creative",
  "Meaningful ",
  "From the bottom",
  "Elixir.Studio™",
];

/**
 * Safety net for the opening phrase: if the reveal never reports back (fonts
 * stall, SplitText fails), don't strand the preloader on the first word.
 */
const REVEAL_TIMEOUT_MS = 2500;

export default function Preloader({
  onFinish,
  exiting = false,
  onExited,
  phrases = DEFAULT_PHRASES,
  holdMs = 600,
  firstHoldMs = 1000,
  finalHoldMs = 800,
  revealDuration = 0.7,
  exitDuration = 0.25,
}: {
  onFinish: () => void;
  exiting?: boolean;
  onExited?: () => void;
  phrases?: string[];
  holdMs?: number;
  firstHoldMs?: number;
  finalHoldMs?: number;
  revealDuration?: number;
  exitDuration?: number;
}) {
  const [index, setIndex] = useState(0);
  const [shouldShow, setShouldShow] = useState(true);
  const [firstRevealed, setFirstRevealed] = useState(false);
  const [phraseExiting, setPhraseExiting] = useState(false);
  const isFirst = index === 0;
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
    if (!shouldShow || firstRevealed) return;
    const timer = setTimeout(() => setFirstRevealed(true), REVEAL_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [shouldShow, firstRevealed]);

  useEffect(() => {
    if (!shouldShow || phraseExiting) return;
    // The opening phrase is the one people actually have to read, so its hold
    // starts only once it has finished rising — the later cuts stay quick.
    if (isFirst && !firstRevealed) return;
    const timer = setTimeout(() => {
      if (isLast) {
        sessionStorage.setItem('sessionLoaded', 'true');
        onFinish?.();
      } else {
        setPhraseExiting(true); // lift this phrase out; the next one follows it
      }
    }, isLast ? finalHoldMs : isFirst ? firstHoldMs : holdMs);
    return () => clearTimeout(timer);
  }, [index, isFirst, isLast, firstRevealed, phraseExiting, shouldShow, onFinish, holdMs, firstHoldMs, finalHoldMs]);

  // Batched, so the next phrase mounts already unset and rises from the bottom.
  const handlePhraseExited = () => {
    setIndex((i) => i + 1);
    setPhraseExiting(false);
  };

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
        duration={revealDuration}
        ease="power3.out"
        onComplete={isFirst ? () => setFirstRevealed(true) : undefined}
        exiting={phraseExiting}
        exitDuration={exitDuration}
        onExited={handlePhraseExited}
      >
        <span className="preloader-phrase">{phrases[index]}</span>
      </SplitTextReveal>
    </div>
  );
}
