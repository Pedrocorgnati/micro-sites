# Auditoria de Footprint de Rede — 2026-04-18

**Sites analisados:** 37
**Alertas:** 2

| Severidade | Regra | Site | Mensagem |
|-----------|-------|------|----------|
| error | cross-links-excess | b01-sem-site-profissional | 4 crossLinks (max 3) — reduz visibilidade de rede ao Google |
| error | cross-links-excess | b03-sem-automacao | 4 crossLinks (max 3) — reduz visibilidade de rede ao Google |

## Como corrigir
- `cross-links-excess`: reduzir `crossLinks[]` para <= 3 em `sites/<slug>/config.json`.
- `mega-menu-excess`: remover mega-menu ou limitar a <=5 sites visiveis.
- `footer-all-sites`: remover listagem de todos os sites do Footer.