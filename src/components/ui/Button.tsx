import * as React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

type BaseProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
};

type AnchorProps = BaseProps & { as: 'a' } & React.AnchorHTMLAttributes<HTMLAnchorElement>;
type ButtonProps = BaseProps & { as?: 'button' } & React.ButtonHTMLAttributes<HTMLButtonElement>;
export type Props = AnchorProps | ButtonProps;

const SIZE_CLASS: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-7 py-3.5 text-lg',
};

const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'cta-primary bg-[var(--color-accent)] text-white hover:opacity-90',
  secondary: 'cta-secondary border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10',
  ghost: 'cta-ghost text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10',
};

const BASE =
  'inline-flex items-center justify-center rounded-md font-semibold transition-colors ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

export function Button(props: Props) {
  const { variant = 'primary', size = 'md', className = '', children, ...rest } = props as BaseProps & { as?: 'a' | 'button' } & Record<string, unknown>;
  const cls = `${BASE} ${SIZE_CLASS[size]} ${VARIANT_CLASS[variant]} ${className}`.trim();

  if ((props as AnchorProps).as === 'a') {
    const { as: _as, ...aRest } = rest as { as?: string };
    void _as;
    return (
      <a className={cls} {...(aRest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    );
  }

  const { as: _as, ...bRest } = rest as { as?: string };
  void _as;
  return (
    <button className={cls} {...(bRest as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}

export default Button;
