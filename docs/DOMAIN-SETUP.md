# Domain Setup — Guia de Substituição de Placeholders

**Projeto:** Micro Sites — Rede de Aquisição da SystemForge
**Atualizado em:** 2026-04-12

---

## Visão Geral

Todos os 36 sites saem do build com `siteUrl` configurado como `https://DOMAIN.com` por padrão.
Quando um domínio real for atribuído a um site, siga este checklist para substituir corretamente.

**Encontrar todas as referências ao placeholder:**

```bash
grep -r "DOMAIN.com" sites/
```

---

## Checklist por Site

Execute os passos abaixo para cada site que receber um domínio real.

### 1. Atualizar config.json

```bash
# Arquivo: sites/{slug}/config.json
```

- [ ] Atualizar campo `siteUrl` → `https://meu-dominio.com.br`
- [ ] Atualizar campo `seo.canonical` → `https://meu-dominio.com.br`
- [ ] Atualizar `seo.ogImage` se referenciar o domínio antigo
- [ ] Verificar `crossLinks` que apontam para este site — atualizar `href` em outros configs

### 2. Rebuild do site

```bash
bash scripts/build-site.sh {slug}
```

- [ ] Build sem erros ou warnings de domínio
- [ ] Verificar `dist/{slug}/sitemap.xml` — URLs corretas
- [ ] Verificar `dist/{slug}/robots.txt` — `Sitemap:` apontando para domínio correto
- [ ] Abrir `dist/{slug}/index.html` e confirmar canonical tag

### 3. Deploy

```bash
bash scripts/deploy-branch.sh {slug} deploy-NN
```

- [ ] Push para branch de deploy executado com sucesso
- [ ] Sitemap submetido ao Google (passo automático do deploy-branch.sh)

### 4. Configuração de DNS

- [ ] Criar registro DNS:
  - Hostinger: painel → Domínios → Gerenciar → DNS
  - **A record:** `@` → IP do servidor Hostinger
  - **CNAME:** `www` → `@` (ou domínio raiz)
- [ ] Aguardar propagação DNS (5min–48h, típico 1–2h)
- [ ] Validar propagação: `dig meu-dominio.com.br +short`

### 5. SSL/HTTPS

- [ ] Ativar SSL no painel da Hostinger (Let's Encrypt — gratuito)
- [ ] Verificar redirect HTTP → HTTPS automático
- [ ] Testar: `curl -I http://meu-dominio.com.br` deve retornar `301` para HTTPS

### 6. Google Search Console

- [ ] Adicionar propriedade no [Google Search Console](https://search.google.com/search-console)
- [ ] Verificar propriedade via tag HTML ou DNS TXT record
- [ ] Submeter sitemap: `https://meu-dominio.com.br/sitemap.xml`
- [ ] Confirmar que sitemap foi processado (pode levar 24–72h)

---

## Ordem Recomendada

```
1. Atualizar config.json
2. Rebuild (bash scripts/build-site.sh {slug})
3. Deploy (bash scripts/deploy-branch.sh {slug} deploy-NN)
4. DNS
5. SSL
6. Google Search Console
```

Nunca configure DNS/SSL antes de ter o build com o domínio correto — evita erros de canonical duplicado.

---

## Sites e Branches de Deploy

Consultar `docs/deploy-map.sh` para o mapeamento completo de `{slug}` → `deploy-NN`.

```bash
bash docs/deploy-map.sh        # Lista todos os sites e suas branches
bash docs/deploy-map.sh {slug} # Exibe branch de deploy de um site específico
```

---

## Troubleshooting

| Problema | Causa provável | Solução |
|----------|---------------|---------|
| Canonical ainda com DOMAIN.com após deploy | config.json não atualizado | Re-editar config e rebuild |
| SSL não ativa automaticamente | DNS não propagado ainda | Aguardar propagação e tentar de novo no painel |
| Search Console rejeita sitemap | Site retornando 404 ou HTTPS incorreto | Verificar SSL e redirect HTTP→HTTPS |
| crossLinks quebrados | Outros configs ainda apontam para DOMAIN.com | Buscar com `grep -r "DOMAIN.com" sites/` |
