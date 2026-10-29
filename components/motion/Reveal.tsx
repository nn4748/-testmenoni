"use client";

import { motion } from "motion/react";

const EASE = [0.16, 1, 0.3, 1] as const;

// يطلع العنصر من ضبابية إلى حدّة لما يوصل له التمرير.
export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
  onMount = false,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "p";
  // داخل التطبيق نحرّك العنصر أول ما يظهر، بدل ما ننتظر التمرير.
  onMount?: boolean;
}) {
  const Tag = motion[as];
  const shown = { opacity: 1, y: 0, filter: "blur(0px)" };
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: onMount ? 16 : 28, filter: "blur(10px)" }}
      {...(onMount ? { animate: shown } : { whileInView: shown, viewport: { once: true, amount: 0.15 } })}
      transition={{ duration: onMount ? 0.9 : 1.1, ease: EASE, delay }}
    >
      {children}
    </Tag>
  );
}

// يكشف النص سطر سطر من تحت قناع.
export function MaskLines({ lines, className, lineClassName, delay = 0 }: {
  lines: React.ReactNode[];
  className?: string;
  lineClassName?: string;
  delay?: number;
}) {
  return (
    <span className={className}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.08em]">
          <motion.span
            className={`block ${lineClassName ?? ""}`}
            initial={{ y: "105%" }}
            whileInView={{ y: "0%" }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: EASE, delay: delay + i * 0.12 }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
