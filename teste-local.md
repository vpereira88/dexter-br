# Teste Local — Dexter BR

## 1. Puxar o branch com as alterações

No terminal, dentro de `C:\Users\User\Documents\Estudos\dexter-br`:

```bash
git fetch origin
git checkout claude/code-review-analysis-9kCWV
```

Ou, se preferir manter no `main` e só aplicar as mudanças:

```bash
git fetch origin
git merge origin/claude/code-review-analysis-9kCWV
```

---

## 2. Atualizar o `gateway.json`

Edite o arquivo em `C:\Users\User\.dexter\gateway.json` com o conteúdo abaixo:

```json
{
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

> **Número autorizado para DM:** `+5513988233050`
> **Grupo autorizado:** `120363216685943550@g.us`

---

## 3. Subir o gateway

```bash
npm run gateway
```

---

## 4. Testar

- **Grupo:** mande uma mensagem no grupo `120363216685943550@g.us` e verifique se o bot responde.
- **DM:** mande uma mensagem direta pelo número `+5513988233050` e veja se é aceita pelo `allowlist`.

Após testar, cole aqui o log do terminal para análise.
