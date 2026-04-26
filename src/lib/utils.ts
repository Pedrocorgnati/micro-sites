import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { CalculatorType } from '@/types';
import { formatBRL } from './format-brl';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// TASK-24 ST001 / CL-624 — formatResult delega para formatBRL canonico.
export function formatResult(value: number, type: CalculatorType): string {
  switch (type) {
    case 'calculator':
      return formatBRL(value);
    case 'diagnostic':
      return `${value} pontos`;
    case 'checklist':
      return `${value}%`;
  }
}
