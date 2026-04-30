/**
 * Blog Daily — News Relevance Gate.
 *
 * Decide se uma noticia (encontrada via Tavily news search) e relevante o
 * suficiente para virar story do dia em substituicao ao proximo da fila
 * evergreen.
 *
 * Criterios canonicos (4 — definidos em groups.json por grupo):
 *  - alters_decision   — afeta decisao de compra (preco, prazo, regulacao, lancamento)
 *  - alters_cost       — mudanca macro (Selic, IPCA, tributacao)
 *  - alters_compliance — LGPD, marco regulatorio, mudanca de lei
 *  - alters_demand     — Trends spike por keywords do master-strategy
 *
 * Regra: passa se >= min_criteria_required (default 1).
 *
 * Esta funcao e PURE — recebe news + group config + signals coletados,
 * retorna boolean + motivo. Nao chama Tavily diretamente (caller faz).
 */

import type { GroupConfig } from './groups-loader';

export type RelevanceCriterion =
  | 'alters_decision'
  | 'alters_cost'
  | 'alters_compliance'
  | 'alters_demand';

export interface NewsItem {
  title: string;
  description: string;
  url: string;
  publishedAt: string; // ISO 8601
  source: string;
}

export interface RelevanceSignals {
  /** Termos de preco/custo encontrados no titulo/desc (ex: "preco", "custo", "tarifa", "selic"). */
  priceMentions: string[];
  /** Termos de compliance/regulatorio (ex: "LGPD", "ANPD", "lei", "regulamento"). */
  complianceMentions: string[];
  /** Termos de decisao (ex: "lancamento", "novo", "estreia", "muda regra"). */
  decisionMentions: string[];
  /** Spike de trends para keywords do master-strategy do grupo (≥ 1.5x baseline). */
  demandSpikeKeywords: string[];
}

export interface RelevanceVerdict {
  passes: boolean;
  matchedCriteria: RelevanceCriterion[];
  reason: string;
}

const PRICE_TERMS = [
  // Custo direto
  'preco', 'custo', 'tarifa', 'taxa', 'mensalidade', 'plano', 'fatura',
  // Macro/financeiro
  'selic', 'ipca', 'inflacao', 'juros', 'cambio', 'dolar', 'tributacao',
  'imposto', 'icms', 'iss', 'pis', 'cofins', 'simples nacional',
  // Movimentos
  'reajuste', 'aumento', 'desconto', 'oferta', 'promocao', 'mais caro',
  'mais barato', 'aumenta', 'aumentou', 'sobe', 'cai', 'reduz', 'reduzido',
];

const COMPLIANCE_TERMS = [
  // Privacidade / dados
  'lgpd', 'anpd', 'gdpr', 'compliance', 'privacidade', 'dado pessoal',
  // Regulatorio Brasil
  'lei', 'regulamento', 'regulamentacao', 'normativa', 'resolucao', 'decreto',
  'instrucao normativa', 'medida provisoria', 'mp ', 'pl ',
  // Setoriais
  'cfm', 'oab', 'cfc', 'anvisa', 'anatel', 'cvm', 'bcb', 'cade',
  'marco civil', 'lc 116', 'cadastro', 'multa', 'sancao',
  // Auditoria
  'fiscalizacao', 'audit', 'auditoria',
];

const DECISION_TERMS = [
  // Lancamento / release
  'lancamento', 'lancou', 'lanca', 'estreia', 'novo', 'nova versao',
  'nova feature', 'release', 'preview', 'beta', 'disponibiliza',
  'disponibilizou', 'disponivel', 'ja disponivel', 'rollout',
  // Anuncio
  'anuncia', 'anunciou', 'anunciado', 'comunica', 'apresenta', 'revela',
  // Mudanca de regra
  'muda regra', 'mudanca', 'altera', 'alterou', 'atualiza', 'atualizacao',
  'aprovacao', 'aprovou', 'aprovado', 'libera', 'liberou', 'liberado',
  // Movimentacao corporativa
  'parceria', 'aquisicao', 'adquire', 'fusao', 'investimento', 'rodada',
  // Estrategicos
  'descontinua', 'encerra', 'desativa', 'shutdown',
];

function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function hasAnyTerm(text: string, terms: string[]): string[] {
  const norm = normalizeText(text);
  return terms.filter((t) => norm.includes(t));
}

/** Extrai sinais brutos de 1 noticia. Caller pode mesclar com Trends data externamente. */
export function extractSignalsFromNews(news: NewsItem): Omit<RelevanceSignals, 'demandSpikeKeywords'> {
  const haystack = `${news.title} ${news.description}`;
  return {
    priceMentions: hasAnyTerm(haystack, PRICE_TERMS),
    complianceMentions: hasAnyTerm(haystack, COMPLIANCE_TERMS),
    decisionMentions: hasAnyTerm(haystack, DECISION_TERMS),
  };
}

/**
 * Avalia se a noticia passa no relevance gate para o grupo dado.
 * `minCriteria` configuravel (default 1, conforme config.json).
 */
export function evaluateRelevance(
  signals: RelevanceSignals,
  group: GroupConfig,
  minCriteria: number = 1,
): RelevanceVerdict {
  const matched: RelevanceCriterion[] = [];

  // Filtra apenas criterios que o grupo declarou relevantes (newsRelevanceCriteria).
  const groupCriteria = (group.newsRelevanceCriteria ?? []) as RelevanceCriterion[];

  if (groupCriteria.includes('alters_decision') && signals.decisionMentions.length > 0) {
    matched.push('alters_decision');
  }
  if (groupCriteria.includes('alters_cost') && signals.priceMentions.length > 0) {
    matched.push('alters_cost');
  }
  if (groupCriteria.includes('alters_compliance') && signals.complianceMentions.length > 0) {
    matched.push('alters_compliance');
  }
  if (groupCriteria.includes('alters_demand') && signals.demandSpikeKeywords.length > 0) {
    matched.push('alters_demand');
  }

  const passes = matched.length >= minCriteria;
  const reason = passes
    ? `news passou relevance gate de ${group.id} (${matched.length}/${minCriteria} criterios): ${matched.join(', ')}`
    : `news rejeitada pelo gate de ${group.id} (${matched.length}/${minCriteria} criterios). Group exige um de: ${groupCriteria.join(', ')}`;

  return { passes, matchedCriteria: matched, reason };
}

/**
 * Helper: avalia uma news + grupo em uma unica chamada, sem demand-spike data
 * (caso onde Trends nao foi consultado — fallback minimal).
 */
export function evaluateNewsForGroup(
  news: NewsItem,
  group: GroupConfig,
  minCriteria: number = 1,
): RelevanceVerdict {
  const partial = extractSignalsFromNews(news);
  const signals: RelevanceSignals = { ...partial, demandSpikeKeywords: [] };
  return evaluateRelevance(signals, group, minCriteria);
}
