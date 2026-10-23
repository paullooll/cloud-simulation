import type { ReactNode } from 'react';

interface TableWrapProps {
  label: string;
  className?: string;
  children: ReactNode;
}

export function TableWrap({ label, className, children }: TableWrapProps) {
  return (
    <div
      className={`table-wrap${className ? ` ${className}` : ''}`}
      role="region"
      aria-label={label}
      tabIndex={0}
    >
      {children}
    </div>
  );
}
