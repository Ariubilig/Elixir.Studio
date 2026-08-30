import type { CSSProperties, ReactNode } from "react";

export interface SplitTextRevealProps {
  children: ReactNode;
  type?: "lines" | "chars";
  delay?: number;
  duration?: number;
  stagger?: number;
  ease?: string;
  onComplete?: () => void;
  exiting?: boolean;
  exitDuration?: number;
  exitEase?: string;
  onExited?: () => void;
  className?: string;
  style?: CSSProperties;
  wrapperTag?: string;
}

declare const SplitTextReveal: (props: SplitTextRevealProps) => JSX.Element;
export default SplitTextReveal;
