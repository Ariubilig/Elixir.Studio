"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";

gsap.registerPlugin(ScrollTrigger, ScrollSmoother); // Register once at module level

const useScrollSmoother = (wrapperRef, { enabled = true } = {}) => {

  useEffect(() => {
    if (!enabled || !wrapperRef.current) return;

    ScrollSmoother.get()?.kill(); // Kill any existing smoother (StrictMode / route changes)

    if (ScrollTrigger.isTouch === 1) return; // Disable on touch devices

    const content = wrapperRef.current.querySelector("#smooth-content");
    if (!content) return;

    const smoother = ScrollSmoother.create({
      wrapper: wrapperRef.current,
      content,
      smooth: 1.5,
      effects: true,
      normalizeScroll: true,
      ignoreMobileResize: true,
    });

    ScrollTrigger.normalizeScroll({ allowNestedScroll: true }); // Allow nested scrolling (modals, dropdowns, etc.)
    ScrollTrigger.refresh(); // Ensure layout is correct after any DOM changes

    return () => {
      smoother.kill();
    };
  }, [enabled]); // wrapperRef is a stable ref — no need to include it

};

export default useScrollSmoother;