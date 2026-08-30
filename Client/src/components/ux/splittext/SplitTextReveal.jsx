import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(SplitText);

/**
 * SplitTextReveal
 *
 * Animates text by splitting it into lines or characters and revealing
 * each piece from bottom (y: 100%) to top (y: 0%) inside a mask.
 *
 * Reveals on mount. Nothing on this site scrolls — the page is a fixed
 * viewport — so there is no scroll-triggered variant.
 *
 * @param {React.ReactNode} children - Text content to animate
 * @param {"lines"|"chars"} type - Split granularity (default: "lines")
 * @param {number} delay - Initial delay in seconds (default: 0)
 * @param {number} duration - Animation duration in seconds (default: 1)
 * @param {number} stagger - Delay between pieces. Defaults to 0.1 for lines, 0.03 for chars.
 * @param {string} ease - GSAP easing (default: "power4.out")
 * @param {Function} onComplete - Called once the reveal tween has finished
 * @param {boolean} exiting - Flip to true to lift the text back out of the mask
 * @param {number} exitDuration - Exit duration in seconds (default: 0.4)
 * @param {string} exitEase - Easing for the exit (default: "power3.in")
 * @param {Function} onExited - Called once the exit tween has finished
 * @param {string} className - Additional CSS classes
 * @param {Object} style - Additional inline styles
 * @param {string} wrapperTag - HTML tag for wrapper element when multiple children (default: "div")
 */
export default function SplitTextReveal({
  children,
  type = "lines",
  delay = 0,
  duration = 1,
  stagger,
  ease = "power4.out",
  onComplete,
  exiting = false,
  exitDuration = 0.4,
  exitEase = "power3.in",
  onExited,
  className = "",
  style = {},
  wrapperTag = "div"
}) {
  const containerRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  const onExitedRef = useRef(onExited);
  const splitRefs = useRef([]);
  const targets = useRef([]);

  // Held in a ref so the tween always calls the latest callback without
  // re-running the animation when the parent re-renders.
  useEffect(() => {
    onCompleteRef.current = onComplete;
    onExitedRef.current = onExited;
  });

  // Smart default stagger based on type
  const effectiveStagger = stagger ?? (type === "chars" ? 0.03 : 0.1);

  // Exit: send the pieces the rest of the way up and out of the mask, so
  // the next text can rise into the gap they leave behind.
  useEffect(() => {
    if (!exiting) return;

    if (targets.current.length === 0) {
      onExitedRef.current?.(); // never revealed - nothing to lift
      return;
    }

    const tween = gsap.to(targets.current, {
      y: "-100%",
      duration: exitDuration,
      stagger: effectiveStagger,
      ease: exitEase,
      overwrite: true, // takes the pieces over from an unfinished reveal
      onComplete: () => onExitedRef.current?.(),
    });

    return () => tween.kill();
  }, [exiting, exitDuration, exitEase, effectiveStagger]);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      document.fonts.ready.then(() => {
        // Fonts can resolve after the element is gone (route change, key swap).
        if (!containerRef.current) return;

        splitRefs.current.forEach(split => split?.revert()); // revert previous SplitText
        splitRefs.current = [];
        targets.current = [];

        const elements = containerRef.current.hasAttribute("data-text-wrapper")
          ? Array.from(containerRef.current.children)
          : [containerRef.current];

        elements.forEach(element => {
          try {
            const splitOptions = type === "chars"
              ? {
                  type: "chars",
                  mask: "chars",
                  charsClass: "char++",
                }
              : {
                  type: "lines",
                  mask: "lines",
                  linesClass: "line++",
                  lineThreshold: 0.1,
                };

            const split = SplitText.create(element, splitOptions);
            splitRefs.current.push(split);

            // Lines-only: handle text-indent so first line keeps its indent
            if (type === "lines") {
              const computedStyle = window.getComputedStyle(element);
              const textIndent = computedStyle.textIndent;

              if (textIndent && textIndent !== "0px") {
                if (split.lines.length > 0) {
                  split.lines[0].style.paddingLeft = textIndent;
                }
                element.style.textIndent = "0";
              }
            }

            const pieces = type === "chars" ? split.chars : split.lines;
            targets.current.push(...pieces);
          } catch (error) {
            console.warn(`SplitTextReveal: Failed to split element (type=${type})`, error);
          }
        });

        if (targets.current.length === 0) {
          onCompleteRef.current?.(); // nothing to reveal - still report done
          return;
        }

        gsap.set(targets.current, { y: "100%" });

        gsap.to(targets.current, {
          y: "0%",
          duration,
          stagger: effectiveStagger,
          ease,
          delay,
          onComplete: () => onCompleteRef.current?.(),
        });
      });

      return () => {
        splitRefs.current.forEach(split => split?.revert()); // revert SplitText
      };
    },
    {
      scope: containerRef,
      dependencies: [type, delay, duration, effectiveStagger, ease],
    }
  );

  if (React.Children.count(children) === 1) { // Single child
    return React.cloneElement(children, {
      ref: containerRef,
      className: `${children.props.className || ""} ${className}`.trim(),
      style: { ...children.props.style, ...style }
    });
  }

  const WrapperComponent = wrapperTag; // Multiple children
  return (
    <WrapperComponent
      ref={containerRef}
      data-text-wrapper="true"
      className={className}
      style={style}
    >
      {children}
    </WrapperComponent>
  );
}