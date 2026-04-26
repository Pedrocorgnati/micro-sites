import * as React from 'react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  cta?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, cta, className = '' }: EmptyStateProps) {
  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center text-center py-12 px-4 ${className}`.trim()}
    >
      {icon ? <div className="mb-3 opacity-70" aria-hidden="true">{icon}</div> : null}
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      {description ? <p className="text-sm opacity-70 max-w-md">{description}</p> : null}
      {cta ? <div className="mt-4">{cta}</div> : null}
    </div>
  );
}

export default EmptyState;
