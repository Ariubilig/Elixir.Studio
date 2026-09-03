import "./MainPage.css";
import SplitTextReveal from "../components/ux/splittext/SplitTextReveal";
import AboutPanel from "./about/AboutPanel";
import WorksPanel from "./works/WorksPanel";
import Script from "../components/ux/script/Script";
import {
  useRef,
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
} from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import useGMTplus8 from "../hooks/useGMT+8";
import useIsMobile from "../hooks/useIsMobile";

const MENU_ITEMS = ["Works.", "About.", "Contact."];
const CONTACT_ITEMS = [
  { label: "IG", href: "https://www.instagram.com/elixir_recordsofficial/" },
  { label: "YT", href: "https://www.youtube.com/@Elixirecords" },
  { label: "contact@", mailto: "arierdene0@gmail.com" },
];
const INITIAL_DELAY = 800;
const STAGGER = 300;
const FLIP_DURATION = 750;
const CHAR_DURATION = 0.5;
const CHAR_STAGGER = 0.02;
// A long label at the flat per-char stagger drags: "contact@" is
// 21 chars, so it spends nearly twice as long revealing as "IG" does. Cap the
// total spread instead, so every item lands on roughly the same beat and only
// the short ones keep the full CHAR_STAGGER.
const CHAR_SPREAD_MAX = 0.14;
const charStaggerFor = (text) =>
  Math.min(CHAR_STAGGER, CHAR_SPREAD_MAX / Math.max(text.length, 1));
// Desktop: contact items join the nav line one at a time, so each arrival gets
// its own re-centring push — the same shape as the nav sequence above.
const CONTACT_STAGGER = 200;
// Mobile: the contact row sits on its own line and never pushes the nav, so
// those items mount together and only their reveals stagger.
const CONTACT_REVEAL_STAGGER = 0.2;
const CONTACT_REVEAL_BASE_DELAY = FLIP_DURATION / 1800;
// The script is the last thing to settle, once every nav item has landed.
const SCRIPT_REVEAL_DELAY =
  (INITIAL_DELAY + MENU_ITEMS.length * STAGGER) / 1000;

function readTranslateX(el) {
  const t = getComputedStyle(el).transform;
  if (!t || t === "none") return 0;
  return new DOMMatrixReadOnly(t).m41;
}

function ClockDisplay({ delay = 0 }) {
  // Owned here so the tick re-renders this span alone, not the whole page.
  const time = useGMTplus8();
  const ref = useRef(null);
  const [animDone, setAnimDone] = useState(false);
  const initialTime = useRef(time);

  useGSAP(
    () => {
      if (!ref.current) return;
      document.fonts.ready.then(() => {
        // Fonts can resolve after the element is gone (panel toggled shut).
        if (!ref.current) return;

        let split;
        try {
          split = SplitText.create(ref.current, {
            type: "chars",
            mask: "chars",
            charsClass: "char++",
          });
        } catch (error) {
          console.warn("ClockDisplay: failed to split", error);
          setAnimDone(true); // no reveal, but the clock still has to tick
          return;
        }

        gsap.from(split.chars, {
          y: "100%",
          duration: CHAR_DURATION,
          // Longest label on the row, so it leans hardest on the spread cap.
          stagger: Math.min(
            CHAR_STAGGER,
            CHAR_SPREAD_MAX / Math.max(split.chars.length, 1),
          ),
          ease: "power4.out",
          delay,
          onComplete: () => {
            split.revert();
            setAnimDone(true);
          },
        });
      });
    },
    { scope: ref },
  );

  // SplitText replaces this span's children, which orphans the text node React
  // is holding: every render after the split writes to a node that is no longer
  // in the document, which is what froze the clock on its first value. So the
  // rendered text stays fixed and React never has to touch it again — the tick
  // goes straight to the DOM once revert() has put the plain text back.
  useEffect(() => {
    if (!animDone || !ref.current) return;
    ref.current.textContent = `${time} (GMT +8)`;
  }, [animDone, time]);

  return (
    <span ref={ref} className="contact-item voku-nav__item voku-nav__clock">
      {`${initialTime.current} (GMT +8)`}
    </span>
  );
}

export default function VokuNav({ ready = false }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [activePanel, setActivePanel] = useState(null);
  const [contactVisible, setContactVisible] = useState(false);
  const [contactCount, setContactCount] = useState(0);
  const [worksOnScreen, setWorksOnScreen] = useState(false);
  const navRef = useRef(null);
  const rectsRef = useRef({});
  const exitTween = useRef(null);
  const contactRowRef = useRef(null);
  const isMobile = useIsMobile();

  const captureRects = useCallback(() => {
    if (!navRef.current) return;
    const rects = {};
    navRef.current.querySelectorAll("[data-flip-id]").forEach((el) => {
      if (el.offsetParent !== null) {
        rects[el.dataset.flipId] = el.getBoundingClientRect();
      }
    });
    rectsRef.current = rects;
  }, []);

  // Sequential mounting of nav items after preloader
  useEffect(() => {
    if (!ready) return;
    const timeouts = [];
    for (let i = 0; i < MENU_ITEMS.length; i++) {
      const t = setTimeout(
        () => {
          captureRects();
          setVisibleCount(i + 1);
        },
        INITIAL_DELAY + i * STAGGER,
      );
      timeouts.push(t);
    }
    return () => timeouts.forEach(clearTimeout);
  }, [ready, captureRects]);

  // Same walk-in for the contact items, so they split out one by one and push
  // the line each time instead of landing pre-centred in a single jump.
  useEffect(() => {
    if (isMobile || !contactVisible) return;
    const slots = CONTACT_ITEMS.length + 1; // + the clock, which lands last
    const timeouts = [];
    for (let i = 0; i < slots; i++) {
      const t = setTimeout(() => {
        captureRects();
        setContactCount(i + 1);
      }, i * CONTACT_STAGGER);
      timeouts.push(t);
    }
    return () => timeouts.forEach(clearTimeout);
  }, [contactVisible, isMobile, captureRects]);

  // FLIP after any layout change (nav items mount or contact items show/hide)
  useLayoutEffect(() => {
    if (!navRef.current) return;
    const oldRects = rectsRef.current;
    const ease = "cubic-bezier(0.22, 1, 0.36, 1)";

    const flips = [];
    navRef.current.querySelectorAll("[data-flip-id]").forEach((el) => {
      const id = el.dataset.flipId;
      const oldRect = oldRects[id];
      if (!oldRect) return;
      const newRect = el.getBoundingClientRect();
      // The rect still carries whatever transform the previous push is part-way
      // through, so back it out to get the true layout position — otherwise
      // each new item snaps the row back by the leftover offset.
      const inFlight = readTranslateX(el);
      const dx = oldRect.left - (newRect.left - inFlight);
      if (Math.abs(dx) > 0.5) flips.push({ el, dx });
    });

    if (flips.length === 0) return;

    flips.forEach(({ el, dx }) => {
      el.style.transition = "none";
      el.style.transform = `translateX(${dx}px)`;
    });

    flips[0].el.offsetHeight;

    flips.forEach(({ el }) => {
      el.style.transition = `transform ${FLIP_DURATION}ms ${ease}`;
      el.style.transform = "translateX(0)";
    });
  }, [visibleCount, contactVisible, contactCount]);

  useEffect(() => {
    if (!isMobile || !contactVisible || !contactRowRef.current) return;
    gsap.from(contactRowRef.current, {
      height: 0,
      marginTop: 0,
      overflow: "hidden",
      duration: 0.35,
      ease: "power3.out",
    });
  }, [contactVisible, isMobile]);

  const handleNavClick = useCallback(
    (item) => {
      const newPanel = activePanel === item ? null : item;
      if (activePanel === "Contact." && newPanel !== "Contact.") {
        const items = navRef.current?.querySelectorAll(".contact-item");
        if (items && items.length > 0) {
          captureRects();
          exitTween.current = gsap.to([...items], {
            opacity: 0,
            duration: 0.25,
            stagger: 0.08,
            ease: "power2.in",
            onComplete: () => {
              exitTween.current = null;
              setContactVisible(false);
              setContactCount(0);
              setActivePanel(newPanel);
            },
          });
          return;
        }
        setContactVisible(false);
        setContactCount(0);
      }
      captureRects();
      if (newPanel === "Contact.") {
        if (exitTween.current) {
          // Re-opened mid-fade: the tween left the items part-way transparent.
          exitTween.current.kill();
          exitTween.current = null;
          const items = navRef.current?.querySelectorAll(".contact-item");
          if (items?.length) gsap.set([...items], { opacity: 1 });
        }
        setContactVisible(true);
      }
      setActivePanel(newPanel);
    },
    [activePanel, captureRects],
  );

  const renderContactItem = ({ label, href, mailto }) => {
    const shared = {
      "data-flip-id": `c-${label}`,
      className: "contact-item voku-nav__item client-name",
    };
    if (href) {
      return (
        <a {...shared} href={href} target="_blank" rel="noopener noreferrer">
          {label}
        </a>
      );
    }
    if (mailto) {
      return (
        <a
          {...shared}
          href={`mailto:${mailto}`}
          onClick={() => navigator.clipboard.writeText(mailto)}
        >
          {label}
        </a>
      );
    }
    return <span {...shared}>{label}</span>;
  };

  const wrapperCls = [
    "voku-nav-wrapper",
    isMobile && "voku-nav-wrapper--mobile",
    activePanel === "About." && "voku-nav-wrapper--about-open",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div className={wrapperCls}>
        <nav ref={navRef} className="voku-nav">
          <span
            data-flip-id="logo"
            className="voku-nav__logo"
            onClick={() => handleNavClick(activePanel)}
          >
            <span className="client-name">Elixir.Studio</span>
            <span>™</span>
          </span>

          {MENU_ITEMS.slice(0, visibleCount).map((item) => (
            <SplitTextReveal
              key={item}
              type="chars"
              delay={0}
              duration={CHAR_DURATION}
              stagger={CHAR_STAGGER}
              ease="power4.out"
            >
              <span
                data-flip-id={item}
                className={`voku-nav__item client-name${activePanel === item ? " active" : ""}`}
                onClick={() => handleNavClick(item)}
              >
                {item}
              </span>
            </SplitTextReveal>
          ))}

          {!isMobile &&
            contactVisible &&
            CONTACT_ITEMS.slice(0, contactCount).map(
              ({ label, href, mailto }) => (
                <SplitTextReveal
                  key={label}
                  type="chars"
                  delay={0}
                  duration={CHAR_DURATION}
                  stagger={charStaggerFor(label)}
                  ease="power4.out"
                >
                  {renderContactItem({ label, href, mailto })}
                </SplitTextReveal>
              ),
            )}

          {!isMobile &&
            contactVisible &&
            contactCount > CONTACT_ITEMS.length && <ClockDisplay delay={0} />}
        </nav>

        {isMobile && contactVisible && (
          <div ref={contactRowRef} className="voku-nav__contact-row">
            {CONTACT_ITEMS.map(({ label, href, mailto }, index) => (
              <SplitTextReveal
                key={label}
                type="chars"
                delay={
                  CONTACT_REVEAL_BASE_DELAY + index * CONTACT_REVEAL_STAGGER
                }
                duration={CHAR_DURATION}
                stagger={charStaggerFor(label)}
                ease="power4.out"
              >
                {renderContactItem({ label, href, mailto })}
              </SplitTextReveal>
            ))}
            <ClockDisplay
              delay={
                CONTACT_REVEAL_BASE_DELAY +
                CONTACT_ITEMS.length * CONTACT_REVEAL_STAGGER
              }
            />
          </div>
        )}
      </div>

      <Script
        ready={ready}
        hidden={activePanel === "Works." || worksOnScreen}
        firstRevealDelay={SCRIPT_REVEAL_DELAY}
      />
      <WorksPanel
        open={activePanel === "Works."}
        onVisibleChange={setWorksOnScreen}
      />
      <AboutPanel open={activePanel === "About."} />
    </>
  );
}
