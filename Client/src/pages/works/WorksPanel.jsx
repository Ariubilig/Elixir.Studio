import { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import "./WorksPanel.css";

const WORKS = [
  "Emira - CHI",
  "Emira ft Esui - Setgel",
  "Emira - 7AM",
  "Emira ft Noel - Paradise",
  "Bellatrix ft Emira - Cham Tai",
  "Emira - All the time",
  "Noel - Waves",
  "Emira ft Noel Bellatrix - Untitled",
];

export default function WorksPanel({ open = false }) {
  const panelRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const animatingOut = useRef(false);

  useEffect(() => {
    if (open) {
      animatingOut.current = false;
      setVisible(true);
    } else if (visible && !animatingOut.current) {
      animatingOut.current = true;
      const items = panelRef.current?.querySelectorAll(".works-panel__item");
      if (items && items.length > 0) {
        gsap.to(items, {
          opacity: 0,
          duration: 0.15,
          stagger: 0.03,
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
      gsap.from(".works-panel__item", {
        opacity: 0,
        y: 6,
        duration: 0.4,
        stagger: 0.06,
        ease: "power3.out",
        clearProps: "all",
      });
    },
    { scope: panelRef, dependencies: [open, visible] }
  );

  if (!visible) return null;

  return (
    <aside ref={panelRef} className="works-panel">
      <h1 className="works-panel__item">Works</h1>
      {WORKS.map((title) => (
        <div key={title} className="works-panel__item">
          {title}
        </div>
      ))}
    </aside>
  );
}
