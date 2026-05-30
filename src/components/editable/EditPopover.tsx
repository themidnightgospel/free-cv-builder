import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface EditPopoverProps {
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
}

export const EditPopover: React.FC<EditPopoverProps> = ({
  anchorRef,
  onClose,
  children,
  width = 360,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(
    null,
  );

  useLayoutEffect(() => {
    const popover = popoverRef.current;
    if (!popover) return;

    let cancelled = false;
    let rafId: number | null = null;

    const compute = () => {
      const anchor = anchorRef.current;
      if (!anchor) {
        // Anchor ref may not be attached yet on the first render after mount.
        rafId = requestAnimationFrame(compute);
        return;
      }
      if (cancelled) return;
      const rect = anchor.getBoundingClientRect();
      const popHeight = popover.offsetHeight || 0;
      const margin = 12;
      let top = rect.bottom + 8;
      let left = rect.left + rect.width / 2 - width / 2;

      if (top + popHeight > window.innerHeight - margin) {
        const flipped = rect.top - popHeight - 8;
        if (flipped >= margin) {
          top = flipped;
        } else {
          top = Math.max(margin, window.innerHeight - popHeight - margin);
        }
      }

      if (left + width > window.innerWidth - margin) {
        left = window.innerWidth - width - margin;
      }
      if (left < margin) left = margin;

      setPosition({ top, left });
    };

    compute();
    window.addEventListener('resize', compute);
    window.addEventListener('scroll', compute, true);
    return () => {
      cancelled = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', compute);
      window.removeEventListener('scroll', compute, true);
    };
  }, [anchorRef, width]);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      const popover = popoverRef.current;
      const anchor = anchorRef.current;
      if (!popover) return;
      const target = event.target as Node;
      if (popover.contains(target) || anchor?.contains(target)) return;
      onClose();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    // Defer so the triggering click doesn't immediately close
    const timer = window.setTimeout(() => {
      document.addEventListener('mousedown', handleMouseDown);
    }, 0);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, anchorRef]);

  return createPortal(
    <div
      ref={popoverRef}
      role="dialog"
      style={{
        top: position?.top ?? -9999,
        left: position?.left ?? -9999,
        width,
        visibility: position ? 'visible' : 'hidden',
      }}
      className="fixed z-40 max-h-[80vh] overflow-y-auto rounded-2xl border border-slate-200 bg-paper p-4 shadow-lift"
    >
      {children}
    </div>,
    document.body,
  );
};
