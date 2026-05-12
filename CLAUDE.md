# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Local web service for controlling a Yandex Station Midi smart speaker from Mac/Windows via browser. Two-part stack: Python backend + React frontend, all running on the local network.

## Commands

### Backend
```bash
cd work/backend
source venv/bin/activate          # activate Python 3.14 venv
uvicorn main:app --host 0.0.0.0 --port 8000 --reload   # dev server
uvicorn main:app --host 0.0.0.0 --port 8000             # production
```

### Frontend
```bash
cd work/frontend
npm run dev        # dev server on :5174 (proxies /api → localhost:8000)
npm run build      # production build → dist/
npm run lint       # ESLint check
```

### Re-auth (when tokens expire)
```bash
cd work/backend && source venv/bin/activate
python3 get_token.py    # get new YANDEX_TOKEN (yandex-music OAuth)
# For YANDEX_XTOKEN: open in browser:
# https://oauth.yandex.ru/authorize?response_type=token&client_id=23cabbbdc6cd418abb4b39c32c41195d
# Copy access_token from redirect URL
# Update SESSION_ID / SESSION_ID2 from browser devtools → Application → Cookies → yandex.ru
```

## Architecture

### Backend (`work/backend/`)

**`config.py`** — all secrets and device constants. In `.gitignore`. Contains:
- `YANDEX_TOKEN` — yandex-music OAuth token
- `YANDEX_XTOKEN` — Yandex Passport x-token (for Glagol API)
- `SESSION_ID` / `SESSION_ID2` — browser cookies for YandexSession
- `STATION_IP=192.168.0.102`, `STATION_PORT=1961`, `DEVICE_ID=R10G034001ZSQN`, `PLATFORM=cucumber`

**`station.py`** — controls the physical speaker via Glagol WebSocket (`wss://192.168.0.102:1961`). Flow: get JWT token from `https://quasar.yandex.net/glagol/token` → WebSocket handshake → send command. Token is cached 1 hour. `get_status()` returns current track from `playerState` in the handshake response (not a separate request).

**`music.py`** — wraps `yandex-music` library. `get_playlist_tracks()` uses `client.tracks(batch_ids)` for a single bulk request instead of per-track fetches (critical for performance — 30s → 5s).

**`main.py`** — FastAPI app. Mounts `/static/` for user-uploaded playlist covers stored in `static/covers/`. CORS is open (`allow_origins=["*"]`).

**`yandex_glagol.py`, `yandex_quasar.py`, `yandex_session.py`** — copied from [AlexxIT/YandexStation](https://github.com/AlexxIT/YandexStation) repo (v3.20.3). Not a pip package. Relative imports were patched to absolute. `YandexSession` requires `aiohttp.ClientSession` + browser cookies + x-token to authenticate.

### Frontend (`work/frontend/src/`)

**Two-column layout** (`App.jsx`): left column (AliceInput + PlayerCard + SearchBlock), right column (QuickCommands + PlaylistPanel). Both `flex-1`.

**State**: single `status` object polled every 5s from `GET /api/status`. Contains `{ online, playing, volume, aliceState, track }`. Track info comes directly from the speaker's Glagol `playerState`, not from yandex-music queues (queues only work when music is started from the app, not voice commands).

**Design system** (`index.css`): grey liquid glass. CSS classes `g-panel`, `g-btn`, `g-btn-dark`, `g-input`, `g-header`, `g-row`. Background `#b8b8bc`. Panels: `rgba(210,210,215,0.35)` + `blur(48px)`. Font: Plus Jakarta Sans.

**Dropdowns / modals that escape overflow**: `PlaylistModal` and the templates dropdown in `AliceInput` both use `createPortal(document.body)` — required because parent containers have `overflow-y-auto`.

**Playlist covers**: stored in `localStorage` as base64 fallback, or uploaded to `/api/music/playlist-cover` → served from `/static/covers/{kind}.{ext}`. File input is created dynamically (`document.createElement('input')`) — no DOM element to avoid Playwright file chooser interception.

**shadcn/ui** components (`src/components/ui/`) use `@base-ui/react` under the hood. Slider uses `onValueChange` (not `onValueCommit`). ESLint rule `react-refresh/only-export-components` is disabled for `src/components/ui/**`.

## Key Constraints

- **Tokens expire**: `SESSION_ID`/`SESSION_ID2` browser cookies expire in ~weeks. When `401` errors appear on `/api/status`, update them from browser devtools.
- **Glagol JWT** refreshes automatically every hour (cached in `station._glagol_token`).
- **`sendText` command** is used for everything — TTS, voice commands, and light modes. There's no separate "execute command" API.
- **Light modes** supported by Station Midi: `включи лава-лампу`, `включи режим свеча`, `включи ночник` + colors via voice.
- **Volume** is `0.0–1.0` in Glagol protocol, but `/api/volume` accepts `0–10` and converts.
- **Playlist tracks** are loaded with `offset` + `limit=50` pagination via `client.tracks(batch_ids)`.
