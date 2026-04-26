#!/usr/bin/env bash
# poc-evidence-d01.sh — helper para coleta manual de evidências do POC D01 (TASK-5 / module-6-piloto-d01)
# Uso:
#   bash scripts/poc-evidence-d01.sh fallback     # ST001: fallback WhatsApp (DEGRADED US-007)
#   bash scripts/poc-evidence-d01.sh timing       # ST002: cronômetro criação (SUCCESS US-019)
#   bash scripts/poc-evidence-d01.sh rollback     # ST003: smoke test rollback
#   bash scripts/poc-evidence-d01.sh consolidate  # ST004: gera placeholder consolidado
#
# IMPORTANTE: Este script executa operações DESTRUTIVAS em produção quando chamado com
# os modos `fallback` e `rollback`. Leia a seção correspondente ANTES de rodar.
# Autorização de cada bloco exige confirmação interativa (tecla Y).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EVIDENCE_DIR="$REPO_ROOT/../../docs/micro-sites/delivery/evidence"
SITE_SLUG="d01-calculadora-custo-site"
DEPLOY_BRANCH="deploy-01"
# Resolver hostinger_url e wa_number quando aplicável
D01_URL="${D01_URL:-https://d01.exemplo.com.br}"

mkdir -p "$EVIDENCE_DIR"

confirm() {
    local msg="$1"
    read -r -p "$msg [y/N]: " ans
    case "$ans" in
        [yY]) return 0 ;;
        *) echo "[abort]"; exit 2 ;;
    esac
}

iso() { date -Iseconds; }

cmd_fallback() {
    local LOG="$EVIDENCE_DIR/us-007-degraded.log"
    echo "=== ST001 — Fallback WhatsApp (DEGRADED US-007) ===" > "$LOG"
    echo "Start: $(iso)" >> "$LOG"

    echo ""
    echo "ATENÇÃO: este passo invalida temporariamente o token Static Forms do D01."
    echo "É necessário restaurar ao final, caso contrário o formulário real quebrará."
    confirm "Backup + invalidar token?"

    local CONFIG="$REPO_ROOT/sites/$SITE_SLUG/config.json"
    cp "$CONFIG" "$CONFIG.bak"
    sed -i 's/"accessKey":"[^"]*"/"accessKey":"INVALID_TOKEN_TEST"/' "$CONFIG"
    echo "[$(iso)] Token invalidado em $CONFIG (backup em $CONFIG.bak)" >> "$LOG"

    confirm "Rebuild + redeploy do D01?"
    SITE_SLUG="$SITE_SLUG" bash "$REPO_ROOT/scripts/build-site.sh" "$SITE_SLUG" >> "$LOG" 2>&1
    bash "$REPO_ROOT/scripts/deploy-branch.sh" "$SITE_SLUG" >> "$LOG" 2>&1

    echo ""
    echo "==> Abra $D01_URL/contato no navegador, submeta o form, capture screenshot"
    echo "==> do estado de erro + CTA WhatsApp; salve em $EVIDENCE_DIR/us-007-degraded.png"
    confirm "Screenshot capturado e salvo?"

    echo "[$(iso)] Screenshot registrado (verificação manual)" >> "$LOG"

    confirm "Restaurar token original + redeploy?"
    mv "$CONFIG.bak" "$CONFIG"
    SITE_SLUG="$SITE_SLUG" bash "$REPO_ROOT/scripts/build-site.sh" "$SITE_SLUG" >> "$LOG" 2>&1
    bash "$REPO_ROOT/scripts/deploy-branch.sh" "$SITE_SLUG" >> "$LOG" 2>&1
    echo "[$(iso)] Token restaurado + redeploy concluído" >> "$LOG"
    echo "End: $(iso)" >> "$LOG"

    echo "OK: log em $LOG"
}

cmd_timing() {
    local LOG="$EVIDENCE_DIR/us-019-timing.log"
    local DUMMY="d99-test-timing"
    echo "=== ST002 — Tempo de Criação US-019 ===" > "$LOG"
    echo "Start: $(iso)" >> "$LOG"

    echo ""
    echo "Você vai executar a criação de um site dummy ($DUMMY) seguindo apenas o README."
    confirm "Iniciar cronômetro e executar create-site.sh?"
    echo "[$(iso)] create-site.sh iniciado" >> "$LOG"

    bash "$REPO_ROOT/scripts/create-site.sh" "$DUMMY" >> "$LOG" 2>&1
    echo "[$(iso)] create-site.sh concluído" >> "$LOG"

    echo ""
    echo "==> Edite $REPO_ROOT/sites/$DUMMY/config.json + crie content/hero.md mínimo."
    confirm "Configuração e content preenchidos?"
    echo "[$(iso)] Config e content preenchidos" >> "$LOG"

    SITE_SLUG="$DUMMY" bash "$REPO_ROOT/scripts/build-site.sh" "$DUMMY" >> "$LOG" 2>&1
    echo "[$(iso)] Build concluído" >> "$LOG"

    bash "$REPO_ROOT/scripts/deploy-branch.sh" "$DUMMY" >> "$LOG" 2>&1
    echo "[$(iso)] Deploy iniciado" >> "$LOG"

    echo ""
    echo "==> Aguarde a URL responder 200 e pare o cronômetro."
    confirm "URL respondendo 200?"
    echo "[$(iso)] URL 200 — cronômetro parado" >> "$LOG"
    echo "End: $(iso)" >> "$LOG"
    echo "Total: <calcular manualmente a partir de Start/End>" >> "$LOG"

    confirm "Executar cleanup do site dummy?"
    rm -rf "$REPO_ROOT/sites/$DUMMY"
    git -C "$REPO_ROOT" branch -D "deploy-99" 2>/dev/null || true
    git -C "$REPO_ROOT" push origin --delete "deploy-99" 2>/dev/null || true
    echo "[$(iso)] Cleanup concluído" >> "$LOG"

    echo "OK: log em $LOG"
}

cmd_rollback() {
    local LOG="$EVIDENCE_DIR/rollback-test.log"
    echo "=== ST003 — Smoke Test Rollback ===" > "$LOG"
    echo "Start: $(iso)" >> "$LOG"

    echo ""
    echo "ATENÇÃO: este passo apaga temporariamente a branch $DEPLOY_BRANCH remota."
    echo "A URL $D01_URL ficará fora do ar por ~5 minutos. Execute em janela de baixo tráfego."
    confirm "Confirmar execução em janela segura?"

    echo "[$(iso)] Baseline: curl $D01_URL" >> "$LOG"
    curl -o /dev/null -s -w "baseline=%{http_code}\n" "$D01_URL/" >> "$LOG"

    echo "[$(iso)] Triggering rollback (delete remote $DEPLOY_BRANCH)" >> "$LOG"
    git -C "$REPO_ROOT" push origin --delete "$DEPLOY_BRANCH" >> "$LOG" 2>&1

    echo "[$(iso)] Aguardando TTL Hostinger (120s)..." >> "$LOG"
    sleep 120
    echo "[$(iso)] Pós-rollback: curl $D01_URL" >> "$LOG"
    curl -o /dev/null -s -w "post_rollback=%{http_code}\n" "$D01_URL/" >> "$LOG"

    echo "[$(iso)] Recovery: re-deploy" >> "$LOG"
    bash "$REPO_ROOT/scripts/deploy-branch.sh" "$SITE_SLUG" >> "$LOG" 2>&1

    echo "[$(iso)] Aguardando recovery (300s)..." >> "$LOG"
    sleep 300
    echo "[$(iso)] Pós-recovery: curl $D01_URL" >> "$LOG"
    curl -o /dev/null -s -w "post_recovery=%{http_code}\n" "$D01_URL/" >> "$LOG"
    echo "End: $(iso)" >> "$LOG"

    echo "OK: log em $LOG"
}

cmd_consolidate() {
    local OUT="$EVIDENCE_DIR/POC-EVIDENCE-D01.md"
    if [ -s "$OUT" ]; then
        confirm "$OUT já existe com conteúdo. Sobrescrever?"
    fi
    cat > "$OUT" <<'EOF'
# POC-EVIDENCE-D01 — Relatório de Validação do Piloto

> Consolidação das 3 evidências exigidas pela TASK-5 (GAP-M5-002/003/004).
> Preencher após rodar `poc-evidence-d01.sh {fallback|timing|rollback}`.

| Métrica | Fonte | Veredito |
|---------|-------|----------|
| GAP-M5-002 — Fallback WhatsApp (US-007 DEGRADED) | `evidence/us-007-degraded.log` + `evidence/us-007-degraded.png` | **PENDENTE** |
| GAP-M5-003 — Tempo criação US-019 | `evidence/us-019-timing.log` | **PENDENTE** |
| GAP-M5-004 — Smoke test rollback | `evidence/rollback-test.log` | **PENDENTE** |

---

## 1. US-007 DEGRADED — Fallback WhatsApp

- **Screenshot:** `./us-007-degraded.png` *(anexar após execução manual do ST001)*
- **Log operacional:** `./us-007-degraded.log`
- **Resultado observado:** <preencher — UI exibiu erro + CTA WhatsApp? wa.me abriu com contexto?>
- **Veredito:** PASS / FAIL

## 2. US-019 SUCCESS — Tempo de Criação ≤ 30 min

- **Log cronometrado:** `./us-019-timing.log`
- **Start → End:** <extrair de `Start:` e `End:` no log>
- **Total calculado:** <minutos>
- **Meta (≤ 30 min):** PASS / FAIL
- **Justificativa (se FAIL):** <preencher>

## 3. Smoke Test Rollback (GAP-M5-004)

- **Log completo:** `./rollback-test.log`
- **Baseline HTTP:** <código>
- **Pós-rollback HTTP:** <código>
- **Pós-recovery HTTP:** <código>
- **Tempo de recovery:** <minutos>
- **Veredito:** PASS / FAIL

## 4. Referências

- TASK-5: `output/wbs/micro-sites/modules/module-6-piloto-d01/TASK-5.md`
- MILESTONE-5.md §4.6 (fechamento dos GAPs)
- MODULE-REVIEW.md M-13, M-14, M-27 (atualizar status pós-consolidação)
EOF
    echo "OK: placeholder consolidado em $OUT"
}

main() {
    case "${1:-}" in
        fallback) cmd_fallback ;;
        timing) cmd_timing ;;
        rollback) cmd_rollback ;;
        consolidate) cmd_consolidate ;;
        *)
            echo "Uso: bash scripts/poc-evidence-d01.sh {fallback|timing|rollback|consolidate}" >&2
            exit 1
            ;;
    esac
}

main "$@"
