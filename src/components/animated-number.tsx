import { useEffect, useRef, useState } from "react";
import { animate } from "motion";

type Props = {
  value: number;
  format?: (n: number) => string;
  className?: string;
  duration?: number;
};

export function AnimatedNumber({ value, format, className, duration = 1.1 }: Props) {
  const [display, setDisplay] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    const controls = animate(from.current, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
    });
    from.current = value;
    return () => controls.stop();
  }, [value, duration]);

  return <span className={className}>{format ? format(display) : Math.round(display)}</span>;
}
