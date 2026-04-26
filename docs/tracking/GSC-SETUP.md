# Google Search Console — Setup Step-by-Step

## Claim via DNS TXT (Domain property — recomendado)

Para cada um dos 36 dominios:

1. **GSC Admin**: https://search.google.com/search-console -> "Add property" -> selecionar **Domain**
2. Inserir dominio (sem protocolo): `exemplo.com.br`
3. GSC retorna registro TXT: `google-site-verification=<hash>`
4. **Hostinger DNS**:
   - Login: hpanel.hostinger.com
   - Dominios -> <dominio> -> DNS / Nameservers
   - Adicionar TXT: host `@`, valor completo retornado pelo GSC, TTL 3600
5. Aguardar 5-30min propagacao (`dig TXT exemplo.com.br`)
6. **GSC** -> "Verify"
7. Apos verificado: **Sitemaps** -> submit `sitemap.xml`
8. Adicionar service account (ver `docs/operations/GSC-AUTOMATION.md`) como **Owner** em Users and permissions

## Checklist 36 dominios

| # | Slug | Dominio | TXT OK | Verified | Sitemap |
|---|------|---------|--------|----------|---------|
| 1 | a01 | | [ ] | [ ] | [ ] |
| 2 | a02 | | [ ] | [ ] | [ ] |
| ... | | | | | |

(preencher conforme dominios forem adquiridos/ativados)

## Troubleshooting
- TXT nao propaga: verificar que registro foi criado no **apex** (host `@`), nao em subdomain
- "Verification failed": aguardar ate 24h em alguns provedores DNS
- Multiplos TXTs Google: OK — podem coexistir

## Bulk via domains file
Alternativa: manter `config/domains.txt` com lista de dominios e rodar script (nao implementado — gap P3).
