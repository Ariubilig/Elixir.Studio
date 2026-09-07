import { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import "./AboutPanel.css";

// Blank lines below are real empty lines in the rendered copy — the block is
// `white-space: pre-wrap`, so the gap is one line-height, never a margin.
const INTRO = `A creative studio with no limits.
Founded in 2024 by crazy friends with a spark in their eyes and no intention of playing it safe. We experiment, we create, we break things, and we turn whatever comes out into music.

Based in Ulaanbaatar, Mongolia — creating meaningful digital experiences and music that reach far beyond where we started.`;

const TEAM = `A creative studio with no limits.
Founded in 2024 by crazy friends with a spark in their eyes and no intention of playing it safe. We experiment, we create, we break things, and we turn whatever comes out into music.

М. Амар
Э.  Ариунбилиг
Д. Буянравжих
Б. Итгэлбаяр
А. Тэмүүгэн
А. Шинэсанаа`;

export default function AboutPanel({ open = false }) {
  const panelRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const animatingOut = useRef(false);

  useEffect(() => {
    if (open) {
      animatingOut.current = false;
      setVisible(true);
    } else if (visible && !animatingOut.current) {
      animatingOut.current = true;
      const blocks = panelRef.current?.querySelectorAll(".about-panel__block");
      if (blocks && blocks.length > 0) {
        gsap.to(blocks, {
          opacity: 0,
          duration: 0.3,
          ease: "power2.in",
          onComplete: () => {
            setVisible(false);
            animatingOut.current = false;
          },
        });
      } else {
        setVisible(false);
        animatingOut.current = false;
      }
    }
  }, [open]);

  useGSAP(
    () => {
      if (!panelRef.current || !open) return;
      gsap.from(".about-panel__block", {
        opacity: 0,
        y: 10,
        duration: 0.6,
        stagger: 0.14,
        ease: "power3.out",
        clearProps: "all",
      });
    },
    { scope: panelRef, dependencies: [open, visible] },
  );

  if (!visible) return null;

  return (
    <aside ref={panelRef} className="about-panel">
      <div className="about-panel__block">
        <img
          src="/IMG.webp"
          className="about-panel__photo"
          width="460"
          height="307"
          decoding="async"
          alt=""
        />
      </div>

      <div className="about-panel__block about-panel__text">{INTRO}</div>

      <div className="about-panel__block">
        <img
          src="/IMG2.webp"
          className="about-panel__photo"
          width="460"
          height="345"
          decoding="async"
          alt=""
        />
      </div>

      <div className="about-panel__block about-panel__text">{TEAM}</div>
    </aside>
  );
}
