import "./MainPage.css";
import SplitTextReveal from "../components/ux/splittext/SplitTextReveal";
import AboutPanel from "./about/AboutPanel";
import WorksPanel from "./works/WorksPanel";
import { useRef, useState, useEffect, useCallback } from "react";
import gsap from "gsap";

const MENU_ITEMS = ["Works.", "About.", "Contact."];
const CONTACT_ITEMS = [
  { label: "IG",                   href: "https://www.instagram.com/elixir_recordsofficial/" },
  { label: "YT",                   href: "https://www.youtube.com/@Elixirecords" },
  { label: "Email@", mailto: "arierdene0@gmail.com" },
  // { label: "Ulaanbaatar", href: "https://maps.app.goo.gl/6yBFVVYcBf1Zk2Hi9" },
];
const INITIAL_DELAY = 800;
const STAGGER = 300;
const FLIP_DURATION = 400;
const CHAR_DURATION = 0.5;
const CHAR_STAGGER = 0.02;
const CONTACT_REVEAL_STAGGER = 0.2;

export default function VokuNav({ ready = false }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [activePanel, setActivePanel] = useState(null);
  const [contactVisible, setContactVisible] = useState(false);
  const navRef = useRef(null);
  const rectsRef = useRef({});
  const exitTween = useRef(null);

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
    navRef.current.querySelectorAll("[data-flip-id]").forEach((el) => {
      const id = el.dataset.flipId;
      const oldRect = oldRects[id];
      if (!oldRect) return;
      const newRect = el.getBoundingClientRect();
      const dx = oldRect.left - newRect.left;
      if (Math.abs(dx) > 0.5) {
        el.style.transition = "none";
        el.style.transform = `translateX(${dx}px)`;
        el.offsetHeight;
        el.style.transition = `transform ${FLIP_DURATION}ms ${ease}`;
        el.style.transform = "translateX(0)";
      }
    });
  }, [visibleCount, contactVisible]);

  const handleNavClick = useCallback(
    (item) => {
      const newPanel = activePanel === item ? null : item;
      if (activePanel === "Contact." && newPanel !== "Contact.") {
        const items = navRef.current?.querySelectorAll(".contact-item");
        if (items && items.length > 0) {
          captureRects();
          exitTween.current = gsap.to([...items], {
            opacity: 0,
            duration: 0.1,
            stagger: 0.04,
            ease: "power2.in",
            onComplete: () => {
              exitTween.current = null;
              setContactVisible(false);
              setActivePanel(newPanel);
            },
          });
          return;
        }
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

  return (
    <>
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

        {contactVisible &&
          CONTACT_ITEMS.map(({ label, href, mailto }, index) => {
            const shared = {
              "data-flip-id": `c-${label}`,
              className: "contact-item voku-nav__item client-name",
            };
            let inner;
            if (href) {
              inner = <a {...shared} href={href} target="_blank" rel="noopener noreferrer">{label}</a>;
            } else if (mailto) {
              inner = (
                <a
                  {...shared}
                  href={`mailto:${mailto}`}
                  onClick={() => navigator.clipboard.writeText(label)}
                >
                  {label}
                </a>
              );
            } else {
              inner = <span {...shared}>{label}</span>;
            }
            return (
              <SplitTextReveal
                key={label}
                type="chars"
                animateOnScroll={false}
                delay={index * CONTACT_REVEAL_STAGGER}
                duration={CHAR_DURATION}
                stagger={CHAR_STAGGER}
                ease="power4.out"
              >
                {inner}
              </SplitTextReveal>
            );
          })}
      </nav>

      <WorksPanel open={activePanel === "Works."} />
      <AboutPanel open={activePanel === "About."} />
    </>
  );
}
