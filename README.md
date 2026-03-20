# Dexter-Br

Dexter-Br é um fork do projeto **Dexter**, originalmente desenvolvido por Virat Singh, adaptado para análise do **mercado financeiro brasileiro**.

O projeto mantém o conceito original de um agente de inteligência artificial para análise financeira, porém com integrações voltadas para ativos da **B3** e dados públicos do mercado brasileiro.

Este projeto foi desenvolvido com auxílio de **Google Antigravity, GPT, Sonnet 4.6 e Gemini 3.1**.

---

## Repositório

https://github.com/vpereira88/dexter-br

---

## Origem do Projeto

Este projeto é baseado no repositório original:

https://github.com/virattt/dexter

O Dexter original é um agente de IA para análise de mercado que utiliza LLMs e ferramentas de coleta de dados para realizar análises financeiras automatizadas.

O **Dexter-Br** estende essa ideia para o contexto brasileiro.

---

## Objetivo

O objetivo do Dexter-Br é permitir análises automatizadas de ativos brasileiros utilizando **apenas dados públicos e gratuitos**.

O projeto elimina a necessidade de APIs pagas utilizadas em algumas implementações do Dexter original.

---

## Fontes de Dados

O projeto utiliza apenas fontes públicas disponíveis na internet, incluindo:

* CVM (Comissão de Valores Mobiliários)
* Fundamentus
* StatusInvest
* Yahoo Finance (séries históricas)
* Brapi, Finnhub, B3 Feed (cotações)

A coleta das informações é realizada por meio de **web scraping controlado**, apenas para obtenção dos dados necessários às análises.

---

## Aviso sobre Dados

Todos os dados utilizados pertencem às suas respectivas plataformas.

O Dexter-Br apenas automatiza a coleta de informações públicas disponíveis na internet para fins educacionais, experimentais e de pesquisa.

Caso alguma plataforma solicite ajustes ou remoção de integração, a solicitação será prontamente atendida.

---

## Funcionalidades

* Agente de IA para análise financeira do mercado brasileiro (B3)
* Suporte a múltiplos provedores de LLM: OpenAI (GPT-5.4), Anthropic (Claude), Google (Gemini), xAI (Grok), Ollama (local) e outros
* Coleta automática de indicadores fundamentalistas (P/L, P/VP, ROE, ROIC, EV/EBITDA, etc.)
* Integração com dados oficiais da CVM (DRE, Balanço Patrimonial, Fluxo de Caixa)
* Análise de histórico de dividendos via StatusInvest
* Votação majoritária para cotações (Yahoo Finance + Brapi + Finnhub + B3 Feed)
* Skill de valuation por DCF com análise de sensibilidade 3×3
* Cache diário de dados fundamentalistas (evita re-fetch desnecessário)
* Alertas automáticos quando scraping detecta mudança de layout
* Retry automático com backoff exponencial nas chamadas de dados
* Gateway WhatsApp com suporte a grupos
* Módulo de memória persistente entre sessões (`~/.dexter/MEMORY.md`)
* Estrutura modular para inclusão de novas fontes de dados

---

## Instalação

Clone o repositório:

```bash
git clone https://github.com/vpereira88/dexter-br.git
```

Entre na pasta do projeto:

```bash
cd dexter-br
```

Instale as dependências:

```bash
bun install
```

Crie o arquivo `.env`:

```bash
cp env.example .env
```

Adicione suas chaves de API:

```bash
# Obrigatório: ao menos um provedor de LLM
OPENAI_API_KEY=your_key_here

# Opcionais: provedores alternativos
ANTHROPIC_API_KEY=your_key_here
GOOGLE_API_KEY=your_key_here

# Opcionais: dados financeiros brasileiros (melhora cobertura de cotações)
BRAPI_API_KEY=your_key_here
FINNHUB_API_KEY=your_key_here
```

Execute o projeto:

```bash
bun start
```

---

## Gateway WhatsApp

O Dexter-Br suporta uso via WhatsApp, incluindo **grupos**.

### Primeiro acesso (login QR Code)

```bash
bun run gateway:login
```

### Iniciar o gateway

```bash
bun run gateway
```

---

### Configuração de Acesso via `.env` (recomendado)

A forma mais simples de configurar quem pode usar o bot é pelo arquivo `.env`.

#### 1. Admin Universal

O **admin** tem acesso irrestrito: pode enviar comandos em qualquer grupo ou conversa, mesmo que o grupo/contato não esteja na allowlist. Ideal para gerenciar o bot remotamente.

```env
DEXTER_ADMIN_PHONE=+5511999999999
```

#### 2. Obtendo o ID de um grupo com `!id`

Para liberar um grupo, o admin precisa do ID dele. Basta entrar no grupo e enviar:

```
!id
```

O bot responde imediatamente com o ID do grupo, mesmo que ele ainda não esteja liberado:

```
*DexterBr*:
*Grupo:* Meu Grupo de Investimentos
*ID:* `120363407692865732@g.us`
```

Copie o ID retornado e adicione no `.env`:

```env
DEXTER_ALLOW_GROUPS=120363407692865732@g.us
```

#### 3. Configuração completa do `.env`

```env
# Admin com acesso irrestrito (formato E.164)
DEXTER_ADMIN_PHONE=+5511999999999

# Contatos liberados para mensagens diretas (separados por vírgula)
DEXTER_ALLOW_PHONES=+5511999999999,+5511888888888

# IDs dos grupos liberados (use !id no grupo para obter)
DEXTER_ALLOW_GROUPS=120363407692865732@g.us,120363407692865733@g.us

# Política para DMs: allowlist | open | disabled
DEXTER_DM_POLICY=allowlist

# Política para grupos: allowlist | open | disabled
DEXTER_GROUP_POLICY=allowlist
```

#### 4. Políticas de acesso

| Política | DM | Grupos | Descrição |
|---|---|---|---|
| `allowlist` | ✅ | ✅ | Apenas contatos/grupos listados (recomendado) |
| `open` | ✅ | ✅ | Qualquer pessoa/grupo pode interagir |
| `disabled` | ✅ | ✅ | Bloqueia totalmente DMs ou grupos |

> **Segurança:** O bot nunca responde a contatos não autorizados — mensagens de números fora da lista são silenciosamente ignoradas.

---

### Comandos do Bot

| Comando | Quem pode usar | Descrição |
|---|---|---|
| `!id` | Admin + autorizados | Retorna o ID do grupo ou número da conversa |
| `!stop` | Admin + autorizados | Para o bot imediatamente |

---

### Configuração avançada via `gateway.json` (OPCIONAL)

**Na maioria dos casos, o `.env` é totalmente suficiente e o `gateway.json` NÃO é necessário.**

O `gateway.json` é utilizado apenas para casos muito específicos:
- Múltiplas contas de WhatsApp
- Roteamento customizado de mensagens para agentes diferentes

Se precisar de `gateway.json`, copie o arquivo de exemplo:

```bash
cp gateway.json.example ~/.dexter/gateway.json
```

Caso contrário, simplesmente delete ou ignore o `gateway.json` — o bot funcionará normalmente com apenas o `.env`.

---

## Skills

O Dexter-Br suporta workflows extensíveis via arquivos `SKILL.md`.

### DCF Valuation

Invoque automaticamente ao perguntar sobre valor intrínseco, preço justo ou análise DCF:

> "Qual o valor justo da PETR4?"
> "Calcule o DCF para VALE3"

O skill DCF executa 8 etapas: coleta de dados, cálculo de FCF, estimativa de WACC, projeção de fluxo de caixa, análise de sensibilidade e validação.

### Criar novos skills

Crie um arquivo `SKILL.md` em qualquer um dos diretórios:
- `src/skills/<nome>/SKILL.md` — skills builtin
- `~/.dexter/skills/<nome>/SKILL.md` — skills do usuário
- `.dexter/skills/<nome>/SKILL.md` — skills do projeto

Estrutura mínima:

```markdown
---
name: meu-skill
description: Quando usar este skill.
maxIterations: 15
---

# Instruções do Skill

...
```

O campo `maxIterations` é opcional e sobrescreve o limite padrão de 10 iterações do agente para análises mais complexas.

---

## Memória Persistente

O agente mantém memória entre sessões via arquivos markdown:

- `~/.dexter/MEMORY.md` — notas de longo prazo
- `~/.dexter/daily/YYYY-MM-DD.md` — notas diárias

Esses arquivos podem ser editados manualmente para guiar o comportamento do agente.

---

## Modelos Suportados

| Provedor | Modelos | Variável de ambiente |
|---|---|---|
| OpenAI (padrão) | `gpt-5.4`, `gpt-5.4-mini`, `gpt-5.4-nano` | `OPENAI_API_KEY` |
| Anthropic | `claude-opus-4-6`, `claude-sonnet-4-6`, `claude-haiku-4-5` | `ANTHROPIC_API_KEY` |
| Google | `gemini-3.1-pro`, `gemini-3-flash`, `gemini-3.1-flash-lite` | `GOOGLE_API_KEY` |
| xAI (Grok) | `grok-*` | `XAI_API_KEY` |
| OpenRouter | `openrouter:<modelo>` | `OPENROUTER_API_KEY` |
| Ollama (local) | `ollama:<modelo>` | `OLLAMA_BASE_URL` |

O modelo padrão é `gpt-5.4`. Em caso de falha, o agente tenta automaticamente `claude-sonnet-4-6` e depois `gemini-3.1-pro`.

---

## Testes

```bash
# Executar todos os testes
bun test

# Modo watch
bun test --watch

# Verificação de tipos
bun run typecheck
```

---

## Estrutura do Projeto

```
src/
├── agent/          # Loop do agente, prompts, scratchpad, token counter
├── cli.ts          # Interface CLI (TUI com pi-tui)
├── gateway/        # Gateway WhatsApp (Baileys)
│   └── group/      # Detecção de menção, histórico e membros de grupos
├── memory/         # Memória persistente entre sessões
├── model/          # Abstração multi-provedor de LLM
├── skills/         # Sistema de skills (SKILL.md)
│   └── dcf/        # Skill de valuation DCF
└── tools/
    ├── brazil/     # Tools específicas do mercado brasileiro
    │   ├── cvm.ts                  # Dados oficiais CVM
    │   ├── fundamentus.ts          # Scraping Fundamentus
    │   ├── status-invest.ts        # API StatusInvest
    │   ├── historical.ts           # Séries históricas Yahoo Finance
    │   ├── brazilian-market-search.ts  # Cotações por votação majoritária
    │   ├── brazilian-fundamentals.ts   # Agregador de fundamentals
    │   └── daily-cache.ts          # Cache diário TTL
    └── ...         # Tools genéricas (web search, browser, etc.)
```

---

## Licença

Este projeto é distribuído sob a **MIT License**.

O projeto original Dexter também utiliza a mesma licença.

Copyright (c) 2025 Virat Singh
Modifications (c) 2026 Dexter-Br Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files to deal in the Software without restriction.

Consulte o arquivo `LICENSE` para mais detalhes.

---

## Créditos

Projeto original:

Dexter
https://github.com/virattt/dexter

Fork e adaptações para o mercado brasileiro:

Dexter-Br
https://github.com/vpereira88/dexter-br

Desenvolvido com auxílio de:

Google Antigravity
GPT
Sonnet 4.6
Gemini 3.1
