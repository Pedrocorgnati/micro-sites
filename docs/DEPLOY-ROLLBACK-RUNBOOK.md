# Deploy Rollback Runbook

## Quando fazer rollback
- 5xx >5% em janela 5min apos deploy
- Lighthouse mobile <0.80 em produção apos deploy
- Formulário principal quebrado (Static Forms 4xx)
- Layout quebrado em ≥1 página critica (home, resultado, contato)

## Procedimento
```bash
bash scripts/rollback-deploy.sh <slug>
# ou, sem prompt:
bash scripts/rollback-deploy.sh <slug> --force
```
O script executa: `git checkout deploy-{N}` → `git revert HEAD --no-edit` → `git push origin deploy-{N}`.

## Validação pós-rollback
1. `curl -I https://{dominio}/` → HTTP 200
2. Smoke test: home + /contato + /resultado renderizam
3. Formulário de contato: envio teste com email `qa+rollback@systemforge.com.br`
4. Verificar `deploy-log.txt` contém linha `rollback ... reverted_sha=<sha>`

## Casos edge
- **Branch com múltiplos commits quebrados**: revert manual em sequência (`git revert HEAD~0..HEAD~N`) ou `git reset --hard <sha-bom>` + `git push --force` (somente com autorização explícita).
- **Branch inconsistente com main**: recriar `deploy-{N}` a partir de main último estável + re-deploy.
- **Revert de revert**: `git revert <revert-sha>` re-aplica a mudança original.

## Aprovação
- Staging: qualquer dev pode fazer rollback
- Produção: aprovação do Pedro (owner) via WhatsApp ou issue no GitHub

## Gaps cobertos
- CL-294 (procedimento rollback documentado)
- CL-295 (resumo deploy-all)
- CL-054 (deploy-log agregado)
