/**
 * formatBRL — helper canonico de formatacao monetaria BRL.
 *
 * TASK-24 ST001 (CL-624) — substitui usos diretos de Intl.NumberFormat espalhados.
 *
 * Exemplos:
 *   formatBRL(1234.5)              -> "R$ 1.234,50"
 *   formatBRL(1234.5, { compact: true })  -> "R$ 1,2 mil"
 *   formatBRL(1500000, { compact: true }) -> "R$ 1,5 mi"
 *   formatBRL(NaN)                 -> "R$ 0,00"
 *   formatBRL(undefined as any)    -> "R$ 0,00"
 */

export interface FormatBRLOptions {
  /** Notacao compacta (1.2 mil, 1.5 mi). Default false. */
  compact?: boolean;
  /** Casas decimais (default 2; compact ignora). */
  fractionDigits?: number;
  /** Mostrar simbolo "R$" (default true). */
  showSymbol?: boolean;
}

export function formatBRL(amount: number, opts: FormatBRLOptions = {}): string {
  const { compact = false, fractionDigits = 2, showSymbol = true } = opts;

  const safe = Number.isFinite(amount) ? amount : 0;

  const baseOpts: Intl.NumberFormatOptions = showSymbol
    ? { style: 'currency', currency: 'BRL' }
    : { style: 'decimal', minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits };

  if (compact) {
    return new Intl.NumberFormat('pt-BR', {
      ...baseOpts,
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1,
    }).format(safe);
  }

  return new Intl.NumberFormat('pt-BR', {
    ...baseOpts,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(safe);
}
