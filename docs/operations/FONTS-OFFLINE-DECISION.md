# FONTS-OFFLINE-DECISION

**Status:** DECIDIDO — fechamento de TASK-25 ST001
**Data:** 2026-04-25
**Decisor:** Pedro Corgnati (proprietario) + Claude (intake-review:review-executed)
**Substitui:** PENDING-ACTIONS bloco "fonts woff2 manual download"

---

## Contexto

A TASK-25 ST001 originalmente requeria download manual dos arquivos `.woff2` das fontes Google (Inter + Plus Jakarta Sans) para garantir build 100% offline. Esta decisao formaliza por que o item esta CLOSED sem download manual.

## Pesquisa de risco

`src/app/layout.tsx` linha 2 importa fontes via:

```ts
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
```

Comportamento documentado do `next/font/google`:

1. **Build-time download:** Next.js baixa os arquivos `.woff2` durante `next build` para `.next/static/media/` (auto-self-hosting).
2. **Zero runtime CDN:** O HTML servido em producao referencia apenas paths locais (`/_next/static/media/{hash}.woff2`). Nenhuma chamada a `fonts.gstatic.com` em runtime.
3. **CSS otimizado:** Next.js gera `@font-face` com `src: url('/_next/static/media/...')` apenas, eliminando FOUT.

Validacao automatizada: `scripts/audit-third-party-fonts.ts` (CI gate, TASK-25 ST002) confirma **zero refs externas a `fonts.gstatic.com`/`fonts.googleapis.com` em `dist/`**. Workflow corre em todo PR.

## Cenarios em que o download manual seria obrigatorio

| Cenario | Aplicavel? |
|---------|-----------|
| Build em ambiente sem internet (air-gapped CI) | **Nao** — CI Hostinger e GitHub Actions tem internet outbound |
| Bloqueio firewall corporativo a `fonts.gstatic.com` em build | **Nao** — build roda em GitHub Actions, sem firewall outbound bloqueante |
| LGPD/compliance proibindo qualquer dependencia transiente Google | **Mitigado** — runtime nao chama Google. Build chama apenas `fonts.googleapis.com/css2` (CSS metadata) e baixa woff2 do CDN, mas o BUILD acontece em US-east no GitHub Actions, fora do escopo LGPD do site servido |
| Reproducibilidade hash-pinned dos arquivos de fonte | **Mitigado** — `package-lock.json` pinneia `next` versao; `next/font` versiona a copia auto-self-hosted por hash de conteudo |

## Decisao

**FECHADO sem download manual.** O risco residual e zero para a operacao planejada (CI publico + sites servidos a publico brasileiro). Caso futuramente seja necessario:

- **Trigger:** mudanca para CI air-gapped, ou requisito legal explicito de zero-Google na cadeia de build.
- **Acao:** baixar manualmente `Inter-Regular.woff2`, `Inter-Bold.woff2`, `PlusJakartaSans-Regular.woff2`, `PlusJakartaSans-Bold.woff2` para `public/fonts/` e migrar de `next/font/google` para `next/font/local` apontando para os paths.
- **Esforco:** ~30 min (download + ajuste de import + rebuild).

## Verificacao

Comando de auditoria periodica (mensal via workflow):

```bash
npx tsx scripts/audit-third-party-fonts.ts
# Esperado: exit 0, mensagem "0 refs externas em dist/"
```

## Referencias

- `src/app/layout.tsx:2`
- `scripts/audit-third-party-fonts.ts`
- `docs/operations/BOT-SCRAPING-MITIGATION.md` (ressalva de seguranca correlata)
- Next.js docs: `node_modules/next/dist/docs/` — `next/font/google` self-hosting comportamento
- `INTAKE-REVIEW-REPORT.md` §7 ressalva 1
