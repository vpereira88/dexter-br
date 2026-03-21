# Teste Local — Dexter Gateway

## 1. Atualizar o código

No terminal dentro de `C:\Users\User\Documents\Estudos\dexter-br`:

```bash
git fetch origin
git merge origin/claude/code-review-analysis-9kCWV
```

---

## 2. Configurar o `gateway.json`

Abra (ou crie) o arquivo em:

```
C:\Users\User\.dexter\gateway.json
```

Cole o conteúdo abaixo:

```json
{
  "_comment": "Configuração local de teste — Dexter Gateway",
  "gateway": {
    "accountId": "default",
    "logLevel": "info"
  },
  "channels": {
    "whatsapp": {
      "enabled": true,
      "accounts": {
        "default": {
          "dmPolicy": "allowlist",
          "allowFrom": ["+5513988233050"],
          "groupPolicy": "open",
          "allowedGroups": ["120363216685943550@g.us"],
          "groupAllowFrom": ["*"],
          "sendReadReceipts": true
        }
      }
    }
  },
  "bindings": [
    {
      "agentId": "default",
      "match": {
        "channel": "whatsapp",
        "peerId": "120363216685943550@g.us",
        "peerKind": "group"
      }
    }
  ]
}
```

---

## 3. Iniciar o gateway

```bash
npm run gateway
```

Aguarde aparecer no console:

```
[whatsapp] Connected
```

---

## 4. Testar

| Cenário | Como testar | Resultado esperado |
|---|---|---|
| **Grupo** | Mande qualquer mensagem de texto no grupo `120363216685943550` | Bot responde no grupo |
| **DM** | Mande mensagem direta para o número do bot a partir de `+5513988233050` | Bot responde no DM |
| **Grupo bloqueado** | Mande mensagem em outro grupo onde o bot esteja | Bot ignora, sem leitura |

---

## 5. Verificar o log de debug

Se algo não funcionar, abra:

```
C:\Users\User\.dexter\gateway-debug.log
```

Linhas importantes a observar:

```
[inbound] upsert type=notify          ← mensagem chegou
[inbound] access allowed=true         ← passou no controle de acesso
[inbound] body="sua mensagem"         ← texto extraído corretamente
[gateway] handleInbound from=...      ← chegou no handler principal
[gateway] reply sent                  ← resposta enviada
```

Se aparecer `denyReason=group_not_in_allowed_list`, o grupo não está na lista `allowedGroups`.
