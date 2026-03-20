# WhatsApp Gateway

Chat with Dexter through WhatsApp by linking your phone to the gateway. The recommended production setup is: **admin override enabled**, **DM allowlist for contacts**, and **group allowlist for approved groups**.

## Table of Contents

- [✅ Prerequisites](#-prerequisites)
- [🔗 How to Link WhatsApp](#-how-to-link-whatsapp)
- [🚀 How to Run](#-how-to-run)
- [💬 How to Chat](#-how-to-chat)
- [⚙️ Configuration](#️-configuration)
- [🔄 How to Relink](#-how-to-relink)
- [🐛 Troubleshooting](#-troubleshooting)
- [🔧 Full Reset](#-full-reset)

## ✅ Prerequisites

- Dexter installed and working (see main [README](../../../../README.md))
- WhatsApp installed on your phone
- Your phone connected to the internet

## 🔗 How to Link WhatsApp

Link your WhatsApp account to Dexter by scanning a QR code:

```bash
bun run gateway:login
```

This will:
1. Display a QR code in your terminal
2. Open WhatsApp on your phone
3. Go to **Settings > Linked Devices > Link a Device**
4. Scan the QR code

Once linked, your phone number is automatically added to the DM allowlist and credentials are saved to `~/.dexter/credentials/whatsapp/default/`.

## 🚀 How to Run

Start the gateway to begin receiving messages:

```bash
bun run gateway
```

You should see:
```
[whatsapp] Connected
Dexter gateway running. Press Ctrl+C to stop.
```

The gateway will now listen for incoming WhatsApp messages and respond using Dexter.

## 💬 How to Chat

Once the gateway is running:

1. Open WhatsApp on your phone
2. Send a DM from an allowed phone number **or** talk from an allowlisted group
3. If you are the configured admin, you can also talk to the bot before whitelisting a group
4. You'll see a typing indicator while Dexter processes
5. Dexter's response will appear in the same chat

**Example conversation:**
```
You: What was NVIDIA's revenue in 2024?
Dexter: NVIDIA's revenue for fiscal year 2024 was $60.9 billion...
```

## ⚙️ Configuration

The gateway configuration is stored at `~/.dexter/gateway.json`. It's auto-created when you run `gateway:login`, but for most setups the easiest path is configuring access via `.env`.

**Minimal gateway.json example:**
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
          "groupPolicy": "allowlist",
          "groupAllowFrom": []
        }
      },
      "allowFrom": ["+1234567890"]
    }
  },
  "bindings": []
}
```

**Key settings:**

| Setting | Description |
|---------|-------------|
| `channels.whatsapp.allowFrom` | Phone numbers allowed to message Dexter (E.164 format) |
| `channels.whatsapp.accounts.default.groupAllowFrom` | Allowed WhatsApp group IDs (`@g.us`) when `groupPolicy=allowlist` |
| `channels.whatsapp.enabled` | Enable/disable the WhatsApp channel |
| `gateway.logLevel` | Log verbosity: `silent`, `error`, `info`, `debug` |

**Recommended `.env` access setup:**

```env
DEXTER_ADMIN_PHONE=+5511999999999
DEXTER_ALLOW_PHONES=+5511999999999,+5511888888888
DEXTER_ALLOW_GROUPS=120363407692865732@g.us,120363407692865733@g.us
DEXTER_DM_POLICY=allowlist
DEXTER_GROUP_POLICY=allowlist
```

**Important rules:**

- `DEXTER_ADMIN_PHONE` bypasses all allowlists and can use `!id` to discover a group ID before whitelisting it
- `DEXTER_ALLOW_PHONES` controls direct-message access when `DEXTER_DM_POLICY=allowlist`
- `DEXTER_ALLOW_GROUPS` controls group access when `DEXTER_GROUP_POLICY=allowlist`
- Group allowlists use **group IDs** like `120363407692865732@g.us`, not phone numbers
- Self-chat still works for the linked number, but group access is decided by the group policy/allowlist

## 🔄 How to Relink

If you need to relink your WhatsApp (e.g., after logging out or switching phones):

1. Stop the gateway (Ctrl+C)
2. Delete the credentials:
   ```bash
   rm -rf ~/.dexter/credentials/whatsapp/default
   ```
3. Run login again:
   ```bash
   bun run gateway:login
   ```
4. Scan the new QR code

## 🐛 Troubleshooting

**Gateway shows "Disconnected":**
- Check your internet connection
- Try relinking (see above)

**Messages not being received:**
- Verify your phone number is in `DEXTER_ALLOW_PHONES` (or `allowFrom` in `gateway.json`)
- Verify the group ID is in `DEXTER_ALLOW_GROUPS` / `groupAllowFrom` when `groupPolicy=allowlist`
- If the group is not whitelisted yet, use the admin phone and send `!id` in the group to capture the ID

**Debug logs:**
- Check `~/.dexter/gateway-debug.log` for detailed logs

## 🔧 Full Reset

If you're experiencing persistent issues (connection problems, encryption errors, messages not sending), perform a full reset:

1. **Stop the gateway** (Ctrl+C if running)

2. **Unlink from WhatsApp:**
   - Open WhatsApp on your phone
   - Go to **Settings > Linked Devices**
   - Tap on the Dexter device and select **Log Out**

3. **Clear all local data:**
   ```bash
   rm -rf ~/.dexter/credentials/whatsapp/default
   rm -rf ~/.dexter/gateway.json
   rm -rf ~/.dexter/gateway-debug.log
   ```

4. **Relink and start fresh:**
   ```bash
   bun run gateway:login
   ```

5. **Scan the QR code** and start the gateway:
   ```bash
   bun run gateway
   ```

This clears all cached credentials and encryption sessions, which resolves most connection issues.
