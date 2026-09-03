import { useEffect, useRef } from "react";
import gsap from "gsap";
import useIsMobile from "../../../hooks/useIsMobile";
import "./Script.css";

// Same fade as the works panel's own items, so the two swap cleanly instead of
// reading as two separate animations happening at once.
const FADE_OUT = { opacity: 0, duration: 0.15, ease: "power2.in" };
const FADE_IN = { opacity: 1, duration: 0.4, ease: "power3.out" };
// The first appearance is a slower one: it lands after the nav has arrived,
// so it reads as the last thing to settle rather than something already there.
const FIRST_FADE_DURATION = 0.9;

export default function Script({
  ready = false,
  hidden = false,
  firstRevealDelay = 0,
}) {
  const scriptRef = useRef(null);
  const revealed = useRef(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!scriptRef.current || !ready) return; // stays dark behind the preloader

    if (hidden) {
      const tween = gsap.to(scriptRef.current, FADE_OUT);
      return () => tween.kill();
    }

    const tween = gsap.to(
      scriptRef.current,
      revealed.current
        ? FADE_IN
        : {
            opacity: 1,
            duration: FIRST_FADE_DURATION,
            delay: firstRevealDelay,
            ease: "power2.out",
            // Flagged on completion, not on start, so a killed-and-restarted
            // tween still counts as the first reveal.
            onComplete: () => {
              revealed.current = true;
            },
          },
    );

    return () => tween.kill();
  }, [ready, hidden, firstRevealDelay]);

  return (
    <img
      ref={scriptRef}
      className="script"
      // The mobile export carries its own gaussian blur; the desktop one is crisp.
      src={isMobile ? "/script-mobile.svg" : "/script.svg"}
      decoding="async"
      alt=""
      aria-hidden="true"
    />
  );
}
