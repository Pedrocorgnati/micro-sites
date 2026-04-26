'use client';

interface PrintButtonProps {
  label?: string;
}

export function PrintButton({ label = 'Baixar como PDF' }: PrintButtonProps) {
  return (
    <button
      type="button"
      data-testid="print-button"
      className="print-hidden inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors duration-150 hover:opacity-80"
      style={{
        borderColor: 'var(--color-accent)',
        color: 'var(--color-accent)',
        backgroundColor: 'transparent',
      }}
      onClick={() => window.print()}
    >
      <svg
        aria-hidden="true"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="6 9 6 2 18 2 18 9" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" />
      </svg>
      {label}
    </button>
  );
}
