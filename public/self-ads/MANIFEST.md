# Self-Ads — Manifest de assets

> Banners proprios servidos como fallback do AdSense em todos os 36 sites
> da rede. Nao precisam de consent.advertising (1st-party, sem cookies).
>
> Lugar canonico: `public/self-ads/{filename}` (servido em `/self-ads/{filename}`).

## Como gerar

1. Criar cada imagem nas dimensoes EXATAS abaixo (pixel-perfect).
2. Exportar como WebP (qualidade 85, lossless OFF).
3. Salvar em `public/self-ads/` com o nome de arquivo da coluna "Path".
4. Rodar `npm run build` para validar.
5. Rodar `node scripts/smoke-adsense.mjs` para confirmar.

## Especificacao por brand × slot × breakpoint

### Marca 1 — Pedro Corgnati (`https://www.corgnati.com`)

| Path | Tamanho | Slot | Breakpoint | Estilo sugerido |
|------|---------|------|------------|-----------------|
| `@ASSET_PLACEHOLDER:corgnati-728x90` | 728×90 px | header / footer | desktop ≥ 768px | Foto profissional + nome + tagline curta + CTA "Ver portfolio" |
| `@ASSET_PLACEHOLDER:corgnati-320x100` | 320×100 px | header / footer | mobile < 768px | Avatar + nome + 1 frase + seta CTA |
| `@ASSET_PLACEHOLDER:corgnati-336x280` | 336×280 px | inArticle | desktop ≥ 1024px | Layout vertical: foto, headline, 2 bullets, CTA |
| `@ASSET_PLACEHOLDER:corgnati-300x250` | 300×250 px | inArticle | < 1024px | Mesmo do 336×280, dimensoes ajustadas |
| `@ASSET_PLACEHOLDER:corgnati-300x600` | 300×600 px | sidebar | desktop only | Skyscraper: foto grande, nome, 3-5 bullets, CTA, logo |

### Marca 2 — Forja de Sistemas (`https://forjadesistemas.com.br`)

| Path | Tamanho | Slot | Breakpoint | Estilo sugerido |
|------|---------|------|------------|-----------------|
| `@ASSET_PLACEHOLDER:forjadesistemas-728x90` | 728×90 px | header / footer | desktop ≥ 768px | Logo + tagline "Sites e sistemas sob medida" + CTA "Pedir orcamento" |
| `@ASSET_PLACEHOLDER:forjadesistemas-320x100` | 320×100 px | header / footer | mobile < 768px | Logo compacto + tagline curta + seta |
| `@ASSET_PLACEHOLDER:forjadesistemas-336x280` | 336×280 px | inArticle | desktop ≥ 1024px | Logo, headline, 2-3 bullets de servicos, CTA |
| `@ASSET_PLACEHOLDER:forjadesistemas-300x250` | 300×250 px | inArticle | < 1024px | Mesmo do 336×280, ajustado |
| `@ASSET_PLACEHOLDER:forjadesistemas-300x600` | 300×600 px | sidebar | desktop only | Logo, headline, 4-6 servicos listados, CTA, social proof |

## Total: 10 imagens (5 por marca)

- 4 bytes em uso multiplo (header e footer reusam o mesmo arquivo).
- 6 sao exclusivas por slot.

## Diretrizes editoriais

- **Sem cores conflitando com a paleta dos sites** — preferir tons neutros
  (preto, branco, cinza) com 1 accent da brand.
- **Tipografia legivel em mobile** — nada abaixo de 14px equivalente em 320px wide.
- **CTA explicito** — botao ou seta visivel.
- **Acessibilidade** — texto sobre fundo com contraste WCAG AA (4.5:1 ratio).
- **Sem "Patrocinado" disclaimer** — sao banners proprios; o `<a rel="sponsored">`
  no DOM ja sinaliza isso.
- **Formato WebP** — fallback automatico do Next/picture nao se aplica aqui
  (servimos direto), entao garantir que WebP cobre 100% dos browsers alvo
  (atual: 97% — sem fallback PNG por simplicidade).

## Checklist pre-deploy

- [ ] 10 arquivos `.png` em `public/self-ads/` com nome exato.
- [ ] `npm run build` passa.
- [ ] Renderizacao manual testada em 2 viewports (mobile 375 + desktop 1280).
- [ ] Links abrem em nova aba e levam ao destino correto (UTM preserved).
- [ ] Lighthouse Performance ≥ 90 (sem regressao por peso de imagem).

## Referencias

- AdSense ad units / sizes: https://support.google.com/adsense/answer/9183549
- Web Almanac responsive images: https://almanac.httparchive.org/en/2024/media

## Placeholders detectados pelo /assets:create

```
@ASSET_PLACEHOLDER:corgnati-728x90
@ASSET_PLACEHOLDER:corgnati-320x100
@ASSET_PLACEHOLDER:corgnati-336x280
@ASSET_PLACEHOLDER:corgnati-300x250
@ASSET_PLACEHOLDER:corgnati-300x600
@ASSET_PLACEHOLDER:forjadesistemas-728x90
@ASSET_PLACEHOLDER:forjadesistemas-320x100
@ASSET_PLACEHOLDER:forjadesistemas-336x280
@ASSET_PLACEHOLDER:forjadesistemas-300x250
@ASSET_PLACEHOLDER:forjadesistemas-300x600
```
