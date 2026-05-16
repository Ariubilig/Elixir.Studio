import { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import "./AboutPanel.css";

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
    { scope: panelRef, dependencies: [open, visible] }
  );

  if (!visible) return null;

  return (
    <aside ref={panelRef} className="about-panel">
      <div className="about-panel__block">
        <img src="/logo.png" className="about-panel__logo" alt="Elixir" />
      </div>

      <div className="about-panel__block about-panel__intro">
        <p>Founded in 2024 by friends united by passion and pride.</p>
        <p>Based in Ulaanbaatar, creating meaningful digital experiences from Mongolia to everywhere.</p>
      </div>

      <div className="about-panel__block">
        <img src="/image.png" className="about-panel__photo" alt="" />
      </div>

      <div className="about-panel__block about-panel__body">
        <p className="about-panel__we-are">We are</p>
        <p>asddasd asdasdasd asdad. Based on Ulaanbaatar, Mongolia asdsadasd asddasd asdasdasd asdad. Based on Ulaanbaatar, Mongolia asdasddasd asdasdasd asdad. Based on Ulaanbaatar, Mongolia</p>
      </div>

      <div className="about-panel__block">
        <img src="/image2.png" className="about-panel__photo" alt="" />
      </div>
      <div className="about-panel__block about-panel__body">
        <p className="about-panel__we-are">We are</p>
        <p>asddasd asdasdasd asdad. Based on Ulaanbaatar, Mongolia asdsadasd asddasd asdasdasd asdad. Based on Ulaanbaatar, Mongolia asdasddasd asdasdasd asdad. Based on Ulaanbaatar, Mongolia</p>
      </div>
    </aside>
  );
}
