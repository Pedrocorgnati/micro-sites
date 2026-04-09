'use client';

import { useFormContext } from 'react-hook-form';

export function HoneypotField() {
  const { register } = useFormContext();

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: '-9999px',
        opacity: 0,
        pointerEvents: 'none',
      }}
    >
      <label htmlFor="hp-field">Não preencher</label>
      <input
        id="hp-field"
        type="text"
        autoComplete="off"
        tabIndex={-1}
        {...register('honeypot')}
      />
    </div>
  );
}
