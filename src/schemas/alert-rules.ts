// CL-260, CL-266 — schema canonico de AlertRule
import { z } from 'zod';

export const AlertSeverity = z.enum(['info', 'warning', 'critical']);
export const AlertComparator = z.enum(['<', '<=', '>', '>=', '==']);

export const AlertRuleSchema = z.object({
  id: z.string().regex(/^[A-Z][A-Z0-9_]+$/, 'ID em SCREAMING_SNAKE_CASE'),
  description: z.string().min(10),
  metric: z.string().min(3),
  threshold: z.number(),
  comparator: AlertComparator,
  window: z.string().regex(/^(\d+)(m|h|d)$/),
  channel: z.string().min(3),
  severity: AlertSeverity,
  owner: z.string().email(),
  runbook: z.string().optional(),
});

export const AlertRulesFileSchema = z.object({
  $schema: z.string().optional(),
  version: z.string(),
  lastUpdatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rules: z.array(AlertRuleSchema).min(8, 'Cobertura minima — 8 regras canonicas'),
});

export type AlertRule = z.infer<typeof AlertRuleSchema>;
export type AlertRulesFile = z.infer<typeof AlertRulesFileSchema>;

import fs from 'node:fs';
import path from 'node:path';

export function loadAlertRules(repoRoot: string = process.cwd()): AlertRulesFile {
  const file = path.join(repoRoot, 'config/alert-rules.json');
  const raw = fs.readFileSync(file, 'utf8');
  const parsed = JSON.parse(raw);
  return AlertRulesFileSchema.parse(parsed);
}

export function findRule(rules: AlertRulesFile, id: string): AlertRule | undefined {
  return rules.rules.find((r) => r.id === id);
}
