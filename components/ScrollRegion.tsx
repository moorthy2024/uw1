"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";

interface ScrollRegionProps {
  children: ReactNode;
  /** Extra classes for the outer wrapper. */
  className?: string;
  /** Extra classes for the inner scrolling element. */
  innerClassName?: string;
  /** Accessible label for the scroll region. */
  ariaLabel?: string;
  /** Optional footer text, e.g. "12 items · scroll for more". */
  footer?: ReactNode;
  /** Tailwind color the bottom fade blends into (default white). */
  fadeColor?: string;
}

/**
 * A viewport-fitting scroll container used across dashboards so the
 * "there is more content below" affordance is consistent: the body scrolls
 * inside its own widget, a bottom fade appears while more is hidden, and an
 * optional count/footer strip stays pinned beneath it.
 */
export function ScrollRegion({
  children,
  className = "",
  innerClassName = "",
  ariaLabel,
  footer,
  fadeColor = "#ffffff",
}: ScrollRegionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [showFade, setShowFade] = useState(false);

  const update = () => {
    const el = ref.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 1;
    setShowFade(el.scrollHeight > el.clientHeight + 1 && !atBottom);
  };

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children]);

  return (
    <div className={`flex flex-col min-h-0 ${className}`}>
      <div className="relative flex-1 min-h-0">
        <div
          ref={ref}
          onScroll={update}
          tabIndex={0}
          role="region"
          aria-label={ariaLabel}
          className={`h-full overflow-auto ${innerClassName}`}
        >
          {children}
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-6 transition-opacity duration-200"
          style={{
            opacity: showFade ? 1 : 0,
            background: `linear-gradient(to top, ${fadeColor}, transparent)`,
          }}
        />
      </div>
      {footer != null && (
        <div className="flex-shrink-0 pt-1.5 text-[11px] text-[#9B9B98]">{footer}</div>
      )}
    </div>
  );
}

