import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { TERMS } from '../content/terms';

interface TermProps {
  term: string;
  children?: React.ReactNode;
  showText?: boolean;
}

interface Position {
  top: number;
  left: number;
  width: number;
}

export function Term({ term, children, showText = true }: TermProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position>({ top: 0, left: 0, width: 260 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const id = useId();
  const definition = TERMS[term] ?? term;

  const place = () => {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const width = Math.min(290, window.innerWidth - 24);
    const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
    setPosition({ top: rect.bottom + 8, left, width });
  };

  const show = () => {
    place();
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!buttonRef.current?.contains(event.target as Node)) close();
    };
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  return (
    <span className="term">
      {showText ? <span>{children ?? term}</span> : <span className="sr-only">{term}</span>}
      <button
        ref={buttonRef}
        type="button"
        className="term-btn"
        aria-label={`What is ${term}?`}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onPointerEnter={(event) => {
          if (event.pointerType === 'mouse') show();
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === 'mouse') setOpen(false);
        }}
        onFocus={show}
        onBlur={() => setOpen(false)}
        onClick={() => {
          if (!open) show();
        }}
      >
        ?
      </button>
      {open
        ? createPortal(
            <span
              role="tooltip"
              id={id}
              className="term-pop"
              style={{
                top: position.top,
                left: position.left,
                width: position.width,
              }}
            >
              <span className="term-pop-title">{term}</span>
              {definition}
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}
