import type { CSSProperties, ReactNode } from "react";

export interface SplitTextRevealProps {
  children: ReactNode;
  type?: "lines" | "chars";
  animateOnScroll?: boolean;
  delay?: number;
  duration?: number;
  stagger?: number;
  ease?: string;
  scrollTriggerStart?: string;
  onComplete?: () => void;
  className?: string;
  style?: CSSProperties;
  wrapperTag?: string;
}

declare const SplitTextReveal: (props: SplitTextRevealProps) => JSX.Element;
export default SplitTextReveal;
