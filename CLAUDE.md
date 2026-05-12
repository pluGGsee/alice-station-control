# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Local web service for controlling a Yandex Station Midi (pink, `TP-Link_76DF_5G` home network) from Mac/Windows via browser. Python backend + React frontend on local network. **MVP is complete.**

## Commands

### Backend
```bash
cd work/backend && source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload   # dev
uvicorn main:app --host 0.0.0.0 --port 8000             # prod
```

### Frontend
```bash
cd work/frontend
npm run dev      # :5174, proxies /api → localhost:8000
npm run build    # → dist/
npm run lint
```

### Autostart (launchd — already installed)
```bash
# Starts automatically when on home network 192.168.0.x
# To control manually:
launchctl load   ~/Library/LaunchAgents/com.alice-station.server.plist
launchctl unload ~/Library/LaunchAgents/com.alice-station.server.plist
tail -f ~/Library/Logs/alice-station.log
# Script: ~/.local/bin/alice-station-start.sh
```

### Re-auth (tokens expire in ~weeks)
```bash
cd work/backend && source venv/bin/activate
python3 get_token.py   # new YANDEX_TOKEN
# YANDEX_XTOKEN: browser → https://oauth.yandex.ru/authorize?response_type=token&client_id=23cabbbdc6cd418abb4b39c32c41195d → copy access_token from URL
# SESSION_ID / SESSION_ID2: browser devtools → Application → Cookies → yandex.ru
```

## Architecture

### Backend (`work/backend/`)

**`config.py`** — gitignored. Contains: `YANDEX_TOKEN`, `YANDEX_XTOKEN`, `SESSION_ID`, `SESSION_ID2`, `STATION_IP=192.168.0.102`, `STATION_PORT=1961`, `DEVICE_ID=R10G034001ZSQN`, `PLATFORM=cucumber`.

**`station.py`** — Glagol WebSocket controller. Keeps a **persistent connection** (`_ws` global) — reuses it for all commands (status/volume ~20ms, was ~1000ms). `asyncio.Lock` serializes concurrent commands. `get_status()` reads `playerState` from handshake response — contains current track title/artist/cover. JWT token cached 1h in `_glagol_token`.

**`music.py`** — `yandex-music` wrapper. `get_playlist_tracks()` uses `client.tracks(batch_ids)` bulk request — one API call for 50 tracks (was 30s per-track, now 5s). `_reset_client()` called on auth errors.

**`main.py`** — FastAPI. `/static/` serves user-uploaded playlist covers. CORS open.

**`yandex_glagol.py`, `yandex_quasar.py`, `yandex_session.py`** — copied from AlexxIT/YandexStation v3.20.3. Not a pip package. Relative imports patched to absolute. Auth flow: `Session_id` + `Session_id2` cookies + `YANDEX_XTOKEN` → `YandexSession` → Glagol JWT.

### Frontend (`work/frontend/src/`)

**Layout** (`App.jsx`): two equal `flex-1` columns. Left: `AliceInput` + `PlayerCard` + `SearchBlock`. Right: `QuickCommands` + `PlaylistPanel`. Status polled every 5s from `/api/status`.

**Design system** (`index.css`): grey liquid glass. Classes: `g-panel`, `g-btn`, `g-btn-dark`, `g-input`, `g-header`, `g-row`, `g-skeleton`. Background `#b8b8bc`. Panels: `rgba(210,210,215,0.35) + blur(48px)`. Font: Plus Jakarta Sans.

**Key components:**
- `AliceInput` — textarea with typewriter placeholder (`useTypewriter` hook, `PLACEHOLDERS` array at module level). Templates dropdown via `createPortal(document.body)` (escapes overflow). Web Speech API mic with cleanup on unmount.
- `PlayerCard` — centered cover with ambient glow (blurred bg image behind cover when playing). Persistent WebSocket makes volume/play instant.
- `PlaylistModal` — `createPortal(document.body)`. Paginated load: `offset + limit=50`. File input created dynamically via `document.createElement('input')` — no DOM element.
- `QuickCommands` — light modes only: лава-лампа, свеча, ночник + colors. All via `sendText`.

**Shared utils** (`src/lib/utils.js`): `cn()` for Tailwind merging, `msToMin()` for track duration formatting.

**shadcn/ui** (`src/components/ui/`): uses `@base-ui/react`. Slider: `onValueChange` (not `onValueCommit`). ESLint `react-refresh/only-export-components` disabled for `ui/**`.

**Animations**: `motion/react` (ex framer-motion). Stagger entrance on page load (`containerVariants` + `panelVariants` in App.jsx). Spring buttons. `g-skeleton` shimmer for loading states.

## Key Constraints

- **Tokens expire ~weeks**: `SESSION_ID`/`SESSION_ID2` → 401 on `/api/status` = time to refresh from browser devtools.
- **Glagol JWT** auto-refreshes every hour.
- **`sendText`** is the only command API — used for TTS, voice commands, light modes, track control. ~1s response is the station's processing time, not ours.
- **Track info from playerState only** — yandex-music queues are empty when music started via voice. Always use `/api/status` → `track`, not `/api/music/current`.
- **Volume**: Glagol uses `0.0–1.0`, API accepts `0–10`.
- **Light modes on Midi**: `включи лава-лампу`, `включи режим свеча`, `включи ночник` + any color by name.
- **Playlist covers**: no API — user uploads via `/api/music/playlist-cover`, stored in `static/covers/`, fallback to `localStorage`.

## What's Left for v2

- Schedules / timers
- Smart home control (Zigbee devices via Alice)
- Command history log
- Dark theme toggle
- Docker for Windows deploy
- Production build (npm run build served as FastAPI static)
