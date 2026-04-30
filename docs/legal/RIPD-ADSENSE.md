# RIPD — Implantação de Google AdSense na rede `micro-sites`

> **Status:** RASCUNHO. Bloqueado para revisão por DPO/jurídico antes de produção.
> **Base regulatória:** LGPD Art. 38 + Resolução CD/ANPD nº 4/2023.
> **Tipo de operação:** Tratamento de dados pessoais para fins de publicidade contextual.
> **Última revisão:** 2026-04-28 (template inicial — ADS-48).

---

## 1. Identificação

- **Controlador:** SystemForge (forjadesistemas.com.br)
- **Encarregado (DPO):** privacidade@systemforge.com.br
- **Operador:** Google LLC (1600 Amphitheatre Parkway, Mountain View, CA 94043, USA)
- **Escopo:** 36 sites da rede `micro-sites` (categorias A-F).
- **Sistema:** Google AdSense, modo publisher.

## 2. Descrição do tratamento

### 2.1 Categorias de dados pessoais
- Identificadores de cookies (`__gads`, `__gpi`, `IDE`, `NID`).
- Endereço IP truncado (Google trunca antes do armazenamento).
- User agent.
- URL de páginas visitadas (referer).
- Eventos de impressão e clique em anúncio.

**Não há tratamento de:** nome, e-mail, telefone, CPF, dados financeiros, dados de saúde (ver §6).

### 2.2 Categorias de titulares
- Visitantes adultos do território brasileiro.
- **Sites Categoria A (a01..a10 — saúde):** apesar de o conteúdo abordar serviços médicos, **não há coleta de dado sensível de saúde para fins publicitários**. Diagnósticos e calculadoras (`/diagnostico`, `/resultado`) ficam **fora do escopo de monetização** (INV-ADS-06 + INV-ADS-07).

### 2.3 Finalidades específicas
1. Exibição de anúncios contextuais (selecionados pelo conteúdo da página, não pelo histórico do titular).
2. Medição agregada de impressões e cliques.
3. Frequency capping (limitar quantas vezes um anúncio é exibido ao mesmo navegador).
4. Prevenção de fraude / invalid traffic.

### 2.4 Base legal (LGPD Art. 7º)
- **Inciso I — Consentimento:** banner com 3 categorias granulares (Essencial, Analytics, Publicidade). Cookies AdSense só são gravados se "Publicidade" for aceita explicitamente.

### 2.5 Modelo de personalização
- **Default da rede:** Non-Personalized Ads (NPA). Não usa histórico do titular para selecionar anúncios.
- **Categoria A:** NPA forçado, override impossível.
- **Override por env:** `NEXT_PUBLIC_ADSENSE_PERSONALIZATION` pode ser `off`, `npa`, `personalized`. Mudança de modo exige nova revisão deste RIPD e bump de `privacy-version`.

### 2.6 Transferência internacional
- **País destinatário:** Estados Unidos da América.
- **Operador:** Google LLC.
- **Adequação:** Brasil **não** possui decisão de adequação com EUA (ANPD lista apenas União Europeia em 2026-04).
- **Base legal de transferência:** LGPD Art. 33, IX — **consentimento específico e em destaque do titular**, capturado via banner (categoria "Publicidade") com prova auditável (`cookie_consent_proof` localStorage + breadcrumb Sentry).
- **Não se aplicam:** cláusulas contratuais padrão (Art. 33, II) nem normas corporativas globais (Art. 33, IV) — a base é exclusivamente o consentimento.

## 3. Necessidade e proporcionalidade

- O tratamento é necessário para a viabilidade econômica dos sites (receita publicitária custeia hosting, dev, conteúdo).
- Alternativa avaliada: subscription/paywall — descartada por incompatibilidade com público-alvo (PMEs, pesquisa de fornecedor, baixo volume).
- O conjunto de dados é o mínimo necessário (cookies de identificação anônima + URL + eventos), sem coleta de PII direta.

## 4. Riscos identificados

| ID | Risco | Probabilidade | Impacto | Severidade |
|----|-------|---------------|---------|------------|
| R1 | Re-identificação via combinação de cookies + fingerprint passivo | Baixa | Médio | Médio |
| R2 | Vazamento de dados em parceiro (Google) | Muito baixa | Alto | Médio |
| R3 | Inferência indireta de dado sensível (ex: visita a página de saúde indica condição) | Média (mitigado por NPA forçado em Cat A) | Alto | Baixo após mitigação |
| R4 | Falha em obter consent válido (banner com dark pattern) | Baixa | Alto | Médio |
| R5 | Permanência de cookies após revogação | Média | Médio | Baixo após mitigação |
| R6 | Tráfego inadvertido de menor de idade | Média | Alto | Médio |

## 5. Medidas mitigadoras

- **Banner anti-dark-pattern (ADS-05):** botões "Aceitar todos" e "Apenas essenciais" com paridade visual, sem pré-seleção, sem cookie wall.
- **NPA default + forçado em Cat A (ADS-38, ADS-49):** elimina tratamento comportamental.
- **Categoria sensível bloqueada (INV-ADS-06):** `/diagnostico` e `/resultado` em Cat A não exibem ads.
- **Revogação efetiva (ADS-39):** `pauseAdRequests` + unmount de slots + cookie cleanup local + link para opt-out Google.
- **Prova de consentimento (ADS-46):** payload auditável com versão, timestamp, categorias, slug, signature SHA-256.
- **CSP restritivo (ADS-19):** apenas domínios Google AdSense liberados.
- **Privacy Policy explícita (ADS-07):** finalidades, parceiros nominais, transferência internacional, retenção, direitos do titular.
- **Sem segmentação por menor de idade:** texto do banner e Privacy Policy apenas mencionam público adulto. Site não solicita idade. Recomendação editorial: adicionar disclaimer "conteúdo destinado a maiores de 18 anos" em sites Cat A (decisão pendente).

## 6. Direitos do titular

- Acesso, correção, anonimização, portabilidade, eliminação, revogação — atendidos via canal `privacidade@systemforge.com.br` com SLA quantificado (vide `PrivacyPolicy.tsx` tabela LGPD Art. 18).
- Revogação no banner: efeito imediato (UI) + até 5 dias para purge automatizado.
- Para revogar cookies já gravados pelo Google: link direto para [adssettings.google.com](https://adssettings.google.com/) e [opt-out NAI](https://optout.networkadvertising.org/).

## 7. Conclusão e parecer (a preencher pelo DPO)

- [ ] Tratamento aprovado.
- [ ] Aprovado com ressalvas (especificar).
- [ ] Reprovado (especificar motivo).

**Data do parecer:** _____________
**Assinatura DPO:** _____________

---

## Anexos referenciais

- `scheduled-updates/micro-sites/ADSENSE-INVARIANTS.md`
- `scheduled-updates/micro-sites/ADSENSE-IMPLEMENTATION-TASKLIST-v2.md`
- `scheduled-updates/micro-sites/CODEX-REVIEW-V1.md`
- ROPA: `docs/compliance/ROPA.md` (a ser atualizada com novo tratamento)
- Matriz bases legais: `docs/compliance/LEGAL-BASIS-MATRIX.md` (a ser atualizada)
- ANPD — Guia cookies: https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-cookies-e-protecao-de-dados-pessoais.pdf
