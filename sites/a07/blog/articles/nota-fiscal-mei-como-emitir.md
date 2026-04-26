---
title: 'Nota Fiscal MEI: Como Emitir Passo a Passo'
description: >-
  Aprenda como emitir nota fiscal como MEI, quando é obrigatório emitir, os
  sistemas gratuitos disponíveis e como evitar erros.
slug: nota-fiscal-mei-como-emitir
date: '2026-04-09'
author: SystemForge
tags:
  - nota fiscal MEI
  - NFS-e
  - faturamento
  - emissão de NF
readingTime: 7
category: Caso de Uso
funnelStage: MOFU
searchIntent: How-to
siteSlug: a07
dateModified: '2026-04-09'
authorMeta:
  name: Equipe SystemForge
  url: 'https://systemforge.com.br/sobre'
---

# Nota Fiscal MEI: Como Emitir Passo a Passo

Emitir nota fiscal como MEI gera dúvidas para a maioria dos microempreendedores, especialmente quando o cliente exige documento fiscal mas o MEI não sabe qual tipo emitir, como acessar o sistema ou quais campos preencher. Este guia resolve essas dúvidas de forma direta e prática.

## Quando o MEI É Obrigado a Emitir Nota Fiscal?

| Situação | Obrigatório emitir? |
|---------|-------------------|
| Venda para pessoa jurídica (empresa com CNPJ) | **Sim — sempre** |
| Prestação de serviço para empresa (CNPJ) | **Sim — sempre** |
| Venda para pessoa física que solicita NF | **Sim — quando solicitado** |
| Venda para pessoa física que não solicita | Depende do município (verifique) |
| Venda de produto com emissão de cupom fiscal | Sim (ECF ou NFC-e) |

A regra geral é: **quando o cliente é uma empresa (CNPJ), a emissão é sempre obrigatória**. Isso é importante porque muitas empresas só pagam fornecedores MEI mediante nota fiscal — e a ausência do documento bloqueia o pagamento.

## Tipos de Nota Fiscal para MEI

### NFS-e — Nota Fiscal de Serviço Eletrônica
Para MEIs prestadores de serviço (consultores, designers, cozinheiros, manicures, fotógrafos, etc.). É emitida pelo portal da prefeitura do município onde o MEI está cadastrado.

### NF-e — Nota Fiscal Eletrônica (Modelo 55)
Para MEIs que vendem produtos. É o documento eletrônico utilizado para comércio e indústria em operações interestaduais ou para empresas.

### NFC-e — Nota Fiscal de Consumidor Eletrônica
Para vendas presenciais de produtos ao consumidor final (pessoa física). Substitui o cupom fiscal em lojas físicas.

**Regra geral:** Se você presta serviços, emite NFS-e. Se vende produtos, emite NF-e ou NFC-e.

## Sistemas Gratuitos para Emitir Nota Fiscal

**1. Portal da Prefeitura Municipal**
Cada município tem seu próprio sistema de NFS-e. O MEI acessa com CPF/CNPJ e senha cadastrada. É gratuito, mas a interface varia muito de cidade para cidade. Cidades maiores como São Paulo (nota.prefeitura.sp.gov.br) e Rio de Janeiro têm portais mais robustos.

**2. Nota Fiscal Eletrônica Nacional (NF-e)**
Para produtos (NF-e modelo 55), o MEI pode usar o emissor gratuito da Receita Federal (emissor-nfe.fazenda.gov.br). Requer certificado digital, mas MEI pequeno pode se cadastrar no regime especial de emissão via NF-e avulsa em alguns estados.

**3. NFe.io (Gratuito até 50 NFS-e/mês)**
Plataforma online que integra com os portais de mais de 300 municípios. Permite emissão em poucos cliques, sem necessidade de navegador específico. Gratuito até 50 notas por mês — suficiente para a maioria dos MEIs de serviço.

**4. Nuvemfiscal e Omie (planos gratuitos limitados)**
Plataformas de gestão fiscal que incluem emissão de NFS-e. Úteis para MEIs que querem centralizar controle financeiro e emissão de notas. Planos pagos a partir de R$ 49/mês oferecem mais volume e integrações.

## Passo a Passo Completo: Emitir NFS-e no Portal da Prefeitura

**Passo 1 — Acesse o portal da Nota Fiscal da sua prefeitura**
Pesquise "[nome da sua cidade] emitir NFS-e" ou "nota fiscal de serviços [cidade]". Guarde o link nos favoritos.

**Passo 2 — Faça login com CNPJ MEI e senha**
Na primeira vez, pode ser necessário cadastro com dados do CNPJ, e-mail e criação de senha. Algumas prefeituras exigem comparecimento presencial ou envio de documentos para habilitação inicial.

**Passo 3 — Clique em "Emitir Nota Fiscal"**
Selecione o serviço como "Prestador de Serviços" e preencha os dados do tomador (quem está recebendo/pagando o serviço):

**Campos obrigatórios:**
- CNPJ ou CPF do tomador
- Razão social ou nome
- Endereço completo do tomador
- E-mail para envio da NF (quando disponível)

**Passo 4 — Preencha os dados do serviço**

| Campo | Como preencher |
|-------|----------------|
| Código do serviço (CNAE/LC 116) | Deve corresponder à sua atividade registrada no MEI |
| Discriminação do serviço | Descreva o serviço prestado de forma clara (ex.: "Serviço de design gráfico conforme briefing do cliente") |
| Valor total | Valor bruto cobrado do cliente |
| Alíquota ISS | Alíquota definida pelo município para seu código de serviço (normalmente 2% a 5%) |
| Competência | Mês/ano em que o serviço foi prestado |

**Passo 5 — Confira e emita**
Revise todos os campos antes de emitir. Após a emissão, a NFS-e recebe um número sequencial e um código de verificação. Envie o PDF ao cliente.

## Erros Comuns na Emissão de Nota Fiscal MEI

**Erro 1 — Alíquota de ISS errada**
Cada serviço tem uma alíquota específica definida pela prefeitura. Se você prestou serviço de programação (alíquota 2%) mas lançou como consultoria (alíquota 5%), está pagando ISS a mais. Verifique a lista de serviços LC 116/2003 e a tabela do seu município.

**Erro 2 — Código de serviço incorreto**
O código CNAE da NFS-e deve corresponder ao código registrado no seu MEI. Se forem diferentes, a nota pode ser rejeitada ou gerar questionamento da Receita.

**Erro 3 — Emitir NF-e de produto sendo prestador de serviço**
Muitos MEIs de serviço tentam emitir NF-e (para produto) por desconhecimento. O cliente rejeita ou o sistema bloqueia porque o CNAE não é de comércio.

**Erro 4 — Não guardar cópia das notas emitidas**
As notas emitidas devem ser guardadas por pelo menos 5 anos para fins fiscais. Faça download do PDF e salve em nuvem.

**Erro 5 — Emitir nota com valor superior ao limite MEI**
Se o total de notas emitidas no ano ultrapassar R$ 81.000, o MEI é automaticamente desenquadrado pela Receita Federal na competência seguinte. Controle seu faturamento acumulado mensalmente.

## Multas por Falta de Emissão de Nota Fiscal

A falta de emissão de nota fiscal quando obrigatória pode gerar:
- **Auto de infração municipal (ISS):** Geralmente 50% a 100% do valor da nota não emitida
- **Notificação da Receita Federal:** Em caso de recebimentos via transferência bancária sem correspondência em notas fiscais
- **Exclusão do Simples Nacional:** Em casos de infração sistemática e comprovada

---

**Quer deixar a emissão de notas e toda a parte fiscal nas mãos de especialistas?** Nossa contabilidade digital cuida de tudo — emissão de notas, guias, declarações e planejamento tributário — para você focar no seu negócio. [Conheça nossos planos](/contato).

Veja também: [Desenquadramento do MEI: Quando e Como Ocorre](/blog/desenquadramento-mei-quando-acontece)

Leia também: [Diferenças entre MEI, ME e EPP: qual é o ideal para você](/blog/diferenca-mei-me-epp).
