# Connecting AnkiConnect from WSL

AnkiConnect runs on **Windows**, but when you develop inside WSL2 the two environments have separate network namespaces by default — so `localhost:8765` in WSL does not reach AnkiConnect on the Windows side.

This guide covers the three ways to bridge the gap, ordered from best to worst.

---

## Option 1 — Mirrored networking (recommended)

WSL 0.67+ on Windows 11 supports a `networkingMode=mirrored` setting that shares the Windows network stack with WSL. When enabled, `localhost` in WSL resolves directly to the Windows loopback — **no AnkiConnect configuration changes needed**.

### Check your WSL version

```bash
wsl --version
# WSL version: 2.x.x  (needs 0.67.6+)
```

If your version is older, update WSL:

```powershell
# Run in Windows PowerShell (admin)
wsl --update
```

### Enable mirrored networking

Create or edit `%USERPROFILE%\.wslconfig` on **Windows** (e.g. `C:\Users\you\.wslconfig`):

```ini
[wsl2]
networkingMode=mirrored
```

Then restart WSL:

```powershell
wsl --shutdown
```

### Verify it works

```bash
# From inside WSL
curl -s -X POST http://localhost:8765 \
  -H "Content-Type: application/json" \
  -d '{"action":"version","version":6}'
# → {"result":6,"error":null}
```

### Update ankiniki config

```bash
ankiniki config --set ankiConnectUrl=http://localhost:8765
```

---

## Option 2 — Windows host IP (legacy WSL2 NAT)

If you cannot use mirrored networking, WSL exposes the Windows host at a special IP address that changes on every boot. You can read it at runtime:

```bash
# Get the Windows host IP from inside WSL
WINDOWS_HOST=$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}')
echo $WINDOWS_HOST   # e.g. 172.28.80.1
```

### Configure AnkiConnect to accept connections from WSL

By default AnkiConnect only listens on `127.0.0.1`. You need to change its `webBindAddress` so it also accepts connections coming from the WSL subnet.

In Anki: **Tools → Add-ons → AnkiConnect → Config**

```json
{
  "webBindAddress": "0.0.0.0",
  "webBindPort": 8765,
  "webCorsOriginList": ["http://localhost"]
}
```

> **Security note:** `0.0.0.0` makes AnkiConnect reachable from any interface on your machine, including your LAN. If you are on a trusted home/work network this is typically fine, but be aware that anyone on the same network could send requests to AnkiConnect. Do **not** do this on public Wi-Fi. Revert to `127.0.0.1` when you don't need WSL access.

Restart Anki after changing the config.

### Update ankiniki config dynamically

Add this to your `~/.bashrc` or `~/.zshrc` in WSL so the URL resolves correctly every session:

```bash
export ANKI_HOST=$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}')
```

Then set the URL:

```bash
ankiniki config --set ankiConnectUrl=http://${ANKI_HOST}:8765
# e.g. http://172.28.80.1:8765
```

Or use it inline each time:

```bash
WINDOWS_HOST=$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}')
ankiniki config --set ankiConnectUrl=http://${WINDOWS_HOST}:8765
```

### Verify it works

```bash
WINDOWS_HOST=$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}')
curl -s -X POST http://${WINDOWS_HOST}:8765 \
  -H "Content-Type: application/json" \
  -d '{"action":"version","version":6}'
# → {"result":6,"error":null}
```

---

## Option 3 — Tailscale IP

If you use Tailscale for networking between your machines (or between the Windows host and WSL when using a split-tunnel setup), you can point ankiniki at the **Tailscale IP of the Windows machine** instead of a dynamic WSL gateway IP.

This requires the same `webBindAddress` change as Option 2 — AnkiConnect must listen on `0.0.0.0` (or specifically on the Tailscale interface).

### Find the Windows Tailscale IP

In Windows:

```powershell
tailscale ip -4
# e.g. 100.64.0.5
```

Or check in the Tailscale tray icon → My devices → this machine.

### Update ankiniki config

```bash
ankiniki config --set ankiConnectUrl=http://100.64.0.5:8765
```

**Advantage over Option 2:** The Tailscale IP is stable across reboots, so you set it once and never need to update it again.

**Prerequisite:** Tailscale must be running on both the Windows host and inside WSL (or use Tailscale's Windows app which automatically makes the host reachable from WSL via the Tailscale subnet).

---

## Quick comparison

|                           | Option 1 (mirrored)    | Option 2 (host IP)        | Option 3 (Tailscale)       |
| ------------------------- | ---------------------- | ------------------------- | -------------------------- |
| AnkiConnect config change | None                   | `webBindAddress: 0.0.0.0` | `webBindAddress: 0.0.0.0`  |
| IP changes on reboot      | No                     | Yes                       | No                         |
| Exposes to LAN            | No                     | Yes (while enabled)       | Tailscale subnet only      |
| Requires                  | Windows 11 + WSL 0.67+ | WSL2 (any version)        | Tailscale on both sides    |
| **Recommended?**          | ✅ Yes                 | Fallback                  | If already using Tailscale |

---

## Verify the final setup

Regardless of which option you use, confirm everything is wired up correctly:

```bash
# Check ankiniki can reach AnkiConnect
ankiniki status

# Or test directly
curl -s -X POST $(ankiniki config --show | grep ankiConnectUrl | awk '{print $2}') \
  -H "Content-Type: application/json" \
  -d '{"action":"version","version":6}'
```

`ankiniki status` should show a green tick next to AnkiConnect.
