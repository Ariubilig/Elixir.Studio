import React, { useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(SplitText, ScrollTrigger);

/**
 * SplitTextReveal
 *
 * Animates text by splitting it into lines or characters and revealing
 * each piece from bottom (y: 100%) to top (y: 0%) inside a mask.
 *
 * @param {React.ReactNode} children - Text content to animate
 * @param {"lines"|"chars"} type - Split granularity (default: "lines")
 * @param {boolean} animateOnScroll - Trigger on scroll vs. on mount (default: true)
 * @param {number} delay - Initial delay in seconds (default: 0)
 * @param {number} duration - Animation duration in seconds (default: 1)
 * @param {number} stagger - Delay between pieces. Defaults to 0.1 for lines, 0.03 for chars.
 * @param {string} ease - GSAP easing (default: "power4.out")
 * @param {string} scrollTriggerStart - ScrollTrigger start position (default: "top 75%")
 * @param {string} className - Additional CSS classes
 * @param {Object} style - Additional inline styles
 * @param {string} wrapperTag - HTML tag for wrapper element when multiple children (default: "div")
 */
export default function SplitTextReveal({
  children,
  type = "lines",
  animateOnScroll = true,
  delay = 0,
  duration = 1,
  stagger,
  ease = "power4.out",
  scrollTriggerStart = "top 75%",
  className = "",
  style = {},
  wrapperTag = "div"
}) {
  const containerRef = useRef(null);
  const splitRefs = useRef([]);
  const targets = useRef([]);

  // Smart default stagger based on type
  const effectiveStagger = stagger ?? (type === "chars" ? 0.03 : 0.1);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      document.fonts.ready.then(() => {
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

        if (targets.current.length === 0) return;

        gsap.set(targets.current, { y: "100%" });

        const animationProps = {
          y: "0%",
          duration,
          stagger: effectiveStagger,
          ease,
          delay,
        };

        if (animateOnScroll) {
          gsap.to(targets.current, {
            ...animationProps,
            scrollTrigger: {
              trigger: containerRef.current,
              start: scrollTriggerStart,
              once: true,
              // markers: true, // Will add scroll trigger markers for debugging
            },
          });

          ScrollTrigger.refresh(); // Refresh ScrollTrigger for smoothScroll
        } else {
          gsap.to(targets.current, animationProps);
        }
      });

      return () => {
        splitRefs.current.forEach(split => split?.revert()); // revert SplitText
        ScrollTrigger.getAll().forEach(st => { // Clean up ScrollTriggers
          if (st.trigger === containerRef.current) {
            st.kill();
          }
        });
      };
    },
    {
      scope: containerRef,
      dependencies: [type, animateOnScroll, delay, duration, effectiveStagger, ease, scrollTriggerStart],
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