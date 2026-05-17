import "./MainPage.css";
import SplitTextReveal from "../components/ux/splittext/SplitTextReveal";
import AboutPanel from "./about/AboutPanel";
import WorksPanel from "./works/WorksPanel";
import { useRef, useState, useEffect, useCallback } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import useGMTplus8 from "../hooks/useGMT+8";
import useIsMobile from "../hooks/useIsMobile";

const MENU_ITEMS = ["Works.", "About.", "Contact."];
const CONTACT_ITEMS = [
  { label: "IG", href: "https://www.instagram.com/elixir_recordsofficial/" },
  { label: "YT", href: "https://www.youtube.com/@Elixirecords" },
  { label: "contact@elixir.studio", mailto: "arierdene0@gmail.com" },
  { label: "Ulaanbaatar", href: "https://maps.app.goo.gl/6yBFVVYcBf1Zk2Hi9" },
];
const INITIAL_DELAY = 800;
const STAGGER = 300;
const FLIP_DURATION = 750;
const CHAR_DURATION = 0.5;
const CHAR_STAGGER = 0.02;
const CONTACT_REVEAL_STAGGER = 0.2;
const CONTACT_REVEAL_BASE_DELAY = FLIP_DURATION / 1800;

function ClockDisplay({ time, delay = 0 }) {
  const ref = useRef(null);
  const [animDone, setAnimDone] = useState(false);
  const frozenTime = useRef(time);

  useGSAP(() => {
    if (!ref.current) return;
    frozenTime.current = time;
    document.fonts.ready.then(() => {
      const split = SplitText.create(ref.current, {
        type: "chars",
        mask: "chars",
        charsClass: "char++",
      });
      gsap.from(split.chars, {
        y: "100%",
        duration: CHAR_DURATION,
        stagger: CHAR_STAGGER,
        ease: "power4.out",
        delay,
        onComplete: () => {
          split.revert();
          setAnimDone(true);
        },
      });
    });
  }, { scope: ref });

  return (
    <span ref={ref} className="contact-item voku-nav__item voku-nav__clock">
      {animDone ? time : frozenTime.current} (GMT +8)
    </span>
  );
}

export default function VokuNav({ ready = false }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [activePanel, setActivePanel] = useState(null);
  const [contactVisible, setContactVisible] = useState(false);
  const navRef = useRef(null);
  const rectsRef = useRef({});
  const exitTween = useRef(null);
  const contactRowRef = useRef(null);
  const currentTime = useGMTplus8();
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
      const t = setTimeout(() => {
        captureRects();
        setVisibleCount(i + 1);
      }, INITIAL_DELAY + i * STAGGER);
      timeouts.push(t);
    }
    return () => timeouts.forEach(clearTimeout);
  }, [ready, captureRects]);

  // FLIP after any layout change (nav items mount or contact items show/hide)
  useEffect(() => {
    if (!navRef.current) return;
    const oldRects = rectsRef.current;
    const ease = "cubic-bezier(0.22, 1, 0.36, 1)";

    const flips = [];
    navRef.current.querySelectorAll("[data-flip-id]").forEach((el) => {
      const id = el.dataset.flipId;
      const oldRect = oldRects[id];
      if (!oldRect) return;
      const newRect = el.getBoundingClientRect();
      const dx = oldRect.left - newRect.left;
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
  }, [visibleCount, contactVisible]);

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
              setActivePanel(newPanel);
            },
          });
          return;
        }
        setContactVisible(false);
      }
      captureRects();
      if (newPanel === "Contact.") {
        if (exitTween.current) {
          exitTween.current.kill();
          exitTween.current = null;
        }
        setContactVisible(true);
      }
      setActivePanel(newPanel);
    },
    [activePanel, captureRects]
  );

  const renderContactItem = ({ label, href, mailto }) => {
    const shared = {
      "data-flip-id": `c-${label}`,
      className: "contact-item voku-nav__item client-name",
    };
    if (href) {
      return <a {...shared} href={href} target="_blank" rel="noopener noreferrer">{label}</a>;
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
  ].filter(Boolean).join(" ");

  return (
    <>
      <div className={wrapperCls}>
        <nav ref={navRef} className="voku-nav">
          <span data-flip-id="logo" className="voku-nav__logo" onClick={() => handleNavClick(activePanel)}>
            <span className="client-name">Elixir.Studio</span>
            <span>™</span>
          </span>

          {MENU_ITEMS.slice(0, visibleCount).map((item) => (
            <SplitTextReveal
              key={item}
              type="chars"
              animateOnScroll={false}
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

          {!isMobile && contactVisible &&
            CONTACT_ITEMS.map(({ label, href, mailto }, index) => (
              <SplitTextReveal
                key={label}
                type="chars"
                animateOnScroll={false}
                delay={CONTACT_REVEAL_BASE_DELAY + index * CONTACT_REVEAL_STAGGER}
                duration={CHAR_DURATION}
                stagger={CHAR_STAGGER}
                ease="power4.out"
              >
                {renderContactItem({ label, href, mailto })}
              </SplitTextReveal>
            ))}

          {!isMobile && contactVisible && (
            <ClockDisplay time={currentTime} delay={CONTACT_REVEAL_BASE_DELAY + CONTACT_ITEMS.length * CONTACT_REVEAL_STAGGER} />
          )}
        </nav>

        {isMobile && contactVisible && (
          <div ref={contactRowRef} className="voku-nav__contact-row">
            {CONTACT_ITEMS.map(({ label, href, mailto }, index) => (
              <SplitTextReveal
                key={label}
                type="chars"
                animateOnScroll={false}
                delay={CONTACT_REVEAL_BASE_DELAY + index * CONTACT_REVEAL_STAGGER}
                duration={CHAR_DURATION}
                stagger={CHAR_STAGGER}
                ease="power4.out"
              >
                {renderContactItem({ label, href, mailto })}
              </SplitTextReveal>
            ))}
            <ClockDisplay time={currentTime} delay={CONTACT_REVEAL_BASE_DELAY + CONTACT_ITEMS.length * CONTACT_REVEAL_STAGGER} />
          </div>
        )}
      </div>

      <WorksPanel open={activePanel === "Works."} />
      <AboutPanel open={activePanel === "About."} />
    </>
  );
}