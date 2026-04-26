# ADR — PDF generator para lead magnets estaticos

**Status:** Accepted
**Data:** 2026-04-18
**Contexto:** TASK-1 intake-review (CL-123, CL-118..CL-122)

## Contexto

Os sites D01-D05 e F01 prometem um "relatorio/checklist/diagnostico" baixavel como lead
magnet. O INTAKE declara a entrega, mas nenhuma geracao real existe. Precisamos escolher
uma biblioteca de PDF que rode no pipeline de build (Node 20+, tsx), sem dependencia de
browser headless e com bundle enxuto.

## Opcoes avaliadas

| Lib | Pros | Contras | Veredito |
|-----|------|---------|----------|
| `@react-pdf/renderer` | DSL JSX familiar; suporta layout complexo | Runtime React extra; ~2MB; depende de react-reconciler | Rejeitada — overhead para relatorios tabulares simples |
| `pdfkit` | Estavel, popular | API imperativa com state mutante; streams; tipagens fracas | Rejeitada — DX ruim para templates declarativos |
| `pdf-lib` | Puro TS/JS, funcional; API declarativa; sem deps nativas; 0.3MB | Requer codigo manual para layout tabular | **Escolhida** |

## Decisao

Usar **`pdf-lib`** (`npm i pdf-lib`). A API `drawText`/`drawRectangle`/`setFont` e suficiente
para os templates tabulares definidos em `sites/{slug}/content/pdf-template.json`.

## Consequencias

- Um builder generico `src/lib/pdf-generator.ts` recebe config + template JSON e gera o PDF.
- Header/footer sao fixos (SystemForge logo textual + CTA WhatsApp) — nao dependem do template.
- Tamanho alvo: < 500KB por PDF (pdf-lib gera PDFs compactos sem fontes embutidas alem das
  Standard14).
- Se no futuro algum site precisar de layout mais rico (graficos, imagens), avaliamos promover
  aquele template para `@react-pdf/renderer` sem quebrar os demais.

## POC

POC validado manualmente via `scripts/generate-pdf.ts` que itera sites elegiveis
(`config.leadMagnet.enabled === true` e slug em lista curada) e gera
`dist/{slug}/relatorio.pdf`.
