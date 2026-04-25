# Optional: Remote Access via Caddy + Tailscale Funnel

> **Reference, not turnkey.** Every Tailscale tailnet, domain, and auth
> setup is different. Use this as a starting blueprint; expect to adapt
> for your environment.

## What this gets you

- A web UI for your wiki accessible from any device (phone, laptop, work box)
- HTTPS with auto-renewing certificates (via Caddy)
- Public exposure via [Tailscale Funnel](https://tailscale.com/kb/1223/funnel)
  (or stay private on your tailnet)
- A login page protecting the wiki behind a password

If you don't need remote access, stop reading. Local Obsidian is enough.

## Architecture

```
Any device browser (public or via Tailscale)
        ↓ HTTPS
   Tailscale Funnel (public) or direct (tailnet)
        ↓
   Caddy (TLS termination + custom login page)
        ↓
   SilverBullet or Obsidian-web (Docker)
        ↓
   <vault>/  (this directory)
        ↑
   Claude Code or other agent (SSH)
```

## Prerequisites

- A machine that's on 24/7 (home server, VPS, cloud VM)
- [Tailscale](https://tailscale.com) installed and authenticated
- Docker
- A reasonable understanding of Caddy reverse-proxy syntax

## Outline of steps

1. Pick a wiki web UI: [SilverBullet](https://silverbullet.md) (recommended,
   markdown-native, Obsidian-flavored) or self-hosted alternatives.

2. Run it via Docker, pointing at this vault directory as a bind mount.

3. Put Caddy in front. Caddy auto-handles HTTPS via Tailscale's MagicDNS
   certificates when you use a `*.ts.net` domain.

4. Add a login page (basic auth, OAuth, or a custom HTML form posting
   credentials to a Caddy `forward_auth` endpoint).

5. Decide: tailnet-only (private) or [Tailscale Funnel](https://tailscale.com/kb/1223/funnel)
   (public). Funnel exposes the service to the internet through Tailscale's
   relay; it's free for one HTTPS port per tailnet.

## Sketch — Caddyfile

```caddy
your-name.tail-XXXX.ts.net {
  # If you want a custom login page for the wiki:
  handle /login {
    file_server browse {
      root /etc/caddy/login
    }
  }

  # Auth check (basic auth example; replace with forward_auth for real OAuth)
  basicauth {
    you HASH_FROM_CADDY_HASH_PASSWORD_COMMAND
  }

  reverse_proxy localhost:3000
}
```

## Sketch — Docker Compose

```yaml
services:
  silverbullet:
    image: zefhemel/silverbullet
    volumes:
      - ./:/space
    ports:
      - "127.0.0.1:3000:3000"
    restart: unless-stopped

  caddy:
    image: caddy:2-alpine
    network_mode: host
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - ./caddy_data:/data
      - ./caddy_config:/config
      - ./login:/etc/caddy/login
    restart: unless-stopped
```

## Funnel ON / OFF

```bash
# Expose to public internet
tailscale funnel 443 on

# Pull back to tailnet-only
tailscale funnel 443 off

# Status
tailscale funnel status
```

## Trade-offs

| Mode | Pros | Cons |
|------|------|------|
| Tailscale-only (no Funnel) | Private, not on the public internet | Every device needs Tailscale installed |
| Tailscale Funnel ON | Any browser anywhere | Password is your only line of defense — pick a strong one |

## Hardening checklist

- [ ] Strong, unique password (use `caddy hash-password`)
- [ ] Rate limiting on `/login` (e.g. via Caddy `rate_limit` plugin)
- [ ] Logs: `caddy logs` review weekly for unexpected traffic
- [ ] Cert auto-renewal: confirmed working (Caddy handles this; verify monthly)
- [ ] Backup the vault to a separate location (git push to a private repo is the easiest)

## When this is overkill

Most users do not need this. Local Obsidian on a single device is sufficient
for personal wikis. Add remote access only when you actually want to capture
ideas from your phone or a different machine.

---

Part of a personal LLM wiki built on the [Karpathy "LLM Wiki" pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f).
